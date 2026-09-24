import mongoose from 'mongoose';

const homePageSchema = new mongoose.Schema(
    {
        deliveryTimeMinutes: {
            type: Number,
            default: 30,
            min: [1, 'Delivery time must be at least 1 minute'],
            max: [180, 'Delivery time cannot exceed 180 minutes'],
            required: true
        },
        deliveryTimeLabel: {
            type: String,
            default: 'mins',
            trim: true
        },
        banners: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
                resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
                uploadedAt: { type: Date, default: Date.now }
            }
        ]
    },
    {
        collection: 'food_home_page_settings',
        timestamps: true
    }
);

// Ensure single configuration document
homePageSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            return next(new Error('Only one HomePage configuration can exist.'));
        }
    }
    next();
});

export const HomePage = mongoose.model('HomePage', homePageSchema);
