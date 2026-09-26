import { HomePage } from '../models/homePage.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';
import { uploadImageBufferDetailed, uploadVideoBuffer } from '../../../../services/cloudinary.service.js';
import { v2 as cloudinary } from 'cloudinary';

export const getHomePageConfig = async (req, res, next) => {
    try {
        let config = await HomePage.findOne();
        if (!config) {
            config = await HomePage.create({ deliveryTimeMinutes: 30, deliveryTimeLabel: 'mins' });
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
            config = await HomePage.create(req.body);
        } else {
            if (deliveryTimeMinutes !== undefined) config.deliveryTimeMinutes = Number(deliveryTimeMinutes);
            if (deliveryTimeLabel !== undefined) config.deliveryTimeLabel = deliveryTimeLabel;
            if (req.body.deals !== undefined) config.deals = req.body.deals;
            if (req.body.orderMethods !== undefined) config.orderMethods = req.body.orderMethods;
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
            config = await HomePage.create(req.body);
        } else {
            if (deliveryTimeMinutes !== undefined) config.deliveryTimeMinutes = Number(deliveryTimeMinutes);
            if (deliveryTimeLabel !== undefined) config.deliveryTimeLabel = deliveryTimeLabel;
            if (req.body.deals !== undefined) config.deals = req.body.deals;
            if (req.body.orderMethods !== undefined) config.orderMethods = req.body.orderMethods;
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
            resourceType: isVideo ? 'video' : 'image'
        };

        config.banners.push(newBanner);
        await config.save();

        return sendResponse(res, 200, 'Banner uploaded successfully', config);
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
