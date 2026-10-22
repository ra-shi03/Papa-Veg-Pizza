import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Question/Title is required'],
            trim: true
        },
        content: {
            type: String,
            required: [true, 'Answer/Content is required'],
            trim: true
        },
        category: {
            type: String,
            default: 'General',
            trim: true,
            index: true
        },
        order: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_faqs',
        timestamps: true
    }
);

faqSchema.index({ category: 1, order: 1 });

export const FoodFaq = mongoose.model('FoodFaq', faqSchema);

