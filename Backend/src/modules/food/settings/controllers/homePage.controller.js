import { HomePage } from '../models/homePage.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { uploadImageBufferDetailed, uploadVideoBuffer } from '../../../../services/cloudinary.service.js';
import { v2 as cloudinary } from 'cloudinary';

const DEFAULT_BOTTOM_NAV = [
    { id: 'menu', label: 'Menu', icon: 'local_pizza', iconType: 'material', iconUrl: '', badge: '', link: '/user/menu', enabled: true, sortOrder: 1 },
    { id: 'reorder', label: 'Reorder', icon: 'shopping_bag', iconType: 'material', iconUrl: '', badge: '', link: '/user/orders', enabled: true, sortOrder: 2 },
    { id: 'big-big', label: 'Big Big', icon: 'local_pizza', iconType: 'material', iconUrl: '', badge: 'NEW', link: '/user/menu?search=big', enabled: true, sortOrder: 3 },
    { id: 'combos', label: 'Combos', icon: 'lunch_dining', iconType: 'material', iconUrl: '', badge: '', link: '/user/offers', enabled: true, sortOrder: 4 },
    { id: 'rewards', label: 'Rewards', icon: 'stars', iconType: 'material', iconUrl: '', badge: '', link: '/user/wallet', enabled: true, sortOrder: 5 }
];

export const getHomePageConfig = async (req, res, next) => {
    try {
        let config = await HomePage.findOne();
        if (!config) {
            config = await HomePage.create({ 
                deliveryTimeMinutes: 30, 
                deliveryTimeLabel: 'mins',
                bottomNav: DEFAULT_BOTTOM_NAV
            });
        } else if (!config.bottomNav || config.bottomNav.length === 0) {
            config.bottomNav = DEFAULT_BOTTOM_NAV;
            await config.save();
        }
        return sendResponse(res, 200, 'Home page configuration retrieved', config);
    } catch (error) {
        next(error);
    }
};

export const createOrUpdateHomePageConfig = async (req, res, next) => {
    try {
        const { deliveryTimeMinutes, deliveryTimeLabel } = req.body;
        if (deliveryTimeMinutes !== undefined) {
            const minutes = Number(deliveryTimeMinutes);
            if (isNaN(minutes) || minutes < 1 || minutes > 180) {
                return sendError(res, 400, 'Delivery time must be a number between 1 and 180 minutes');
            }
        }

        let config = await HomePage.findOne();
        if (!config) {
            config = await HomePage.create({
                ...req.body,
                bottomNav: req.body.bottomNav || DEFAULT_BOTTOM_NAV
            });
        } else {
            if (deliveryTimeMinutes !== undefined) config.deliveryTimeMinutes = Number(deliveryTimeMinutes);
            if (deliveryTimeLabel !== undefined) config.deliveryTimeLabel = deliveryTimeLabel;
            if (req.body.promoText !== undefined) config.promoText = req.body.promoText;
            if (req.body.cravingHeading !== undefined) config.cravingHeading = req.body.cravingHeading;
            if (req.body.banners !== undefined) config.banners = req.body.banners;
            if (req.body.orderMethods !== undefined) config.orderMethods = req.body.orderMethods;
            if (req.body.trainConfig !== undefined) config.trainConfig = req.body.trainConfig;
            if (req.body.adPopup !== undefined) config.adPopup = req.body.adPopup;
            if (req.body.menuFilters !== undefined) config.menuFilters = req.body.menuFilters;
            if (req.body.deliveryCard !== undefined) config.deliveryCard = req.body.deliveryCard;
            if (req.body.bottomNav !== undefined) config.bottomNav = req.body.bottomNav;
            await config.save();
        }
        return sendResponse(res, 201, 'Home page configuration created/updated successfully', config);
    } catch (error) {
        next(error);
    }
};

