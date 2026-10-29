import { DeliveryLoginScreen } from '../models/deliveryLoginScreen.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export const getDeliveryLoginScreenConfig = async (req, res, next) => {
    try {
        let config = await DeliveryLoginScreen.findOne();
        if (!config) {
            config = await DeliveryLoginScreen.create({});
        }
        return sendResponse(res, 200, 'Delivery login configuration retrieved', config);
    } catch (error) {
        next(error);
    }
};

export const updateDeliveryLoginScreenConfig = async (req, res, next) => {
    try {
        let config = await DeliveryLoginScreen.findOne();
        if (!config) {
            config = await DeliveryLoginScreen.create(req.body);
        } else {
            const { _id, __v, createdAt, updatedAt, ...rest } = req.body;
            Object.assign(config, rest);
            if (rest.isActive !== undefined) {
                config.isActive = Boolean(rest.isActive);
                config.markModified('isActive');
            }
            await config.save();
        }
        return sendResponse(res, 200, 'Delivery login configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};

