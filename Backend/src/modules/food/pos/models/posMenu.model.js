import mongoose from 'mongoose';

// The last menu a store's Pet Pooja sent (Push Menu) or the manager fetched (Fetch Menu): one per store, replaced each
// time. Only what mapping and sending orders need is kept (ids, names, prices, on/off), see petpooja.adapter.js parseMenu.
const variationSchema = new mongoose.Schema({
    id: String, variationId: String, name: String, group: String, price: Number, active: Boolean,
}, { _id: false });

const itemSchema = new mongoose.Schema({
    id: String, name: String, category: String, price: Number, active: Boolean, inStock: Boolean,
    variations: { type: [variationSchema], default: [] },
    addonGroupIds: { type: [String], default: [] },
}, { _id: false });

const addonGroupSchema = new mongoose.Schema({
    id: String, name: String, active: Boolean,
    items: { type: [{ _id: false, id: String, name: String, price: Number, active: Boolean }], default: [] },
}, { _id: false });

const posMenuSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        provider: { type: String, enum: ['petpooja'], default: 'petpooja' },
        restaurantId: { type: String, default: '', trim: true },
        restaurantName: { type: String, default: '', trim: true },
        source: { type: String, enum: ['push', 'fetch'], required: true },
        receivedAt: { type: Date, default: Date.now },
        items: { type: [itemSchema], default: [] },
        addonGroups: { type: [addonGroupSchema], default: [] },
        taxes: { type: [{ _id: false, id: String, name: String, rate: Number, active: Boolean }], default: [] },
    },
    { timestamps: true, collection: 'food_pos_menus' },
);

posMenuSchema.index({ storeId: 1, provider: 1 }, { unique: true });

export const PosMenu = mongoose.models.PosMenu || mongoose.model('PosMenu', posMenuSchema);
