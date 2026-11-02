import mongoose from 'mongoose';

const businessSettingsSchema = new mongoose.Schema(
    {
        // Empty until the super admin fills them in: an empty contact is hidden in the apps
        companyName: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true },
        website: { type: String, default: '', trim: true },
        phone: {
            countryCode: { type: String, default: '+91' },
            number: { type: String, default: '' }
        },
        address: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        region: { type: String, default: 'India' },
        logo: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' }
        },
        favicon: {
            url: { type: String, default: '' },
            publicId: { type: String, default: '' }
        },
        supportEmail: { type: String, default: '', trim: true },
        supportPhone: { type: String, default: '', trim: true },
        supportHours: { type: String, default: '', trim: true },
        cateringPhone: { type: String, default: '', trim: true },
        cateringEmail: { type: String, default: '', trim: true },
        whatsappNumber: { type: String, default: '', trim: true },
        gstin: { type: String, default: '', trim: true },
        faqContactText: { type: String, default: '', trim: true },
        // Train delivery: which store serves each station (never public). No store here means no train delivery.
        trainDelivery: {
            defaultStoreId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', default: null },
            stations: {
                type: [{
                    _id: false,
                    name: { type: String, required: true, trim: true },
                    code: { type: String, required: true, trim: true, uppercase: true },
                    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
                }],
                default: [],
            },
        },
        // Theme / branding colors set by Superadmin — applied across all panels
        primaryColor: { type: String, default: '#a43c12' },
        secondaryColor: { type: String, default: '#ff7f50' },
        themeMode: { type: String, enum: ['light', 'dark'], default: 'light' }
    },
    { timestamps: true }
);

export const FoodBusinessSettings = mongoose.model('FoodBusinessSettings', businessSettingsSchema);
