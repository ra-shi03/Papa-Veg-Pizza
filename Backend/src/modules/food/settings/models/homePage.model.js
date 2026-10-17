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
        promoText: {
            type: String,
            default: 'LOWEST PRICES ONLY ON APP | FREE DELIVERY ABOVE ₹99',
            trim: true
        },
        cravingHeading: {
            type: String,
            default: 'What are you craving for?',
            trim: true
        },
        banners: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
                resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
                uploadedAt: { type: Date, default: Date.now },
                category: { type: String, default: '' },
                categoryName: { type: String, default: '' },
                link: { type: String, default: '' }
            }
        ],
        orderMethods: [
            {
                id: { type: String, required: true },
                label: { type: String, required: true },
                icon: { type: String },
                enabled: { type: Boolean, default: true }
            }
        ],
        trainConfig: {
            bannerTitle: { type: String, default: 'Pizza On Your Seat' },
            bannerSubtitle: { type: String, default: 'We will deliver your favourite Pizza right on your train seat while you travel.' },
            formTitle: { type: String, default: 'Enter PNR to get started' },
            terms: [{ type: String }],
            faqs: [
                {
                    question: { type: String },
                    answer: { type: String }
                }
            ]
        },
        adPopup: {
            enabled: { type: Boolean, default: false },
            imageUrl: { type: String, default: '' },
            link: { type: String, default: '' },
            frequencyRule: { type: String, enum: ['once_per_session', 'once_per_day', 'every_launch'], default: 'once_per_session' },
            startDate: { type: Date },
            endDate: { type: Date }
        },
        menuFilters: {
            vegOnly: {
                enabled: { type: Boolean, default: true },
                label: { type: String, default: 'Veg Only' },
                defaultActive: { type: Boolean, default: true }
            },
            sortBy: {
                enabled: { type: Boolean, default: true },
                label: { type: String, default: 'Sort by' },
                defaultOption: { type: String, default: 'default' }
            }
        },
        deliveryCard: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Lowest Prices on Papa Veg Pizza App & Free Delivery' },
            subtitle: { type: String, default: 'Add items worth ₹99 to get FREE delivery!' },
            iconType: { type: String, enum: ['image', 'animation'], default: 'animation' },
            iconUrl: { type: String, default: '' },
            animationType: { type: String, default: 'scooter' },
            link: { type: String, default: '/user/menu' }
        },
        bottomNav: [
            {
                id: { type: String, required: true },
                label: { type: String, required: true },
                icon: { type: String, default: 'local_pizza' },
                iconType: { type: String, enum: ['material', 'image'], default: 'material' },
                iconUrl: { type: String, default: '' },
                badge: { type: String, default: '' },
                link: { type: String, default: '/user/menu' },
                enabled: { type: Boolean, default: true },
                sortOrder: { type: Number, default: 1 }
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
