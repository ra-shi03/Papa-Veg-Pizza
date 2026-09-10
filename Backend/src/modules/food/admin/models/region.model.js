import mongoose from 'mongoose';

const regionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true
        },
        country: {
            type: String,
            required: true,
            trim: true,
            default: 'India',
            index: true
        },
        description: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_regions',
        timestamps: true
    }
);

export const FoodRegion = mongoose.model('FoodRegion', regionSchema);
