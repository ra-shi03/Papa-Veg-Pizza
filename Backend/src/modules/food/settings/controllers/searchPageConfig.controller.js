import mongoose from 'mongoose';
import { SearchPageConfig } from '../models/searchPageConfig.model.js';
import { AddonType } from '../../admin/models/addonType.model.js';
import { Addon } from '../../admin/models/addon.model.js';

// Helper to sanitize subdocument _id values so string temporary IDs (e.g. 'launch-1', 'temp-xxx') don't trigger BSON CastError
const sanitizeSubdocIds = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
        if (!item || typeof item !== 'object') return item;
        const copy = { ...item };
        if (copy._id && !mongoose.Types.ObjectId.isValid(copy._id)) {
            delete copy._id;
        }
        if (Array.isArray(copy.items)) {
            copy.items = sanitizeSubdocIds(copy.items);
        }
        return copy;
    });
};

// Default initial seed data matching user's exact specification & screenshot
const defaultSearchConfig = {
    isPopularEnabled: true,
    isSearchByEnabled: true,
    isRecentlyViewedEnabled: true,
    isNewLaunchesEnabled: true,
    popularSearches: [
        { text: 'Maxxx', sortOrder: 1, isActive: true, searchQuery: 'Maxxx' },
        { text: 'more paneer', sortOrder: 2, isActive: true, searchQuery: 'paneer' },
        { text: 'more chicken', sortOrder: 3, isActive: true, searchQuery: 'chicken' },
        { text: 'Big Big Pizza', sortOrder: 4, isActive: true, searchQuery: 'Big Big Pizza' },
        { text: 'Ultimate Pizza Feast', sortOrder: 5, isActive: true, searchQuery: 'Feast' }
    ],
    searchByTabs: [
        {
            name: 'Crusts',
            key: 'crust',
            sortOrder: 1,
            isActive: true,
            items: [
                {
                    title: 'Double Cheeseburst',
                    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80',
                    query: 'Double Cheeseburst',
                    sortOrder: 1,
                    isActive: true
                },
                {
                    title: 'Cheese Volcano Crust',
                    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80',
                    query: 'Volcano',
                    sortOrder: 2,
                    isActive: true
                },
                {
                    title: 'Creamy Makhani Cheese Burst',
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80',
                    query: 'Makhani',
                    sortOrder: 3,
                    isActive: true
                },
                {
                    title: 'Korean Sweet Chilli Crust',
                    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80',
                    query: 'Chilli',
                    sortOrder: 4,
                    isActive: true
                }
            ]
        },
        {
            name: 'Toppings',
            key: 'topping',
            sortOrder: 2,
            isActive: true,
            items: [
                {
                    title: 'Fresh Paneer',
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80',
                    query: 'paneer',
                    sortOrder: 1,
                    isActive: true
                },
                {
                    title: 'Crispy Onion & Capsicum',
                    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80',
                    query: 'capsicum',
                    sortOrder: 2,
                    isActive: true
                },
                {
                    title: 'Golden Sweet Corn',
                    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80',
                    query: 'corn',
                    sortOrder: 3,
                    isActive: true
                },
                {
                    title: 'Black Olives & Jalapenos',
                    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80',
                    query: 'jalapeno',
                    sortOrder: 4,
                    isActive: true
                }
            ]
        },
        {
            name: 'Flavours',
            key: 'flavour',
            sortOrder: 3,
            isActive: true,
            items: [
                {
                    title: 'Creamy Makhani',
                    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80',
                    query: 'makhani',
                    sortOrder: 1,
                    isActive: true
                },
                {
                    title: 'Peri Peri Spice',
                    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80',
                    query: 'peri peri',
                    sortOrder: 2,
                    isActive: true
                },
                {
                    title: 'Smoky Barbeque',
                    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80',
                    query: 'barbeque',
                    sortOrder: 3,
                    isActive: true
                }
            ]
        }
    ],
    newLaunches: [
        {
            title: 'Paneer Maxxx',
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
            searchQuery: 'paneer',
            sortOrder: 1,
            isActive: true
        },
        {
            title: 'Four Cheese Sourdough Pizza',
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
            searchQuery: 'cheese',
            sortOrder: 2,
            isActive: true
        },
        {
            title: 'Big Pizza Bonanza',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
            searchQuery: 'pizza',
            sortOrder: 3,
            isActive: true
        }
    ]
};

