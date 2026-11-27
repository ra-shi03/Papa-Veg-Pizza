import { FoodBusinessSettings } from '../models/businessSettings.model.js';
import { sendResponse } from '../../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../../services/cloudinary.service.js';
import { validateBusinessSettingsDto, TOGGLE_FIELDS } from '../validators/businessSettings.validator.js';
import { clearBusinessInfoCache, findBusinessSettings, getBusinessInfo, getTrainStations } from '../services/businessSettings.service.js';
import { openStoreIds } from '../../franchise/services/storeHours.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodAppConfig } from '../../settings/models/appConfig.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

/** Public: display fields only, briefly cached. Reading never creates a record. */
export async function getPublicBusinessSettings(req, res, next) {
    try {
        res.set('Cache-Control', 'public, max-age=60');
        return sendResponse(res, 200, 'Business settings fetched successfully', await getBusinessInfo());
    } catch (error) {
        next(error);
    }
}

/** Public: the stations a customer can pick for a train order (name and code only). */
export async function getPublicTrainStations(req, res, next) {
    try {
        res.set('Cache-Control', 'public, max-age=60');
        return sendResponse(res, 200, 'Train stations fetched successfully', await getTrainStations());
    } catch (error) {
        next(error);
    }
}

/**
 * Every mapped store must be able to take orders: an unapproved or inactive one is refused with its station named.
 * A store that is only closed right now is accepted (it opens again) and reported back as a warning.
 */
async function checkTrainStores(trainDelivery) {
    const rows = [
        ...(trainDelivery.stations || []).map((s) => ({ label: `Station ${s.name}`, storeId: s.storeId })),
        ...(trainDelivery.defaultStoreId ? [{ label: 'The default train store', storeId: trainDelivery.defaultStoreId }] : []),
    ];
    const stores = await FoodStore.find({ _id: { $in: rows.map((r) => r.storeId) } }).select('storeName approvalStatus isActive').lean();
    const byId = new Map(stores.map((s) => [String(s._id), s]));
    for (const row of rows) {
        const store = byId.get(String(row.storeId));
        if (!store) throw new ValidationError(`${row.label}: choose a store from the list`);
        if (store.approvalStatus !== 'Approved') throw new ValidationError(`${row.label}: ${store.storeName} is not approved yet, so it cannot take orders`);
        if (store.isActive === false) throw new ValidationError(`${row.label}: ${store.storeName} is switched off, so it cannot take orders`);
    }
    const open = await openStoreIds(stores.map((s) => s._id));
    return rows
        .filter((row) => !open.has(String(row.storeId)))
        .map((row) => `${row.label}: ${byId.get(String(row.storeId)).storeName} is closed right now. Train orders are refused until it opens.`);
}

/** Super admin: the record itself. */
/**
 * "Online payment only" (Toggle Management) is App Configuration's Cash on Delivery switch, inverted: one switch, which
 * the cart and order placement already obey.
 */
const onlinePaymentOnlyNow = async () => (await FoodAppConfig.findOne().select('codEnabled').lean())?.codEnabled === false;

export async function getBusinessSettings(req, res, next) {
    try {
        const settings = (await findBusinessSettings().lean()) || (await FoodBusinessSettings.create({})).toObject();
        return sendResponse(res, 200, 'Business settings fetched successfully', { ...settings, onlinePaymentOnly: await onlinePaymentOnlyNow() });
    } catch (error) {
        next(error);
    }
}

export async function updateBusinessSettings(req, res, next) {
    try {
        // Handles both JSON and multipart/form-data
        let body;
        try {
            body = req.body?.data ? (typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data) : req.body;
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }
        const { phoneCountryCode, phoneNumber, ...fields } = validateBusinessSettingsDto(body);
        let warnings = [];

        if (fields.trainDelivery) {
            fields.trainDelivery = { stations: fields.trainDelivery.stations || [], defaultStoreId: fields.trainDelivery.defaultStoreId || null };
            warnings = await checkTrainStores(fields.trainDelivery);
        }

        const settings = (await findBusinessSettings()) || new FoodBusinessSettings();
        // Theme Settings saves one app at a time: merge it into the other apps' themes instead of replacing them all
        const { appThemes, ...rest } = fields;
        settings.set(rest);
        if (appThemes) {
            if (!settings.appThemes) settings.appThemes = new Map();
            for (const [app, theme] of Object.entries(appThemes)) {
                const current = settings.appThemes.get(app)?.toObject?.() || settings.appThemes.get(app) || {};
                settings.appThemes.set(app, { ...current, ...theme });
            }
        }
        if (phoneCountryCode !== undefined || phoneNumber !== undefined) {
            settings.phone = {
                countryCode: phoneCountryCode ?? settings.phone?.countryCode ?? '+91',
                number: phoneNumber ?? settings.phone?.number ?? '',
            };
        }

        const logo = req.files?.logo?.[0];
        if (logo) {
            const uploaded = await uploadImageBufferDetailed(logo.buffer, 'business/logos');
            settings.logo = { url: uploaded.secure_url, publicId: uploaded.public_id };
        }
        const favicon = req.files?.favicon?.[0];
        if (favicon) {
            const uploaded = await uploadImageBufferDetailed(favicon.buffer, 'business/favicons');
            settings.favicon = { url: uploaded.secure_url, publicId: uploaded.public_id };
        }

        await settings.save();
        clearBusinessInfoCache();
        return sendResponse(res, 200, 'Business settings updated successfully', { ...settings.toObject({ flattenMaps: true }), warnings });
    } catch (error) {
        next(error);
    }
}

/**
 * System Settings > Toggle Management: PATCH /food/admin/business-settings/toggles with any of maintenanceMode,
 * onlinePaymentOnly, maxCodAmount, customerRegistration, storeRegistration, deliveryRegistration.
 */
export async function updateBusinessToggles(req, res, next) {
    try {
        const validated = validateBusinessSettingsDto(req.body || {});
        const { onlinePaymentOnly, ...toggles } = Object.fromEntries(
            TOGGLE_FIELDS.filter((key) => validated[key] !== undefined).map((key) => [key, validated[key]])
        );
        if (!Object.keys(toggles).length && onlinePaymentOnly === undefined) throw new ValidationError('Nothing to update');

        if (onlinePaymentOnly !== undefined) {
            const appConfig = (await FoodAppConfig.findOne()) || new FoodAppConfig({});
            appConfig.codEnabled = !onlinePaymentOnly;
            appConfig.updatedBy = req.user?.name || req.user?.email || 'Super Admin';
            await appConfig.save();
        }
        const settings = (await findBusinessSettings()) || new FoodBusinessSettings();
        if (Object.keys(toggles).length) {
            settings.set(toggles);
            await settings.save();
            clearBusinessInfoCache();
        }
        return sendResponse(res, 200, 'Toggles updated successfully', {
            ...settings.toObject({ flattenMaps: true }),
            onlinePaymentOnly: await onlinePaymentOnlyNow(),
        });
    } catch (error) {
        next(error);
    }
}
