import mongoose from 'mongoose';

// A store's own price for one catalogue product (Store Pricing screen). Without a row the catalogue price applies.
// small / medium / large map onto the product's sizes (see storePricing.service.js sizeSlots); while a promotion
// runs (startDate..endDate) specialPrice replaces the medium price. INACTIVE turns the rule off (catalogue price),
// UNAVAILABLE stops the store selling the product.

const storeProductPriceSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', required: true, index: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        smallPrice: { type: Number, default: 0, min: 0 },
        mediumPrice: { type: Number, default: 0, min: 0 },
        largePrice: { type: Number, default: 0, min: 0 },
        deliveryPrice: { type: Number, default: 0, min: 0 },
        takeawayPrice: { type: Number, default: 0, min: 0 },
        dineInPrice: { type: Number, default: 0, min: 0 },
        specialPrice: { type: Number, default: 0, min: 0 },
        startDate: { type: String, default: '' }, // YYYY-MM-DD
        endDate: { type: String, default: '' },
        availability: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE', 'PROMOTION ACTIVE'], default: 'AVAILABLE' },
        status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
        updatedBy: { type: String, default: '' },
        updatedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { collection: 'food_store_product_prices', timestamps: true }
);

storeProductPriceSchema.index({ storeId: 1, productId: 1 }, { unique: true });

export const StoreProductPrice = mongoose.model('StoreProductPrice', storeProductPriceSchema);