// Helper to assign matching food thumbnail if addon does not have an image
export const getImageForAddon = (addon) => {
    if (addon.image && addon.image.trim()) return addon.image.trim();
    const n = (addon.name || '').toLowerCase();
    const t = (addon.type || '').toLowerCase();

    if (n.includes('hand tossed') || t.includes('crust')) {
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('paneer')) {
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('capsicum') || n.includes('onion') || n.includes('tomato')) {
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('corn')) {
        return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('mushroom')) {
        return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('olive') || n.includes('jalapeno') || n.includes('paprika')) {
        return 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=160&auto=format&fit=crop&q=80';
    }
    if (n.includes('cheese') || t.includes('cheese')) {
        return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('dip') || n.includes('dip') || t.includes('sauce')) {
        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
};

/**
 * Builds Search By tabs dynamically from the real AddonType and Addon collections in MongoDB
 */
export async function buildDynamicSearchByFromAddons() {
    let addonTypes = await AddonType.find({ status: 'Active' }).sort({ sortOrder: 1, createdAt: 1 }).lean();
    if (!addonTypes || addonTypes.length === 0) {
        addonTypes = [
            { name: 'Crust', slug: 'crust', sortOrder: 1 },
            { name: 'Toppings', slug: 'topping', sortOrder: 2 },
            { name: 'Dips', slug: 'dip', sortOrder: 3 },
            { name: 'Cheese', slug: 'cheese', sortOrder: 4 }
        ];
    }

    const addons = await Addon.find({ status: 'Active' }).sort({ isDefault: -1, createdAt: 1 }).lean();

    const tabs = addonTypes.map((type, tIdx) => {
        const typeSlug = (type.slug || type.name || '').toLowerCase();
        const typeName = (type.name || '').toLowerCase();

        // Match real addons belonging to this type
        const matchingAddons = addons.filter(a => {
            const aType = (a.type || '').trim().toLowerCase();
            return (
                aType === typeSlug ||
                aType === typeName ||
                aType.includes(typeSlug) ||
                typeSlug.includes(aType) ||
                (typeSlug.includes('crust') && aType.includes('crust')) ||
                (typeSlug.includes('topping') && aType.includes('topping')) ||
                (typeSlug.includes('dip') && aType.includes('dip')) ||
                (typeSlug.includes('cheese') && aType.includes('cheese'))
            );
        });

        let displayName = type.name;
        if (!displayName.toLowerCase().endsWith('s')) {
            displayName = `${displayName}s`;
        }

        return {
            _id: type._id ? String(type._id) : `tab-${tIdx}`,
            name: displayName,
            key: typeSlug,
            sortOrder: type.sortOrder || tIdx + 1,
            isActive: true,
            items: matchingAddons.map((addon, aIdx) => ({
                _id: String(addon._id || aIdx),
                title: addon.name,
                image: getImageForAddon(addon),
                query: addon.name,
                sortOrder: aIdx + 1,
                isActive: true
            }))
        };
    }).filter(tab => tab.items.length > 0);

    return tabs;
}

// Detect if tabs still contain initial mock/placeholder entries
const hasOldMockTabs = (tabs) => {
    if (!Array.isArray(tabs) || tabs.length === 0) return true;
    return tabs.some(tab => 
        (tab.items || []).some(item => 
            item.title === 'Double Cheeseburst' || 
            item.title === 'Cheese Volcano Crust' ||
            item.title === 'Korean Sweet Chilli Crust'
        )
    );
};

// Helper: Ensure config document exists and has real addon data
async function getOrCreateConfig() {
    let config = await SearchPageConfig.findOne();
    const realTabs = await buildDynamicSearchByFromAddons();

    if (!config) {
        config = await SearchPageConfig.create({
            ...defaultSearchConfig,
            searchByTabs: realTabs.length > 0 ? realTabs : defaultSearchConfig.searchByTabs,
            newLaunches: defaultSearchConfig.newLaunches
        });
    } else {
        let changed = false;
        if (hasOldMockTabs(config.searchByTabs) && realTabs.length > 0) {
            config.searchByTabs = realTabs;
            changed = true;
        }
        // If newLaunches is missing or empty, ensure default launch posters are available
        if (!Array.isArray(config.newLaunches) || config.newLaunches.length === 0) {
            config.newLaunches = defaultSearchConfig.newLaunches;
            changed = true;
        }
        if (changed) {
            await config.save();
        }
    }
    return config;
}

/**
 * Public Endpoint: Fetch active Search Page Config for User App
 */
export async function getPublicSearchConfig(req, res, next) {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const config = await getOrCreateConfig();

        // Filter and sort popular searches
        const popular = (config.popularSearches || [])
            .filter(item => item.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        // Ensure real dynamic data of crust, toppings is always up-to-date
        let searchByTabs = await buildDynamicSearchByFromAddons();
        if (!searchByTabs || searchByTabs.length === 0) {
            searchByTabs = (config.searchByTabs || [])
                .filter(tab => tab.isActive !== false)
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map(tab => ({
                    _id: tab._id,
                    name: tab.name,
                    key: tab.key,
                    sortOrder: tab.sortOrder,
                    isActive: tab.isActive,
                    items: (tab.items || [])
                        .filter(i => i.isActive !== false)
                        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                }));
        }

        // Filter and sort New Launches
        let newLaunches = (config.newLaunches || [])
            .filter(item => item.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        if (newLaunches.length === 0 && config.isNewLaunchesEnabled !== false) {
            newLaunches = defaultSearchConfig.newLaunches;
        }

        return res.status(200).json({
            success: true,
            data: {
                isPopularEnabled: config.isPopularEnabled,
                isSearchByEnabled: config.isSearchByEnabled,
                isRecentlyViewedEnabled: config.isRecentlyViewedEnabled,
                isNewLaunchesEnabled: config.isNewLaunchesEnabled,
                popularSearches: popular,
                searchByTabs,
                newLaunches
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin Endpoint: Fetch full Search Page Config including real Addons
 */
export async function getAdminSearchConfig(req, res, next) {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const config = await getOrCreateConfig();

        // Also fetch active Addon Types and Addons for easy one-click linking
        const addonTypes = await AddonType.find({ status: 'Active' }).sort({ sortOrder: 1, createdAt: 1 });
        const addons = await Addon.find({ status: 'Active' }).sort({ isDefault: -1, createdAt: 1 });
        const realTabs = await buildDynamicSearchByFromAddons();

        // If stored config has old mock data, sync it with real tabs immediately
        if (hasOldMockTabs(config.searchByTabs) && realTabs.length > 0) {
            config.searchByTabs = realTabs;
            await config.save();
        }

        return res.status(200).json({
            success: true,
            data: {
                config,
                realSearchByTabs: realTabs,
                availableAddonTypes: addonTypes,
                availableAddons: addons
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Endpoint to sync real Addons directly into Search Page Config
 */
export async function syncRealAddonsToSearchConfig(req, res, next) {
    try {
        const realTabs = await buildDynamicSearchByFromAddons();
        const config = await getOrCreateConfig();

        config.searchByTabs = realTabs;
        await config.save();

        return res.status(200).json({
            success: true,
            message: 'Search By tabs synced with real Crusts, Toppings & Addons successfully',
            data: realTabs
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin Endpoint: Update complete search config
 */
export async function updateSearchConfig(req, res, next) {
    try {
        const updateData = req.body || {};
        let config = await getOrCreateConfig();

        if (Array.isArray(updateData.popularSearches)) {
            config.popularSearches = sanitizeSubdocIds(updateData.popularSearches);
            config.markModified('popularSearches');
        }
        if (Array.isArray(updateData.searchByTabs)) {
            config.searchByTabs = sanitizeSubdocIds(updateData.searchByTabs);
            config.markModified('searchByTabs');
        }
        if (Array.isArray(updateData.newLaunches)) {
            config.newLaunches = sanitizeSubdocIds(updateData.newLaunches);
            config.markModified('newLaunches');
        }

        if (updateData.isPopularEnabled !== undefined) config.isPopularEnabled = Boolean(updateData.isPopularEnabled);
        if (updateData.isSearchByEnabled !== undefined) config.isSearchByEnabled = Boolean(updateData.isSearchByEnabled);
        if (updateData.isRecentlyViewedEnabled !== undefined) config.isRecentlyViewedEnabled = Boolean(updateData.isRecentlyViewedEnabled);
        if (updateData.isNewLaunchesEnabled !== undefined) config.isNewLaunchesEnabled = Boolean(updateData.isNewLaunchesEnabled);

        await config.save();

        return res.status(200).json({
            success: true,
            message: 'Search configuration updated successfully',
            data: config
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Add popular search tag
 */
export async function createPopularSearch(req, res, next) {
    try {
        const { text, sortOrder, isActive, searchQuery } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({ success: false, message: 'Tag text is required' });
        }

        const config = await getOrCreateConfig();
        const maxSort = config.popularSearches.length > 0 
            ? Math.max(...config.popularSearches.map(p => p.sortOrder ?? 0))
            : 0;

        config.popularSearches.push({
            text: text.trim(),
            sortOrder: typeof sortOrder === 'number' ? sortOrder : maxSort + 1,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            searchQuery: (searchQuery && searchQuery.trim()) ? searchQuery.trim() : text.trim()
        });

        await config.save();
        return res.status(201).json({ success: true, message: 'Popular tag added', data: config.popularSearches });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Update popular search tag
 */
export async function updatePopularSearch(req, res, next) {
    try {
        const { id } = req.params;
        const { text, sortOrder, isActive, searchQuery } = req.body;

        const config = await getOrCreateConfig();
        const tag = config.popularSearches.id(id);
        if (!tag) {
            return res.status(404).json({ success: false, message: 'Popular tag not found' });
        }

        if (text !== undefined) tag.text = text.trim();
        if (sortOrder !== undefined) tag.sortOrder = Number(sortOrder);
        if (isActive !== undefined) tag.isActive = Boolean(isActive);
        if (searchQuery !== undefined) tag.searchQuery = searchQuery.trim();

        await config.save();
        return res.status(200).json({ success: true, message: 'Popular tag updated', data: tag });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Delete popular search tag
 */
export async function deletePopularSearch(req, res, next) {
    try {
        const { id } = req.params;
        const config = await getOrCreateConfig();

        config.popularSearches = config.popularSearches.filter(p => String(p._id) !== String(id));
        await config.save();

        return res.status(200).json({ success: true, message: 'Popular tag deleted', data: config.popularSearches });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Reorder popular searches
 */
export async function reorderPopularSearches(req, res, next) {
    try {
        const { orderedIds } = req.body; // array of string IDs in desired order
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
        }

        const config = await getOrCreateConfig();
        orderedIds.forEach((id, index) => {
            const item = config.popularSearches.id(id);
            if (item) {
                item.sortOrder = index + 1;
            }
        });

        await config.save();
        return res.status(200).json({ 
            success: true, 
            message: 'Popular searches reordered successfully',
            data: config.popularSearches.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Add New Launch Banner
 */
export async function createNewLaunch(req, res, next) {
    try {
        const { title, subtitle, image, badge, link, searchQuery, sortOrder, isActive } = req.body;
        if (!image || !image.trim()) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const config = await getOrCreateConfig();
        const maxSort = config.newLaunches.length > 0 
            ? Math.max(...config.newLaunches.map(p => p.sortOrder ?? 0))
            : 0;

        config.newLaunches.push({
            title: title ? title.trim() : '',
            subtitle: subtitle ? subtitle.trim() : '',
            image: image.trim(),
            badge: badge ? badge.trim() : '',
            link: link ? link.trim() : '',
            searchQuery: searchQuery ? searchQuery.trim() : (title ? title.trim() : ''),
            sortOrder: typeof sortOrder === 'number' ? sortOrder : maxSort + 1,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        await config.save();
        return res.status(201).json({ success: true, message: 'New launch created', data: config.newLaunches });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Update New Launch Banner
 */
export async function updateNewLaunch(req, res, next) {
    try {
        const { id } = req.params;
        const config = await getOrCreateConfig();
        const launch = config.newLaunches.id(id);

        if (!launch) {
            return res.status(404).json({ success: false, message: 'New launch not found' });
        }

        Object.assign(launch, req.body);
        await config.save();

        return res.status(200).json({ success: true, message: 'New launch updated', data: launch });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Delete New Launch Banner
 */
export async function deleteNewLaunch(req, res, next) {
    try {
        const { id } = req.params;
        const config = await getOrCreateConfig();

        config.newLaunches = config.newLaunches.filter(item => String(item._id) !== String(id));
        await config.save();

        return res.status(200).json({ success: true, message: 'New launch deleted', data: config.newLaunches });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Reorder New Launches
 */
export async function reorderNewLaunches(req, res, next) {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
        }

        const config = await getOrCreateConfig();
        orderedIds.forEach((id, index) => {
            const item = config.newLaunches.id(id);
            if (item) {
                item.sortOrder = index + 1;
            }
        });

        await config.save();
        return res.status(200).json({ 
            success: true, 
            message: 'New launches reordered',
            data: config.newLaunches.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Add Search By Tab
 */
export async function createSearchByTab(req, res, next) {
    try {
        const { name, key, items, sortOrder, isActive } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Tab name is required' });
        }

        const config = await getOrCreateConfig();
        const maxSort = config.searchByTabs.length > 0 
            ? Math.max(...config.searchByTabs.map(p => p.sortOrder ?? 0))
            : 0;

        config.searchByTabs.push({
            name: name.trim(),
            key: key ? key.trim().toLowerCase() : name.trim().toLowerCase(),
            items: Array.isArray(items) ? items : [],
            sortOrder: typeof sortOrder === 'number' ? sortOrder : maxSort + 1,
            isActive: isActive !== undefined ? Boolean(isActive) : true
        });

        await config.save();
        return res.status(201).json({ success: true, message: 'Tab created', data: config.searchByTabs });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Update Search By Tab
 */
export async function updateSearchByTab(req, res, next) {
    try {
        const { id } = req.params;
        const config = await getOrCreateConfig();
        const tab = config.searchByTabs.id(id);

        if (!tab) {
            return res.status(404).json({ success: false, message: 'Tab not found' });
        }

        Object.assign(tab, req.body);
        await config.save();

        return res.status(200).json({ success: true, message: 'Tab updated', data: tab });
    } catch (error) {
        next(error);
    }
}

/**
 * Admin: Delete Search By Tab
 */
export async function deleteSearchByTab(req, res, next) {
    try {
        const { id } = req.params;
        const config = await getOrCreateConfig();

        config.searchByTabs = config.searchByTabs.filter(t => String(t._id) !== String(id));
        await config.save();

        return res.status(200).json({ success: true, message: 'Tab deleted', data: config.searchByTabs });
    } catch (error) {
        next(error);
    }
}

