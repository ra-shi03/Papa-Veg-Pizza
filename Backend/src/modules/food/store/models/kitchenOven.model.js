import mongoose from 'mongoose';

// A baking oven of one store. Whether it is busy is derived from the items baking in it; only the
// maintenance / offline switches are stored.
const kitchenOvenSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        number: { type: String, required: true, trim: true }, // e.g. OVEN-01
        state: { type: String, enum: ['active', 'maintenance', 'offline'], default: 'active' },
        temperature: { type: Number, default: 250, min: 0, max: 600 }
    },
    { collection: 'food_kitchen_ovens', timestamps: true }
);

kitchenOvenSchema.index({ storeId: 1, number: 1 }, { unique: true });

export const KitchenOven = mongoose.model('KitchenOven', kitchenOvenSchema);
