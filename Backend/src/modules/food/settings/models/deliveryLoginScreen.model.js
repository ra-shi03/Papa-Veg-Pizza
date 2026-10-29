import mongoose from 'mongoose';

const deliveryLoginScreenSchema = new mongoose.Schema({
    companyName: { type: String, default: 'Papa Veg Pizza' },
    partnerBadgeText: { type: String, default: 'DELIVERY PARTNER' },
    loginTitle: { type: String, default: 'PARTNER SIGN IN' },
    loginSubtitle: { type: String, default: 'Enter your mobile number to log in or register' },
    phoneLabel: { type: String, default: 'Mobile Number' },
    phonePlaceholder: { type: String, default: '00000 00000' },
    buttonText: { type: String, default: 'Continue Delivery' },
    riderBadgeImageUrl: { type: String, default: '/MapRider.png' },
    cornerPlateImageUrl: { type: String, default: '/hero-pizza.png' },
    termsText: { type: String, default: 'By continuing, you agree to' },
    termsLinkText: { type: String, default: 'Terms of Service' },
    privacyLinkText: { type: String, default: 'Privacy Policy' },
    badge1Text: { type: String, default: 'Safe & Secure' },
    badge2Text: { type: String, default: 'Earning Opportunities' },
    supportButtonText: { type: String, default: 'Support' },
    backButtonText: { type: String, default: 'Welcome' },
    primaryColor: { type: String, default: '#EE3A43' },
    secondaryColor: { type: String, default: '#FF5722' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure only one settings document exists
deliveryLoginScreenSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            return next(new Error('Only one DeliveryLoginScreen configuration can exist.'));
        }
    }
    next();
});

export const DeliveryLoginScreen = mongoose.model('DeliveryLoginScreen', deliveryLoginScreenSchema);

