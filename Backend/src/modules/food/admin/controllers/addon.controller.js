import { Addon } from '../models/addon.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

export const createAddon = async (req, res) => {
    try {
        const addon = await Addon.create(req.body);
        return sendResponse(res, 201, 'Addon created successfully', addon);
    } catch (error) {
        return sendError(res, 500, 'Failed to create addon', error.message);
    }
};

export const getAddons = async (req, res) => {
    try {
        const addons = await Addon.find().sort({ createdAt: -1 });
        return sendResponse(res, 200, 'Addons fetched successfully', addons);
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch addons', error.message);
    }
};

export const updateAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const addon = await Addon.findByIdAndUpdate(id, req.body, { new: true });
        if (!addon) return sendError(res, 404, 'Addon not found');
        return sendResponse(res, 200, 'Addon updated successfully', addon);
    } catch (error) {
        return sendError(res, 500, 'Failed to update addon', error.message);
    }
};

export const deleteAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const addon = await Addon.findByIdAndDelete(id);
        if (!addon) return sendError(res, 404, 'Addon not found');
        return sendResponse(res, 200, 'Addon deleted successfully');
    } catch (error) {
        return sendError(res, 500, 'Failed to delete addon', error.message);
    }
};
