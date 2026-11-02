import { FoodBusinessSettings } from '../models/businessSettings.model.js';
import { sendResponse } from '../../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../../services/cloudinary.service.js';
import { validateBusinessSettingsDto } from '../validators/businessSettings.validator.js';
import { clearBusinessInfoCache, findBusinessSettings, getBusinessInfo } from '../services/businessSettings.service.js';

/** Public: display fields only, briefly cached. Reading never creates a record. */
export async function getPublicBusinessSettings(req, res, next) {
    try {
        res.set('Cache-Control', 'public, max-age=60');
        return sendResponse(res, 200, 'Business settings fetched successfully', await getBusinessInfo());
    } catch (error) {
        next(error);
    }
}

/** Super admin: the record itself. */
export async function getBusinessSettings(req, res, next) {
    try {
        const settings = (await findBusinessSettings().lean()) || (await FoodBusinessSettings.create({})).toObject();
        return sendResponse(res, 200, 'Business settings fetched successfully', settings);
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

        const settings = (await findBusinessSettings()) || new FoodBusinessSettings();
        settings.set(fields);
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
        return sendResponse(res, 200, 'Business settings updated successfully', settings);
    } catch (error) {
        next(error);
    }
}
