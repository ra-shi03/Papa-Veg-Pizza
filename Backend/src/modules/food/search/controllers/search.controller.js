import { searchUnified, getAdminCategories } from '../services/search.service.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

/**
 * Unified Search for Stores, Food Items, and Cuisines
 */
export const searchController = async (req, res, next) => {
    try {
        const { q, lat, lng, radiusKm, categoryId, minRating, maxDeliveryTime, isVeg, page, limit, zoneId } = req.query;
        console.log(`[Search-Debug] q="${q}", catId="${categoryId}", zone="${zoneId}", coords=[${lat}, ${lng}]`);

        const results = await searchUnified({
            q,
            lat,
            lng,
            radiusKm,
            categoryId,
            minRating,
            maxDeliveryTime,
            isVeg,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            zoneId
        });

        return sendResponse(res, 200, 'Search results fetched successfully', results.data);
    } catch (error) {
        next(error);
    }
};

/**
 * Fetch List of Admin-only Categories
 */
export const listAdminCategoriesController = async (req, res, next) => {
    try {
        const { zoneId } = req.query;
        const categories = await getAdminCategories({ zoneId });
        
        return sendResponse(res, 200, 'Admin categories fetched successfully', { categories });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if the given location is serviceable
 */
export const checkServiceabilityController = async (req, res, next) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        // We will dynamically import FoodStore to avoid circular dependency issues if any
        const { FoodStore } = await import('../../store/models/store.model.js');
        const activeStores = await FoodStore.find({ isActive: true, approvalStatus: 'Approved' });

        const maxDistanceKm = 15; // 15km service radius
        let nearestStore = null;
        let minDistance = Infinity;

        activeStores.forEach(store => {
            if (store.latitude && store.longitude) {
                const dLat = (store.latitude - lat) * Math.PI / 180;
                const dLon = (store.longitude - lng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat * Math.PI / 180) * Math.cos(store.latitude * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distanceKm = 6371 * c;
                
                if (distanceKm < minDistance) {
                    minDistance = distanceKm;
                    nearestStore = store;
                }
            }
        });

        if (nearestStore && minDistance <= maxDistanceKm) {
            return sendResponse(res, 200, 'Location is serviceable', {
                isServiceable: true,
                storeId: nearestStore._id,
                message: `Delivery available! Nearest store is ${minDistance.toFixed(1)} km away.`
            });
        }

        return sendResponse(res, 200, 'Location is out of service area', {
            isServiceable: false,
            storeId: null,
            message: "Sorry, we don't deliver to this location yet."
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Fetch nearby stores sorted by distance
 */
export const getNearbyStoresController = async (req, res, next) => {
    try {
        const { lat, lng, q } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);

        const { FoodStore } = await import('../../store/models/store.model.js');
        let activeStores = await FoodStore.find({
            isActive: true,
            $or: [
                { approvalStatus: { $in: ['Approved', 'approved'] } },
                { approvalStatus: { $exists: false } },
                { approvalStatus: null }
            ]
        }).lean();

        // If no approved stores found, fallback to all active stores
        if (!activeStores || activeStores.length === 0) {
            activeStores = await FoodStore.find({ isActive: true }).lean();
        }

        let storesWithDistance = activeStores.map(store => {
            let distanceKm = null;
            const sLat = Number(store.latitude ?? store.lat ?? store.location?.coordinates?.[1]);
            const sLng = Number(store.longitude ?? store.lng ?? store.location?.coordinates?.[0]);

            if (Number.isFinite(sLat) && Number.isFinite(sLng) && Number.isFinite(userLat) && Number.isFinite(userLng)) {
                const dLat = (sLat - userLat) * Math.PI / 180;
                const dLon = (sLng - userLng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(userLat * Math.PI / 180) * Math.cos(sLat * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                distanceKm = Math.round(6371 * c * 10) / 10;
            }
            return {
                ...store,
                distanceKm
            };
        });

        // Filter and sort by distance if distance is available
        storesWithDistance.sort((a, b) => {
            if (a.distanceKm === null && b.distanceKm === null) return 0;
            if (a.distanceKm === null) return 1;
            if (b.distanceKm === null) return -1;
            return a.distanceKm - b.distanceKm;
        });

        // Optional search query filter
        if (q && q.trim()) {
            const searchRegex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            storesWithDistance = storesWithDistance.filter(s =>
                searchRegex.test(s.storeName || '') ||
                searchRegex.test(s.address || '') ||
                searchRegex.test(s.city || '') ||
                searchRegex.test(s.state || '') ||
                searchRegex.test(s.pincode || '')
            );
        }

        return sendResponse(res, 200, 'Nearby stores fetched successfully', { stores: storesWithDistance });
    } catch (error) {
        next(error);
    }
};
