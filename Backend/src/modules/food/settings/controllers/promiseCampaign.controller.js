import { PromiseCampaign } from '../models/promiseCampaign.model.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

const getDefaultPromiseConfig = () => ({
    header: {
        title: 'Papa Veg Promise',
        subtitle: 'Where quality food meets honest prices!',
        tagline: '100% Pure Vegetarian Delight',
        stars: '★★',
        orderButtonText: 'Order Now',
        badgeText: 'Promise',
        showBadge: true
    },
    tickerItems: [
        {
            id: 'tick-1',
            heading: 'Papa Veg Promise',
            tagline: 'Where quality food meets honest prices!',
            isActive: true
        },
        {
            id: 'tick-2',
            heading: '100% Pure Vegetarian',
            tagline: '0% Preservatives & Fresh Dough Daily in Every Store',
            isActive: true
        },
        {
            id: 'tick-3',
            heading: 'Lowest Pricing Guarantee',
            tagline: 'No Weather Surge & Free Delivery with Minimum Order',
            isActive: true
        }
    ],
    tabs: [
        {
            id: 'lowest-pricing',
            name: 'LOWEST PRICING',
            badgeText: 'Only on the Papa Veg Pizza App!',
            badgeSubtext: 'Special customer benefits',
            order: 0,
            isActive: true,
            items: [
                {
                    id: 'lp-1',
                    title: 'No Weather Surge',
                    description: 'Rain or Storm, our prices stay the same',
                    icon: 'Zap',
                    order: 0,
                    isActive: true
                },
                {
                    id: 'lp-2',
                    title: 'No Late Night Fee',
                    description: 'Mid-night cravings come with zero extra charges',
                    icon: 'Moon',
                    order: 1,
                    isActive: true
                },
                {
                    id: 'lp-3',
                    title: 'Rewards & Offers',
                    description: 'Earn Cheesy Rewards to Grab Your Free Pizza!',
                    icon: 'Gift',
                    order: 2,
                    isActive: true
                },
                {
                    id: 'lp-4',
                    title: 'Pizza Delivery Experts',
                    description: 'Delivered by Our Own Riders? Hot, Fresh & Perfectly Packed!',
                    icon: 'Truck',
                    order: 3,
                    isActive: true
                },
                {
                    id: 'lp-5',
                    title: 'Lowest Packaging Fees',
                    description: 'Now, save on packaging, splurge on pizzas',
                    icon: 'Box',
                    order: 4,
                    isActive: true
                },
                {
                    id: 'lp-6',
                    title: 'Free Delivery @99',
                    description: 'Unlock free delivery on all your orders with a minimum order of just ₹99',
                    icon: 'Bike',
                    order: 5,
                    isActive: true
                }
            ]
        },
        {
            id: 'highest-quality',
            name: 'HIGHEST QUALITY',
            badgeText: 'Great food, no compromises!',
            badgeSubtext: 'Artisanal ingredients & prep',
            order: 1,
            isActive: true,
            items: [
                {
                    id: 'hq-1',
                    title: 'Freshly Baked, Not Frozen',
                    description: 'Pizza baked on order by experts, served piping hot!',
                    icon: 'Flame',
                    order: 0,
                    isActive: true
                },
                {
                    id: 'hq-2',
                    title: 'Pure Mozzarella Cheese',
                    description: 'Curated by experts for a perfect stretch',
                    icon: 'Award',
                    order: 1,
                    isActive: true
                },
                {
                    id: 'hq-3',
                    title: '100% Pure Vegetarian',
                    description: 'Wholesome, untouched & strictly pure veg ingredients',
                    icon: 'Heart',
                    order: 2,
                    isActive: true
                },
                {
                    id: 'hq-4',
                    title: 'No Additives',
                    description: 'No artificial preservatives, colours & flavours',
                    icon: 'ShieldCheck',
                    order: 3,
                    isActive: true
                },
                {
                    id: 'hq-5',
                    title: 'Added Nutrients',
                    description: 'Our pizza base is fortified with Iron, Folic Acid & Vitamin B12',
                    icon: 'Sparkles',
                    order: 4,
                    isActive: true
                },
                {
                    id: 'hq-6',
                    title: '100% Wheat Crust',
                    description: 'Relish our range of wheat based thin crust pizzas',
                    icon: 'Wheat',
                    order: 5,
                    isActive: true
                }
            ]
        }
    ],
    isActive: true
});

