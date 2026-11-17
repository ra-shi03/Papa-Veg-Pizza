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
 * Stores near the customer: every approved, active store of EVERY franchise within the radius the super admin set
 * (Order Methods page), nearest first. Display fields only. `method` (delivery|takeaway|incar|train) keeps only the
 * stores where that order method is offered.
 */
export const getNearbyStoresController = async (req, res, next) => {
    try {
        const { lat, lng, q, method } = req.query;
        const userLat = lat === undefined || lat === '' ? NaN : Number(lat);
        const userLng = lng === undefined || lng === '' ? NaN : Number(lng);
        if (!Number.isFinite(userLat) || !Number.isFinite(userLng) || Math.abs(userLat) > 90 || Math.abs(userLng) > 180) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required', error: 'Latitude and longitude are required' });
        }

        const { nearbyStoresWithin, loadMethods, methodAllowedAt } = await import('../../settings/services/orderMethods.service.js');
        const { stores, radiusKm } = await nearbyStoresWithin(userLat, userLng, 'storeName name address city state pincode phone franchiseId profileImage logo image');

        const rule = method ? (await loadMethods()).find((m) => m.id === String(method)) || null : null;
        const re = q && String(q).trim() ? new RegExp(String(q).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

        const out = [];
        for (const s of stores) {
            if (rule && !methodAllowedAt(rule, s)) continue;
            if (re && ![s.storeName, s.address, s.city, s.state, s.pincode].some((v) => re.test(String(v || '')))) continue;
            out.push({
                _id: s._id, id: s._id,
                storeName: s.storeName || s.name || '',
                address: s.address || '', city: s.city || '', state: s.state || '', pincode: s.pincode || '',
                phone: s.phone || '', latitude: Number(s.latitude), longitude: Number(s.longitude), distanceKm: s.distanceKm,
                image: s.profileImage || s.logo || s.image || '',
            });
        }
        out.sort((a, b) => a.distanceKm - b.distanceKm);

        return sendResponse(res, 200, 'Nearby stores fetched successfully', { stores: out, radiusKm });
    } catch (error) {
        next(error);
    }
};
