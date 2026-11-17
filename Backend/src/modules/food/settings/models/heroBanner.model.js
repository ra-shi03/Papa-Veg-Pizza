import mongoose from 'mongoose';

// A hero banner a customer screen shows at the top (today: the Under 250 page). One document per placement key.
export const HERO_BANNER_KEYS = ['under-250'];

const heroBannerSchema = new mongoose.Schema(
    {
        key: { type: String, enum: HERO_BANNER_KEYS, required: true, unique: true },
        imageUrl: { type: String, default: '', trim: true },
        title: { type: String, default: '', trim: true },
        link: { type: String, default: '', trim: true },
        isActive: { type: Boolean, default: true },
        updatedByName: { type: String, default: '', trim: true },
    },
    { collection: 'food_hero_banners', timestamps: true }
);

export const FoodHeroBanner = mongoose.models.FoodHeroBanner || mongoose.model('FoodHeroBanner', heroBannerSchema);
