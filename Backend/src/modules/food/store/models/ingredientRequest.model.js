import mongoose from 'mongoose';

// "Request ingredient" from My Tasks: a kitchen person asks the store manager for stock. The wider
// inventory module (stock levels, transfers, fulfilment) builds on this collection later.
const ingredientRequestSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenTask', default: null },
        ingredientName: { type: String, required: true, trim: true, maxlength: 120 },
        quantity: { type: Number, required: true, min: 0.01, max: 100000 },
        unit: { type: String, required: true, trim: true, maxlength: 20 },
        reason: { type: String, default: '', trim: true, maxlength: 500 },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'], default: 'Pending', index: true }
    },
    { collection: 'food_ingredient_requests', timestamps: true }
);

ingredientRequestSchema.index({ storeId: 1, createdAt: -1 });

export const IngredientRequest = mongoose.model('IngredientRequest', ingredientRequestSchema);
