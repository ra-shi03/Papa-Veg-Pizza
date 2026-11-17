import { sendResponse } from '../../../../utils/response.js';
import { loadMethods, saveMethods } from '../services/orderMethods.service.js';
import { clearBusinessInfoCache } from '../../admin/services/businessSettings.service.js';

/** GET /settings/order-methods (super admin): every method with its rules, for the form. */
export const getOrderMethodsAdmin = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Order methods', { methods: await loadMethods() });
    } catch (err) {
        next(err);
    }
};

/** PUT /settings/order-methods (super admin): { methods: [{ id, label?, enabled, scope, franchiseIds, storeIds }] }. */
export const saveOrderMethodsAdmin = async (req, res, next) => {
    try {
        const methods = await saveMethods(req.body?.methods);
        clearBusinessInfoCache(); // the train station list follows the train method's rules
        return sendResponse(res, 200, 'Order methods saved', { methods });
    } catch (err) {
        next(err);
    }
};
