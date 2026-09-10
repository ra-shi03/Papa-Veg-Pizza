import mongoose from 'mongoose';

const foodItemSchema = new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        image: {
            type: String,
            default: ''
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },
        isVeg: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_items',
        timestamps: true
    }
);

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