/**
 * Get Promise Campaign Configuration (Public & Admin)
 */
export const getPromiseCampaign = async (req, res) => {
    try {
        let doc = await PromiseCampaign.findOne().lean();
        if (!doc) {
            const initial = getDefaultPromiseConfig();
            doc = await PromiseCampaign.create(initial);
        }
        return sendResponse(res, 200, 'Promise campaign fetched successfully', doc);
    } catch (err) {
        console.error('Error fetching promise campaign:', err);
        return sendError(res, 500, 'Failed to fetch promise campaign', err.message);
    }
};

/**
 * Update Promise Campaign Entire Configuration (Superadmin)
 */
export const updatePromiseCampaign = async (req, res) => {
    try {
        const payload = req.body;
        let doc = await PromiseCampaign.findOne();

        if (!doc) {
            doc = new PromiseCampaign(payload);
        } else {
            if (payload.header) doc.header = { ...doc.header.toObject(), ...payload.header };
            if (Array.isArray(payload.tickerItems)) doc.tickerItems = payload.tickerItems;
            if (Array.isArray(payload.tabs)) doc.tabs = payload.tabs;
            if (typeof payload.isActive === 'boolean') doc.isActive = payload.isActive;
        }

        await doc.save();
        return sendResponse(res, 200, 'Promise campaign updated successfully', doc);
    } catch (err) {
        console.error('Error updating promise campaign:', err);
        return sendError(res, 500, 'Failed to update promise campaign', err.message);
    }
};

/**
 * Add an Item to a Specific Tab (Superadmin)
 */
export const addPromiseItem = async (req, res) => {
    try {
        const { tabId, item } = req.body;
        if (!tabId || !item || !item.title) {
            return sendError(res, 400, 'tabId and item.title are required');
        }

        let doc = await PromiseCampaign.findOne();
        if (!doc) {
            doc = await PromiseCampaign.create(getDefaultPromiseConfig());
        }

        const tab = doc.tabs.find(t => t.id === tabId);
        if (!tab) {
            return sendError(res, 404, `Tab '${tabId}' not found`);
        }

        const newItem = {
            id: item.id || `item-${Date.now()}`,
            title: item.title,
            description: item.description || '',
            icon: item.icon || 'Award',
            iconUrl: item.iconUrl || '',
            order: tab.items.length,
            isActive: item.isActive !== undefined ? item.isActive : true
        };

        tab.items.push(newItem);
        await doc.save();

        return sendResponse(res, 201, 'Promise item added successfully', { doc, newItem });
    } catch (err) {
        console.error('Error adding promise item:', err);
        return sendError(res, 500, 'Failed to add promise item', err.message);
    }
};

/**
 * Update an Item (Superadmin)
 */
export const updatePromiseItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const updates = req.body;

        let doc = await PromiseCampaign.findOne();
        if (!doc) {
            return sendError(res, 404, 'Promise campaign not found');
        }

        let found = false;
        for (const tab of doc.tabs) {
            const itemIndex = tab.items.findIndex(it => it.id === itemId);
            if (itemIndex > -1) {
                tab.items[itemIndex] = { ...tab.items[itemIndex].toObject(), ...updates };
                found = true;
                break;
            }
        }

        if (!found) {
            return sendError(res, 404, 'Promise item not found');
        }

        await doc.save();
        return sendResponse(res, 200, 'Promise item updated successfully', doc);
    } catch (err) {
        console.error('Error updating promise item:', err);
        return sendError(res, 500, 'Failed to update promise item', err.message);
    }
};

/**
 * Delete an Item (Superadmin)
 */
export const deletePromiseItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        let doc = await PromiseCampaign.findOne();
        if (!doc) {
            return sendError(res, 404, 'Promise campaign not found');
        }

        let found = false;
        for (const tab of doc.tabs) {
            const itemIndex = tab.items.findIndex(it => it.id === itemId);
            if (itemIndex > -1) {
                tab.items.splice(itemIndex, 1);
                found = true;
                break;
            }
        }

        if (!found) {
            return sendError(res, 404, 'Promise item not found');
        }

        await doc.save();
        return sendResponse(res, 200, 'Promise item deleted successfully', doc);
    } catch (err) {
        console.error('Error deleting promise item:', err);
        return sendError(res, 500, 'Failed to delete promise item', err.message);
    }
};

