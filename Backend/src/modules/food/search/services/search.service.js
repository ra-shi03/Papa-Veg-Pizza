import { FoodStore } from '../../store/models/store.model.js';
import { FoodItem } from '../../admin/models/food.model.js';
import { FoodCategory } from '../../admin/models/category.model.js';
import mongoose from 'mongoose';

/**
 * Unified Search Service
 * Searches for stores by name and also searches for food items, 
 * returning matched stores with potential dish highlights.
 */
export const searchUnified = async (query = {}, options = {}) => {
    const { 
        q, 
        lat, 
        lng, 
        radiusKm = 20, 
        categoryId, 
        minRating, 
        maxDeliveryTime, 
        isVeg,
        page = 1,
        limit = 20,
        zoneId
    } = query;

    const skip = (page - 1) * limit;
    const term = String(q || '').trim();
    const regex = term ? new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    // 1. Initial Filter (approved status and basic conditions)
    const storeFilter = { status: 'approved' };
    
    console.log(`[Search-Service] Querying with term: "${term}", categoryId: "${categoryId}", zoneId: "${zoneId}"`);

    if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
        storeFilter.zoneId = new mongoose.Types.ObjectId(zoneId);
    }

    if (isVeg === 'true') {
        storeFilter.pureVegStore = true;
    }

    if (minRating) {
        storeFilter.rating = { $gte: parseFloat(minRating) };
    }

    if (maxDeliveryTime) {
        storeFilter.estimatedDeliveryTimeMinutes = { $lte: parseInt(maxDeliveryTime) };
    }
    
    console.log(`[Search-Service] Final Store Filter:`, JSON.stringify(storeFilter));

    let storeIds = new Set();
    let storeDetailsMap = new Map();

    // 2. Handle Category Filtering (Stores don't have categoryId, FoodItems do)
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        const catFoodItems = await FoodItem.find({ 
            categoryId: new mongoose.Types.ObjectId(categoryId),
            approvalStatus: 'approved' 
        }).select('storeId').lean();
        
        const catStoreIds = [...new Set(catFoodItems.map(f => f.storeId.toString()))];
        if (catStoreIds.length > 0) {
            storeFilter._id = { $in: catStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
        } else {
            // No food items in this category -> No stores
            return {
                success: true,
                data: { stores: [], total: 0, page: parseInt(page), limit: parseInt(limit) }
            };
        }
    }

    // 3. Search Matching
    if (regex) {
        // A. Search by Store Name / Cuisine
        const matchedStores = await FoodStore.find({
            ...storeFilter,
            $or: [
                { storeName: { $regex: regex } },
                { cuisines: { $regex: regex } }
            ]
        }).limit(limit * 2).lean();

        matchedStores.forEach(r => {
            storeIds.add(r._id.toString());
            storeDetailsMap.set(r._id.toString(), { ...r, matchType: 'store' });
        });

        // B. Search by Food Item Name
        const foodFilters = { approvalStatus: 'approved' };
        if (isVeg === 'true') foodFilters.foodType = 'Veg';
        
        const matchedFoods = await FoodItem.find({
            ...foodFilters,
            name: { $regex: regex }
        }).limit(limit * 2).lean();

        const foodStoreIds = matchedFoods.map(f => f.storeId.toString());
        
        if (foodStoreIds.length > 0) {
            const unmatchedIds = foodStoreIds.filter(id => !storeIds.has(id));
            if (unmatchedIds.length > 0) {
                const rsForFoods = await FoodStore.find({
                    ...storeFilter,
                    _id: { $in: unmatchedIds.map(id => new mongoose.Types.ObjectId(id)) }
                }).lean();

                rsForFoods.forEach(r => {
                    storeIds.add(r._id.toString());
                    storeDetailsMap.set(r._id.toString(), { 
                        ...r, 
                        matchType: 'food',
                        matchedDish: matchedFoods.find(f => f.storeId.toString() === r._id.toString())?.name,
                        matchedDishImage: matchedFoods.find(f => f.storeId.toString() === r._id.toString())?.image,
                        matchedDishId: matchedFoods.find(f => f.storeId.toString() === r._id.toString())?._id
                    });
                });
            }
        }
    } else {
        // No search text -> List all stores matching filters (category/zone)
        const allMatching = await FoodStore.find(storeFilter)
            .sort({ rating: -1, createdAt: -1 })
            .limit(limit * 2)
            .lean();
            
        allMatching.forEach(r => {
            storeIds.add(r._id.toString());
            storeDetailsMap.set(r._id.toString(), r);
        });
    }

    // 4. Final Result Formatting
    let results = Array.from(storeDetailsMap.values());

    // Simple distance sorting if lat/lng are provided
    if (lat && lng && results.length > 0) {
        results.forEach(res => {
            if (res.location && res.location.latitude && res.location.longitude) {
                const dLat = (res.location.latitude - lat) * Math.PI / 180;
                const dLon = (res.location.longitude - lng) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat * Math.PI / 180) * Math.cos(res.location.latitude * Math.PI / 180) *
                          Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                res.distanceScore = 6371 * c; // Km
            } else {
                res.distanceScore = 999;
            }
        });
        results.sort((a, b) => (a.distanceScore || 999) - (b.distanceScore || 999));
    }

    // ... (rest of logic up to result formation)
    const finalResult = {
        success: true,
        data: {
            stores: results.slice(skip, skip + limit),
            total: results.length,
            page: parseInt(page),
            limit: parseInt(limit),
            zoneFiltered: !!(zoneId && mongoose.Types.ObjectId.isValid(zoneId))
        }
    };

    // FALLBACK: If results are empty and a zoneId was provided, try one more time without zoneId 
    // to ensure user sees SOMETHING if their current zone has no matches.
    if (results.length === 0 && zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
        console.log(`[Search-Service] No results in zone ${zoneId}. Trying global fallback...`);
        const fallbackResults = await searchUnified({ ...query, zoneId: null }, options);
        if (fallbackResults.data.total > 0) {
            fallbackResults.data.wasFallback = true;
            return fallbackResults;
        }
    }

    return finalResult;
};

/**
 * Fetch Admin-only categories
 */
export const getAdminCategories = async (query = {}) => {
    const filter = { 
        isActive: true, 
        isApproved: true,
        $or: [
            { storeId: { $exists: false } },
            { storeId: null },
            { storeId: { $eq: undefined } }
        ]
    };

    if (query.zoneId && mongoose.Types.ObjectId.isValid(query.zoneId)) {
        filter.$or = [
            { zoneId: new mongoose.Types.ObjectId(query.zoneId) },
            { zoneId: { $exists: false } },
            { zoneId: null }
        ];
    }

    const categories = await FoodCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    return categories;
};
