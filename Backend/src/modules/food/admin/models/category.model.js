import mongoose from 'mongoose';

const foodCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        image: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        sortOrder: { type: Number, default: 0, index: true },
        isActive: { type: Boolean, default: true, index: true }
    },
    {
        collection: 'food_categories',
        timestamps: true
    }
);

export const FoodCategory = mongoose.model('FoodCategory', foodCategorySchema);
