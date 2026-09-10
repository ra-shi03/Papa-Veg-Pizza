import mongoose from 'mongoose';

const foodBannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['global', 'local'],
            default: 'global'
        },
        franchiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodFranchise',
            default: null,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            default: null,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_banners',
        timestamps: true
    }
);

export const FoodBanner = mongoose.model('FoodBanner', foodBannerSchema);
