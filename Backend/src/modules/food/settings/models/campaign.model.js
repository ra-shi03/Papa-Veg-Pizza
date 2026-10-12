import mongoose from 'mongoose';

const campaignItemSchema = new mongoose.Schema(
    {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        badgeText: { type: String, trim: true, default: '' },
        overrideImage: { type: String, trim: true, default: '' },
        overrideToppingsText: { type: String, trim: true, default: '' },
        defaultVariant: {
            sizeName: { type: String, trim: true, default: '' },
            crustName: { type: String, trim: true, default: '' }
        },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    },
    { _id: true }
);

const campaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, unique: true, index: true },
        logoImage: { type: String, required: true, trim: true },
        bannerImage: { type: String, trim: true, default: '' },
        heading: { type: String, trim: true, default: '' },
        tagline: { type: String, trim: true, default: '' },
        gradientFrom: { type: String, trim: true, default: '' },
        gradientTo: { type: String, trim: true, default: '' },
        items: [campaignItemSchema],
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true, index: true },
        sortOrder: { type: Number, default: 0, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'food_campaigns',
        timestamps: true
    }
);

campaignSchema.index({ startDate: 1, endDate: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);

