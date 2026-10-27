import mongoose from 'mongoose';

// Every change to an ingredient's stock, with the numbers before and after (the History modal).
const stockTransactionSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true, index: true },
        type: { type: String, enum: ['stock_in', 'stock_out', 'adjustment'], required: true },
        quantity: { type: Number, required: true, min: 0 },
        previousStock: { type: Number, required: true, min: 0 },
        newStock: { type: Number, required: true, min: 0 },
        reason: { type: String, default: '', trim: true, maxlength: 600 },
        source: { type: String, enum: ['manual', 'waste', 'stock_request', 'transfer'], default: 'manual' },
        createdBy: { type: String, default: '', trim: true },
        createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { collection: 'food_stock_transactions', timestamps: true }
);

stockTransactionSchema.index({ ingredientId: 1, createdAt: -1 });

export const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);
