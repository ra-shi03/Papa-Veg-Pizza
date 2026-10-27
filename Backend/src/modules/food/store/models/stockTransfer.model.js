import mongoose from 'mongoose';

// A request to move stock from a sister store (same franchise) into this one. It waits for approval;
// stock only moves when it is approved (approval is not part of the store-manager screens yet).
const stockTransferSchema = new mongoose.Schema(
    {
        fromStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        toStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null },
        ingredientName: { type: String, required: true, trim: true },
        fromIngredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true },
        toIngredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true },
        unit: { type: String, default: '', trim: true },
        quantity: { type: Number, required: true, min: 0.01 },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
        reason: { type: String, default: '', trim: true, maxlength: 500 },
        remarks: { type: String, default: '', trim: true, maxlength: 500 },
        shortageId: { type: mongoose.Schema.Types.ObjectId, ref: 'IngredientShortage', default: null },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        requestedByName: { type: String, default: '', trim: true }
    },
    { collection: 'food_stock_transfers', timestamps: true }
);

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
