import mongoose from 'mongoose';

const welcomeScreenSchema = new mongoose.Schema({
    logoUrl: { type: String, default: '' },
    heroMediaUrl: { type: String, default: '' },
    heroMediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    heading: { type: String, default: 'WELCOME TO' },
    subheading: { type: String, default: 'Papa Veg Pizza' },
    description: { type: String, default: 'Indulge in a symphony of flavors! Experience the magic of our artisanal pizzas, handcrafted with passion and the freshest ingredients.' },
    primaryButtonText: { type: String, default: 'SIGN IN TO UNLOCK OFFERS' },
    secondaryButtonText: { type: String, default: 'Continue as Guest' },
}, { timestamps: true });

// Ensure only one settings document exists
welcomeScreenSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            return next(new Error('Only one WelcomeScreen configuration can exist.'));
        }
    }
    next();
});

export const WelcomeScreen = mongoose.model('WelcomeScreen', welcomeScreenSchema);