export const updateHomePageConfig = async (req, res, next) => {
    try {
        const { deliveryTimeMinutes, deliveryTimeLabel } = req.body;
        if (deliveryTimeMinutes !== undefined) {
            const minutes = Number(deliveryTimeMinutes);
            if (isNaN(minutes) || minutes < 1 || minutes > 180) {
                return sendError(res, 400, 'Delivery time must be a number between 1 and 180 minutes');
            }
        }

        let config = await HomePage.findOne();
        if (!config) {
            config = await HomePage.create({
                ...req.body,
                bottomNav: req.body.bottomNav || DEFAULT_BOTTOM_NAV
            });
        } else {
            if (deliveryTimeMinutes !== undefined) config.deliveryTimeMinutes = Number(deliveryTimeMinutes);
            if (deliveryTimeLabel !== undefined) config.deliveryTimeLabel = deliveryTimeLabel;
            if (req.body.promoText !== undefined) config.promoText = req.body.promoText;
            if (req.body.cravingHeading !== undefined) config.cravingHeading = req.body.cravingHeading;
            if (req.body.banners !== undefined) config.banners = req.body.banners;
            if (req.body.orderMethods !== undefined) config.orderMethods = req.body.orderMethods;
            if (req.body.trainConfig !== undefined) config.trainConfig = req.body.trainConfig;
            if (req.body.adPopup !== undefined) config.adPopup = req.body.adPopup;
            if (req.body.menuFilters !== undefined) config.menuFilters = req.body.menuFilters;
            if (req.body.deliveryCard !== undefined) config.deliveryCard = req.body.deliveryCard;
            if (req.body.bottomNav !== undefined) config.bottomNav = req.body.bottomNav;
            await config.save();
        }
        return sendResponse(res, 200, 'Home page configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};

export const uploadHomePageBanner = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, 'Please provide an image or video file.');
        }

        const isVideo = req.file.mimetype.startsWith('video/');
        let uploadResult;

        if (isVideo) {
            const url = await uploadVideoBuffer(req.file.buffer, 'home_page_banners');
            // Extract publicId manually or just pass dummy if uploadVideoBuffer doesn't return it
            // uploadVideoBuffer just returns url, let's parse it roughly or we can change it.
            // Wait, for simplicity let's just use url as publicId if we can't extract it easily, but deletion needs publicId.
            // Actually, cloudinary.uploader.upload_stream returns the full result in uploadImageBufferDetailed
            uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'home_page_banners', resource_type: 'video' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
        } else {
            uploadResult = await uploadImageBufferDetailed(req.file.buffer, 'home_page_banners');
        }

        let config = await HomePage.findOne();
        if (!config) {
            config = await HomePage.create({ deliveryTimeMinutes: 30, deliveryTimeLabel: 'mins', banners: [] });
        }

        const newBanner = {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: isVideo ? 'video' : 'image',
            category: req.body.category || '',
            categoryName: req.body.categoryName || '',
            link: req.body.link || ''
        };

        config.banners.push(newBanner);
        await config.save();

        return sendResponse(res, 200, 'Banner uploaded successfully', config);
    } catch (error) {
        next(error);
    }
};

export const updateHomePageBanner = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        const { category, categoryName, link } = req.body;
        if (!publicId) {
            return sendError(res, 400, 'Banner public ID is required');
        }

        let config = await HomePage.findOne();
        if (!config) {
            return sendError(res, 404, 'Configuration not found');
        }

        const banner = config.banners.find(b => b.publicId === publicId || b.publicId === decodeURIComponent(publicId));
        if (!banner) {
            return sendError(res, 404, 'Banner not found in configuration');
        }

        if (category !== undefined) banner.category = category;
        if (categoryName !== undefined) banner.categoryName = categoryName;
        if (link !== undefined) banner.link = link;

        await config.save();
        return sendResponse(res, 200, 'Banner updated successfully', config);
    } catch (error) {
        next(error);
    }
};

export const deleteHomePageBanner = async (req, res, next) => {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            return sendError(res, 400, 'Banner public ID is required');
        }

        let config = await HomePage.findOne();
        if (!config) {
            return sendError(res, 404, 'Configuration not found');
        }

        const bannerIndex = config.banners.findIndex(b => b.publicId === publicId || b.publicId === decodeURIComponent(publicId));
        if (bannerIndex === -1) {
            return sendError(res, 404, 'Banner not found in configuration');
        }

        const banner = config.banners[bannerIndex];

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(banner.publicId, { resource_type: banner.resourceType });
        } catch (err) {
            console.error('Failed to delete asset from Cloudinary:', err);
        }

        config.banners.splice(bannerIndex, 1);
        await config.save();

        return sendResponse(res, 200, 'Banner deleted successfully', config);
    } catch (error) {
        next(error);
    }
};
