import mongoose from 'mongoose';

const homeSectionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['offers', 'campaign', 'category_list', 'banner'],
            required: true
        },
        referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'refModel' },
        refModel: {
            type: String,
            enum: ['Campaign', 'Category', 'FoodBanner'], // Extendable based on type
            default: null
        },
        title: { type: String, trim: true, default: '' },
        platform: {
            type: String,
            enum: ['all', 'web', 'app'],
            default: 'all'
        },
        isActive: { type: Boolean, default: true, index: true },
        sortOrder: { type: Number, default: 0, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'food_home_sections',
        timestamps: true
    }
);

export const HomeSection = mongoose.model('HomeSection', homeSectionSchema);

