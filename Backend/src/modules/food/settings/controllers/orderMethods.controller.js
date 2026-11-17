import { sendResponse } from '../../../../utils/response.js';
import { deleteMethod, loadMethods, saveMethods, loadNearbyRadiusKm, saveNearbyRadiusKm, validateRadiusInput } from '../services/orderMethods.service.js';
import { clearBusinessInfoCache } from '../../admin/services/businessSettings.service.js';

/** GET /settings/order-methods (super admin): every method with its rules, for the form. */
export const getOrderMethodsAdmin = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Order methods', { methods: await loadMethods(), nearbyStoreRadiusKm: await loadNearbyRadiusKm() });
    } catch (err) {
        next(err);
    }
};

/** PUT /settings/order-methods (super admin): { methods: [{ id, label?, enabled, scope, franchiseIds, storeIds }] }. */
export const saveOrderMethodsAdmin = async (req, res, next) => {
    try {
        const body = req.body || {};
        const hasRadius = body.nearbyStoreRadiusKm !== undefined;
        if (hasRadius) validateRadiusInput(body.nearbyStoreRadiusKm); // check both before saving either
        const methods = await saveMethods(body.methods);
        if (hasRadius) await saveNearbyRadiusKm(body.nearbyStoreRadiusKm);
        clearBusinessInfoCache(); // the train station list follows the train method's rules
        return sendResponse(res, 200, 'Order methods saved', { methods, nearbyStoreRadiusKm: await loadNearbyRadiusKm() });
    } catch (err) {
        next(err);
    }
};

/** DELETE /settings/order-methods/:id (super admin). */
export const deleteOrderMethodAdmin = async (req, res, next) => {
    try {
        const methods = await deleteMethod(req.params.id);
        clearBusinessInfoCache();
        return sendResponse(res, 200, 'Order method deleted', { methods });
    } catch (err) {
        next(err);
    }
};
