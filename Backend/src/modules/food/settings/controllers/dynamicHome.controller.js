import { HomeSection } from '../models/homeSection.model.js';
import { liveCouponsForStore, couponStoreFromQuery } from '../services/couponOffer.service.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../../services/cloudinary.service.js';
import cloudinary from 'cloudinary';

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

export const getHomeLayout = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store');
        const populatedSections = [];

        // Offers section: the same live coupon list every customer screen uses (Marketing > Coupons, store rule,
        // the app-wide coupon switch), for the store of ?storeId= / ?lat=&lng= (global coupons without one).
        const offers = (await liveCouponsForStore(await couponStoreFromQuery(req.query))).map((o) => ({
            _id: o._id,
            title: o.title,
            subtitle: o.description,
            couponCode: o.couponCode,
            buttonText: 'View'
        }));
        if (offers.length > 0) {
            populatedSections.push({ _id: 'auto-offers', type: 'offers', isActive: true, data: offers });
        }

        return sendResponse(res, 200, 'Home layout fetched successfully', populatedSections);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const getAllHomeSectionsAdmin = async (req, res) => {
    try {
        const sections = await HomeSection.find().sort({ sortOrder: 1 }).lean();
        return sendResponse(res, 200, 'Sections fetched', sections);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};


// ==========================================
// SUPERADMIN - HOMESECTION ENDPOINTS
// ==========================================

export const createHomeSection = async (req, res) => {
    try {
        const payload = { ...req.body, createdBy: req.user.userId };
        const section = await HomeSection.create(payload);
        return sendResponse(res, 201, 'Home section created', section);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const updateHomeSection = async (req, res) => {
    try {
        const section = await HomeSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!section) return sendError(res, 404, 'Home section not found');
        return sendResponse(res, 200, 'Home section updated', section);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const deleteHomeSection = async (req, res) => {
    try {
        const section = await HomeSection.findByIdAndDelete(req.params.id);
        if (!section) return sendError(res, 404, 'Home section not found');
        return sendResponse(res, 200, 'Home section deleted', null);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ==========================================
// SUPERADMIN - SHARED BULK / TOGGLE 
// ==========================================

export const toggleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { modelName, isActive } = req.body; // modelName: 'HomeSection'
        
        let Model;
        if (modelName === 'HomeSection') Model = HomeSection;
        else return sendError(res, 400, 'Invalid model name');

        const updated = await Model.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!updated) return sendError(res, 404, 'Record not found');

        return sendResponse(res, 200, 'Status updated successfully', updated);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const reorderItems = async (req, res) => {
    try {
        const { modelName, items } = req.body; // items: [{ id, sortOrder }]
        
        let Model;
        if (modelName === 'HomeSection') Model = HomeSection;
        else return sendError(res, 400, 'Invalid model name');

        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { sortOrder: item.sortOrder }
            }
        }));

        await Model.bulkWrite(bulkOps);
        return sendResponse(res, 200, 'Reordered successfully', null);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ==========================================
// IMAGE UPLOAD (Admin)
// ==========================================

export const uploadDynamicImage = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 400, 'No image provided');
        const folder = req.body.folder || 'dynamic_home';
        
        const uploadResult = await uploadImageBufferDetailed(req.file.buffer, folder);
        
        return sendResponse(res, 200, 'Image uploaded successfully', {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

