import mongoose from 'mongoose';

const showcaseItemSchema = new mongoose.Schema(
    {
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: false 
        },
        customTitle: { type: String, trim: true, default: '' },
        customDescription: { type: String, trim: true, default: '' },
        customImage: { type: String, trim: true, default: '' },
        customPrice: { type: Number, default: 0 },
        customOriginalPrice: { type: Number, default: 0 },
        customSaveText: { type: String, trim: true, default: '' }, // e.g. "Save ₹1,150", "SAVE ₹84"
        sizeCrustText: { type: String, trim: true, default: 'Regular | New Hand Tossed >' }, // e.g. "Regular | New Hand Tossed >", "Large Plus | Cheese Burst >", "SERVES 1"
        buttonText: { type: String, trim: true, default: 'Add +' }, // e.g. "Add +", "Build your Combo >"
        badge: { type: String, trim: true, default: '' },
        vegType: { type: String, enum: ['veg', 'non-veg', 'vegan'], default: 'veg' },
        sortOrder: { type: Number, default: 0 }
    },
    { _id: true }
);

const showcaseSectionSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: [true, 'Section name is required'], 
            trim: true 
        },
        title: { 
            type: String, 
            required: [true, 'Display title is required'], 
            trim: true 
        },
        subtitle: { 
            type: String, 
            trim: true, 
            default: '' 
        },
        logoUrl: { 
            type: String, 
            trim: true, 
            default: '' 
        },
        badgeText: { 
            type: String, 
            trim: true, 
            default: '' 
        },
        bgStyle: { 
            type: String, 
            default: 'brand_red' 
        },
        bgColor: { 
            type: String, 
            trim: true, 
            default: '' 
        },
        isActive: { 
            type: Boolean, 
            default: true, 
            index: true 
        },
        sortOrder: { 
            type: Number, 
            default: 0, 
            index: true 
        },
        products: {
            type: [showcaseItemSchema],
            default: []
        }
    },
    {
        collection: 'food_showcase_sections',
        timestamps: true
    }
);

showcaseSectionSchema.index({ isActive: 1, sortOrder: 1 });

export const ShowcaseSection = mongoose.model('ShowcaseSection', showcaseSectionSchema);

