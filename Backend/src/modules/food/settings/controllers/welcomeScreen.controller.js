import { WelcomeScreen } from '../models/welcomeScreen.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export const getWelcomeScreenConfig = async (req, res, next) => {
    try {
        let config = await WelcomeScreen.findOne();
        if (!config) {
            config = await WelcomeScreen.create({});
        }
        return sendResponse(res, 200, 'Configuration retrieved', config);
    } catch (error) {
        next(error);
    }
};

export const updateWelcomeScreenConfig = async (req, res, next) => {
    try {
        let config = await WelcomeScreen.findOne();
        if (!config) {
            config = await WelcomeScreen.create(req.body);
        } else {
            Object.assign(config, req.body);
            await config.save();
        }
        return sendResponse(res, 200, 'Configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};
