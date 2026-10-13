import { Addon } from '../models/addon.model.js';
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
        type: 'crust',
        prices: [
            { size: 'Regular', price: 0 },
            { size: 'Medium', price: 0 },
            { size: 'Large', price: 0 }
        ],
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80',
        status: 'Active'
    },
    {
        name: 'Cheese Burst',
        type: 'crust',
        prices: [
            { size: 'Regular', price: 75 },
            { size: 'Medium', price: 95 },
            { size: 'Large', price: 120 }
        ],
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&auto=format&fit=crop&q=80',
        status: 'Active'
    },
    {
        name: '100% Wheat Thin Crust',
        type: 'crust',
        prices: [
            { size: 'Regular', price: 50 },
            { size: 'Medium', price: 70 },
            { size: 'Large', price: 90 }
        ],
        image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=300&auto=format&fit=crop&q=80',
        status: 'Active'
    },
    {
        name: 'Fresh Pan',
        type: 'crust',
        prices: [
            { size: 'Regular', price: 40 },
            { size: 'Medium', price: 60 },
            { size: 'Large', price: 80 }
        ],
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80',
        status: 'Active'
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
                const crustsToSeed = DEFAULT_ADDONS.filter(a => a.type === 'crust');
                await Addon.insertMany(crustsToSeed);
            }
        }
        const addons = await Addon.find().sort({ createdAt: -1 });
        return sendResponse(res, 200, 'Addons fetched successfully', addons);
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
