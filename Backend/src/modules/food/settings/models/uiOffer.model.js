import mongoose from 'mongoose';

const uiOfferSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true, default: '' },
        iconImage: { type: String, trim: true, default: '' },
        backgroundColorToken: { type: String, trim: true, default: '--primary' },
        buttonText: { type: String, trim: true, default: 'View' },
        actionType: {
            type: String,
            enum: ['apply_coupon', 'open_product', 'open_category', 'open_campaign', 'open_url'],
            required: true
        },
        actionValue: { type: String, trim: true, default: '' },
        showDetailsModal: { type: Boolean, default: false },
        offerDetails: [{ type: String, trim: true }],
        minOrderValue: { type: Number, min: 0, default: 0 },
        maxDiscount: { type: Number, min: 0, default: 0 },
        couponCode: { type: String, trim: true, uppercase: true },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true, index: true },
        sortOrder: { type: Number, default: 0, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    {
        collection: 'food_ui_offers',
        timestamps: true
    }
);

uiOfferSchema.index({ startDate: 1, endDate: 1 });

export const UiOffer = mongoose.model('UiOffer', uiOfferSchema);

