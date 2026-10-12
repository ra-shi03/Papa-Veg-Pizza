import mongoose from 'mongoose';

const promiseItemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    iconUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const promiseTabSchema = new mongoose.Schema({
    id: { type: String, required: true }, // e.g. 'lowest-pricing', 'highest-quality'
    name: { type: String, required: true }, // e.g. 'LOWEST PRICING', 'HIGHEST QUALITY'
    badgeText: { type: String, default: '' }, // e.g. 'Only on the Papa Veg Pizza App!'
    badgeSubtext: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    items: [promiseItemSchema]
}, { _id: false });

const promiseTickerSchema = new mongoose.Schema({
    id: { type: String, required: true },
    heading: { type: String, required: true },
    tagline: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const promiseCampaignSchema = new mongoose.Schema({
    header: {
        title: { type: String, default: 'Papa Veg Promise' },
        subtitle: { type: String, default: 'Where quality food meets honest prices!' },
        tagline: { type: String, default: '100% Pure Vegetarian Delight' },
        stars: { type: String, default: '★★' },
        orderButtonText: { type: String, default: 'Order Now' }
    },
    tickerItems: [promiseTickerSchema],
    tabs: [promiseTabSchema],
    isActive: { type: Boolean, default: true }
}, { 
    collection: 'food_promise_campaigns',
    timestamps: true 
});

export const PromiseCampaign = mongoose.model('PromiseCampaign', promiseCampaignSchema);

