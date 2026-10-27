import { DeliveryWelcomeScreen } from '../models/deliveryWelcomeScreen.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export const getDeliveryWelcomeScreenConfig = async (req, res, next) => {
    try {
        let config = await DeliveryWelcomeScreen.findOne();
        if (!config) {
            config = await DeliveryWelcomeScreen.create({});
        }
        return sendResponse(res, 200, 'Delivery welcome configuration retrieved', config);
    } catch (error) {
        next(error);
    }
};

export const updateDeliveryWelcomeScreenConfig = async (req, res, next) => {
    try {
        let config = await DeliveryWelcomeScreen.findOne();
        if (!config) {
            config = await DeliveryWelcomeScreen.create(req.body);
        } else {
            const { _id, __v, createdAt, updatedAt, ...rest } = req.body;
            Object.assign(config, rest);
            if (rest.isActive !== undefined) {
                config.isActive = Boolean(rest.isActive);
                config.markModified('isActive');
            }
            await config.save();
        }
        return sendResponse(res, 200, 'Delivery welcome configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};

