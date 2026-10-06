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
            // Mongoose sometimes drops array assignments via Object.assign, so we set it explicitly
            const { posters, _id, __v, createdAt, updatedAt, ...rest } = req.body;
            Object.assign(config, rest);
            if (posters !== undefined) {
                config.posters = posters;
            }
            await config.save();
        }
        return sendResponse(res, 200, 'Configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};
