import mongoose from 'mongoose';

// One row per change of a store's price rule (edit, bulk update, copy, bulk action). Never updated or deleted.

const priceHistorySchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        oldPrice: { type: mongoose.Schema.Types.Mixed, default: {} },
        newPrice: { type: mongoose.Schema.Types.Mixed, default: {} },
        changedBy: { type: String, default: '' },
        changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reason: { type: String, default: '', trim: true, maxlength: 300 }
    },
    { collection: 'food_price_history', timestamps: { createdAt: true, updatedAt: false } }
);

priceHistorySchema.index({ productId: 1, createdAt: -1 });
priceHistorySchema.index({ storeId: 1, createdAt: -1 });

export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
