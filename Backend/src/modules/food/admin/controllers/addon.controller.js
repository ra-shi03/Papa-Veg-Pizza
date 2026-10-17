import { Addon } from '../models/addon.model.js';
import { Product } from '../models/product.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

export const createAddon = async (req, res) => {
    try {
        const addon = await Addon.create(req.body);
        return sendResponse(res, 201, 'Addon created successfully', addon);
    } catch (error) {
        return sendError(res, 500, 'Failed to create addon', error.message);
    }
};

const DEFAULT_ADDONS = [
    {
        name: 'New Hand Tossed',
        type: 'Crust',
        prices: [
            { size: 'Regular', price: 0 },
            { size: 'Medium', price: 0 },
            { size: 'Large', price: 0 },
            { size: 'Default', price: 0 }
        ],
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
        status: 'Active',
        isDefault: true
    },
    {
        name: 'Paneer',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 45 },
            { size: 'Medium', price: 60 },
            { size: 'Large', price: 80 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Crisp Capsicum',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 35 },
            { size: 'Medium', price: 45 },
            { size: 'Large', price: 60 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Red Paprika',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 35 },
            { size: 'Medium', price: 45 },
            { size: 'Large', price: 60 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Golden Corn',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 35 },
            { size: 'Medium', price: 45 },
            { size: 'Large', price: 60 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Grilled Mushroom',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 45 },
            { size: 'Medium', price: 60 },
            { size: 'Large', price: 80 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Black Olives',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 40 },
            { size: 'Medium', price: 55 },
            { size: 'Large', price: 70 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Jalapeno',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 35 },
            { size: 'Medium', price: 45 },
            { size: 'Large', price: 60 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Extra Cheese',
        type: 'topping',
        prices: [
            { size: 'Regular', price: 60 },
            { size: 'Medium', price: 80 },
            { size: 'Large', price: 100 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Cheesy Dip',
        type: 'dip',
        prices: [
            { size: 'Regular', price: 30 },
            { size: 'Medium', price: 30 },
            { size: 'Large', price: 30 }
        ],
        image: '',
        status: 'Active'
    },
    {
        name: 'Jalapeno Dip',
        type: 'dip',
        prices: [
            { size: 'Regular', price: 30 },
            { size: 'Medium', price: 30 },
            { size: 'Large', price: 30 }
        ],
        image: '',
        status: 'Active'
    }
];

export const normalizeAddonType = (rawType = '') => {
    const t = String(rawType || '').trim().toLowerCase();
    if (t.includes('crust')) return 'crust';
    if (t.includes('cheese')) return 'cheese';
    if (t.includes('dip') || t.includes('sauce')) return 'dip';
    if (t.includes('topping')) return 'topping';
    if (t.includes('burst')) return 'burst';
    return t || 'other';
};

export const getAddons = async (req, res) => {
    try {
        let count = await Addon.countDocuments();
        if (count === 0) {
            try {
                await Addon.insertMany(DEFAULT_ADDONS);
            } catch (seedErr) {
                console.error('Failed to seed default addons:', seedErr);
            }
        } else {
            // Also ensure crust addons exist if only toppings were present
            const crustCount = await Addon.countDocuments({ type: { $regex: /^crust$/i } });
            if (crustCount === 0) {
                const crustsToSeed = DEFAULT_ADDONS.filter(a => normalizeAddonType(a.type) === 'crust');
                await Addon.insertMany(crustsToSeed);
            } else {
                // Ensure default 'New Hand Tossed' crust exists
                const existingHandTossed = await Addon.findOne({ name: { $regex: /^new hand tossed$/i } });
                if (!existingHandTossed) {
                    await Addon.create({
                        name: 'New Hand Tossed',
                        type: 'Crust',
                        prices: [
                            { size: 'Regular', price: 0 },
                            { size: 'Medium', price: 0 },
                            { size: 'Large', price: 0 },
                            { size: 'Default', price: 0 }
                        ],
                        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
                        status: 'Active',
                        isDefault: true
                    });
                }
            }
        }

        // Count how many products use each addon in their toppings array
        const allProducts = await Product.find().select('toppings');
        const connectedAddonCountMap = {};
        allProducts.forEach(p => {
            if (Array.isArray(p.toppings)) {
                p.toppings.forEach(tid => {
                    if (tid) {
                        const idStr = tid.toString();
                        connectedAddonCountMap[idStr] = (connectedAddonCountMap[idStr] || 0) + 1;
                    }
                });
            }
        });

        const { type, status } = req.query;
        const queryFilter = {};
        if (status) {
            queryFilter.status = { $regex: new RegExp(`^${status}$`, 'i') };
        }
        if (type) {
            queryFilter.type = { $regex: new RegExp(type, 'i') };
        }

        const addons = await Addon.find(queryFilter).sort({ createdAt: -1 });
        const addonsWithCounts = addons.map(a => {
            const doc = a.toObject();
            doc.connectedProductsCount = connectedAddonCountMap[a._id.toString()] || 0;
            return doc;
        });

        return sendResponse(res, 200, 'Addons fetched successfully', addonsWithCounts);
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch addons', error.message);
    }
};

export const getAddonById = async (req, res) => {
    try {
        const { id } = req.params;
        const addon = await Addon.findById(id);
        if (!addon) return sendError(res, 404, 'Addon not found');
        return sendResponse(res, 200, 'Addon fetched successfully', addon);
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch addon', error.message);
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

export const getAddonStats = async (req, res) => {
    try {
        const totalAddons = await Addon.countDocuments();
        const activeAddons = await Addon.countDocuments({ status: { $regex: /^active$/i } });
        const inactiveAddons = await Addon.countDocuments({ status: { $regex: /^inactive$/i } });

        // Calculate average price across all addons
        const allAddons = await Addon.find().select('_id name type status prices price isDefault');
        let totalPriceSum = 0;
        let priceCount = 0;
        allAddons.forEach(a => {
            if (a.prices && a.prices.length > 0) {
                totalPriceSum += Number(a.prices[0].price || 0);
                priceCount += 1;
            } else if (a.price) {
                totalPriceSum += Number(a.price || 0);
                priceCount += 1;
            }
        });
        const avgPrice = priceCount > 0 ? (totalPriceSum / priceCount).toFixed(2) : "0.00";

        // Count connected products per addon
        const allProducts = await Product.find().select('toppings');
        const connectedAddonCountMap = {};
        allProducts.forEach(p => {
            if (Array.isArray(p.toppings)) {
                p.toppings.forEach(tid => {
                    if (tid) {
                        const idStr = tid.toString();
                        connectedAddonCountMap[idStr] = (connectedAddonCountMap[idStr] || 0) + 1;
                    }
                });
            }
        });

        // Group addons strictly by normalized canonical types - NO DUPLICATES!
        const TYPE_META = {
            crust: { key: 'crust', label: 'Crusts' },
            topping: { key: 'topping', label: 'Toppings' },
            dip: { key: 'dip', label: 'Dips & Sauces' },
            cheese: { key: 'cheese', label: 'Cheese & Extra Cheese' },
            burst: { key: 'burst', label: 'Burst' }
        };

        const typeMap = new Map();

        allAddons.forEach(a => {
            const rawType = (a.type || 'topping').trim();
            const normKey = normalizeAddonType(rawType);
            const meta = TYPE_META[normKey] || {
                key: normKey,
                label: rawType.charAt(0).toUpperCase() + rawType.slice(1)
            };

            if (!typeMap.has(normKey)) {
                typeMap.set(normKey, {
                    type: normKey,
                    rawType,
                    label: meta.label,
                    count: 0,
                    activeCount: 0,
                    inactiveCount: 0,
                    connectedProductsCount: 0
                });
            }

            const entry = typeMap.get(normKey);
            entry.count += 1;
            const isActive = (a.status || '').toLowerCase() === 'active';
            if (isActive) entry.activeCount += 1;
            else entry.inactiveCount += 1;

            const connectedCount = connectedAddonCountMap[a._id.toString()] || 0;
            entry.connectedProductsCount += connectedCount;
        });

        // Filter out types with count 0 and sort in standard logical order
        const preferredOrder = ['crust', 'topping', 'dip', 'cheese', 'burst'];
        const types = Array.from(typeMap.values())
            .filter(t => t.count > 0)
            .sort((a, b) => {
                const idxA = preferredOrder.indexOf(a.type);
                const idxB = preferredOrder.indexOf(b.type);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.label.localeCompare(b.label);
            });

        const typeCounts = {};
        types.forEach(t => {
            typeCounts[t.type] = t.count;
        });

        return sendResponse(res, 200, 'Addon stats fetched successfully', {
            totalAddons,
            activeAddons,
            inactiveAddons,
            avgPrice,
            types,
            typeCounts
        });
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch addon stats', error.message);
    }
};
