import mongoose from 'mongoose';

// An ingredient the kitchen cannot get enough of right now. Reported from the pizza station / preparation
// board (with the pizza it blocks), or raised automatically when counted stock hits zero.
const timelineSchema = new mongoose.Schema(
    {
        user: { type: String, default: '' },
        action: { type: String, default: '' },
        remarks: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const ingredientShortageSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true },
        ingredientName: { type: String, default: '', trim: true },
        shortageQty: { type: Number, default: 0, min: 0 },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
        status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
        actionTaken: { type: String, default: '', trim: true, maxlength: 200 },
        remarks: { type: String, default: '', trim: true, maxlength: 600 },
        kitchenItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenItem', default: null },
        notifyManager: { type: Boolean, default: false },
        system: { type: Boolean, default: false }, // raised automatically from stock levels
        createdBy: { type: String, default: '', trim: true },
        createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        resolvedBy: { type: String, default: '', trim: true },
        resolvedAt: { type: Date, default: null },
        resolutionNote: { type: String, default: '', trim: true, maxlength: 600 },
        timeline: { type: [timelineSchema], default: [] }
    },
    { collection: 'food_ingredient_shortages', timestamps: true }
);

ingredientShortageSchema.index({ storeId: 1, createdAt: -1 });

export const IngredientShortage = mongoose.model('IngredientShortage', ingredientShortageSchema);
