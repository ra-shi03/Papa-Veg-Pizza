import { HomeSection } from '../models/homeSection.model.js';
import { FoodCoupon } from '../models/foodCoupon.model.js';
import { Campaign } from '../models/campaign.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../../services/cloudinary.service.js';
import cloudinary from 'cloudinary';

const currentDateQuery = () => ({
    isActive: true,
    $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: new Date() }, endDate: null },
        { startDate: null, endDate: { $gte: new Date() } },
        { startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }
    ]
});

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

export const getHomeLayout = async (req, res) => {
    try {
        // Set Cache-Control header for performance (5 mins)
        res.setHeader('Cache-Control', 'public, max-age=300');

        const populatedSections = [];

        // 1. Auto-map Offers Section
        const rawCoupons = await FoodCoupon.find({ showOnHome: true, isActive: true, ...currentDateQuery() }).sort({ createdAt: -1 }).lean();
        const offers = rawCoupons.map(coupon => ({
            _id: coupon._id,
            title: coupon.title,
            subtitle: coupon.description,
            buttonText: 'View'
        }));
        if (offers && offers.length > 0) {
            populatedSections.push({
                _id: 'auto-offers',
                type: 'offers',
                isActive: true,
                data: offers
            });
        }

        // 2. Auto-map all active Campaigns
        const campaigns = await Campaign.find(currentDateQuery()).sort({ sortOrder: 1 })
            .populate({
                path: 'items.product',
                select: 'name image price vegType sizes'
            })
            .lean();

        for (const campaign of campaigns) {
            if (campaign && campaign.items) {
                // Filter out items where the product was deleted (soft handling)
                campaign.items = campaign.items.filter(item => item.product != null && item.isActive);
                campaign.items.sort((a, b) => a.sortOrder - b.sortOrder);
            }
            populatedSections.push({
                _id: `auto-campaign-${campaign._id}`,
                type: 'campaign',
                isActive: true,
                data: campaign
            });
        }

        return sendResponse(res, 200, 'Home layout fetched successfully', populatedSections);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const getActiveOffers = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=300');
        const offers = await UiOffer.find(currentDateQuery())
            .sort({ sortOrder: 1 })
            .lean();
        return sendResponse(res, 200, 'Offers fetched successfully', offers);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const getCampaignBySlug = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=300');
        const { slug } = req.params;
        const campaign = await Campaign.findOne({ slug, ...currentDateQuery() })
            .populate({
                path: 'items.product',
                select: 'name image price vegType sizes'
            })
            .lean();

        if (!campaign) {
            return sendError(res, 404, 'Campaign not found or inactive');
        }

        // Soft handling of deleted products
        campaign.items = campaign.items.filter(item => item.product != null && item.isActive);
        campaign.items.sort((a, b) => a.sortOrder - b.sortOrder);

        return sendResponse(res, 200, 'Campaign fetched successfully', campaign);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const getActiveCampaigns = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=300');
        const campaigns = await Campaign.find(currentDateQuery()).sort({ sortOrder: 1 })
            .populate({
                path: 'items.product',
                select: 'name image price vegType sizes'
            })
            .lean();

        for (const campaign of campaigns) {
            if (campaign && campaign.items) {
                campaign.items = campaign.items.filter(item => item.product != null && item.isActive);
                campaign.items.sort((a, b) => a.sortOrder - b.sortOrder);
            }
        }

        return sendResponse(res, 200, 'Campaigns fetched successfully', campaigns);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};


// ==========================================
// SUPERADMIN - GET ALL ENDPOINTS
// ==========================================

export const getAllUiOffersAdmin = async (req, res) => {
    try {
        const offers = await FoodCoupon.find().sort({ createdAt: -1 }).lean();
        return sendResponse(res, 200, 'Offers fetched', offers);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const getAllCampaignsAdmin = async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ sortOrder: 1 }).lean();
        return sendResponse(res, 200, 'Campaigns fetched', campaigns);
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
// SUPERADMIN - UIOFFER ENDPOINTS
// ==========================================

export const createUiOffer = async (req, res) => {
    try {
        const payload = { ...req.body, createdBy: req.user.userId };
        const offer = await UiOffer.create(payload);
        return sendResponse(res, 201, 'Offer created', offer);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const updateUiOffer = async (req, res) => {
    try {
        const offer = await UiOffer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) return sendError(res, 404, 'Offer not found');
        return sendResponse(res, 200, 'Offer updated', offer);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const deleteUiOffer = async (req, res) => {
    try {
        const offer = await UiOffer.findByIdAndDelete(req.params.id);
        if (!offer) return sendError(res, 404, 'Offer not found');
        return sendResponse(res, 200, 'Offer deleted', null);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

// ==========================================
// SUPERADMIN - CAMPAIGN ENDPOINTS
// ==========================================

export const createCampaign = async (req, res) => {
    try {
        const payload = { ...req.body, createdBy: req.user.userId };
        const campaign = await Campaign.create(payload);
        return sendResponse(res, 201, 'Campaign created', campaign);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!campaign) return sendError(res, 404, 'Campaign not found');
        return sendResponse(res, 200, 'Campaign updated', campaign);
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

export const deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) return sendError(res, 404, 'Campaign not found');
        return sendResponse(res, 200, 'Campaign deleted', null);
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
        const { modelName, isActive } = req.body; // modelName: 'UiOffer', 'Campaign', 'HomeSection'
        
        let Model;
        if (modelName === 'UiOffer') Model = UiOffer;
        else if (modelName === 'Campaign') Model = Campaign;
        else if (modelName === 'HomeSection') Model = HomeSection;
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
        if (modelName === 'UiOffer') Model = UiOffer;
        else if (modelName === 'Campaign') Model = Campaign;
        else if (modelName === 'HomeSection') Model = HomeSection;
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

