import mongoose from 'mongoose';

const popularSearchItemSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    searchQuery: { type: String, trim: true }
});

const searchByItemSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    image: { type: String, default: '', trim: true },
    query: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

const searchByTabSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    key: { type: String, trim: true },
    addonTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'AddonType' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    items: [searchByItemSchema]
});

const newLaunchItemSchema = new mongoose.Schema({
    title: { type: String, default: '', trim: true },
    subtitle: { type: String, default: '', trim: true },
    image: { type: String, required: true, trim: true },
    badge: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    searchQuery: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
});

const searchPageConfigSchema = new mongoose.Schema(
    {
        popularSearches: [popularSearchItemSchema],
        searchByTabs: [searchByTabSchema],
        newLaunches: [newLaunchItemSchema],
        isPopularEnabled: { type: Boolean, default: true },
        isSearchByEnabled: { type: Boolean, default: true },
        isRecentlyViewedEnabled: { type: Boolean, default: true },
        isNewLaunchesEnabled: { type: Boolean, default: true }
    },
    {
        collection: 'food_search_page_settings',
        timestamps: true
    }
);

// Ensure single configuration document
searchPageConfigSchema.pre('save', async function (next) {
    if (this.isNew) {
        const count = await this.constructor.countDocuments();
        if (count > 0) {
            return next(new Error('Only one SearchPage configuration can exist.'));
        }
    }
    next();
});

export const SearchPageConfig = mongoose.model('SearchPageConfig', searchPageConfigSchema);

