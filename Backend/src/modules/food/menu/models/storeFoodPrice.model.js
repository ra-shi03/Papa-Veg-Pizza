import mongoose from 'mongoose';

const storeFoodPriceSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            required: true,
            index: true
        },
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem',
            required: true,
            index: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        isAvailable: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_store_food_prices',
        timestamps: true
    }
);

storeFoodPriceSchema.index({ storeId: 1, foodId: 1 }, { unique: true });

export const StoreFoodPrice = mongoose.model('StoreFoodPrice', storeFoodPriceSchema);
