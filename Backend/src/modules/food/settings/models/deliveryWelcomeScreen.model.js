import mongoose from 'mongoose';

const deliveryWelcomeScreenSchema = new mongoose.Schema({
    companyName: { type: String, default: 'Papa Veg Pizza' },
    partnerBadgeText: { type: String, default: 'DELIVERY PARTNER' },
    logoUrl: { type: String, default: '' },
    titlePrimary: { type: String, default: 'WELCOME TO' },
    titleHighlight: { type: String, default: 'FOOD DELIVERY' },
    subtitle: { type: String, default: 'Deliver delicious meals, earn great incentives, and enjoy flexible working hours.' },
    heroMediaUrl: { type: String, default: '/delivery_welcome_rider.png' },
    plateMediaUrl: { type: String, default: '/hero-pizza.png' },
    buttonText: { type: String, default: 'Get Started' },
    loginLinkText: { type: String, default: 'Already a partner? Sign In' },
    primaryColor: { type: String, default: '#EE3A43' },
    secondaryColor: { type: String, default: '#FF5722' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure only one settings document exists
deliveryWelcomeScreenSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            return next(new Error('Only one DeliveryWelcomeScreen configuration can exist.'));
        }
    }
    next();
});

export const DeliveryWelcomeScreen = mongoose.model('DeliveryWelcomeScreen', deliveryWelcomeScreenSchema);

