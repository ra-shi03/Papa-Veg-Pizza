import { FoodHeroBanner } from '../models/heroBanner.model.js';
import { validateHeroBannerDto, validateHeroBannerKey } from '../validators/heroBanner.validator.js';
import { sendResponse } from '../../../../utils/response.js';

const TTL_MS = 60 * 1000;
const cache = new Map(); // key -> { at, data }
export const resetHeroBannerCache = () => cache.clear();

const adminView = (doc, key) => ({
    key, imageUrl: doc?.imageUrl || '', title: doc?.title || '', link: doc?.link || '', isActive: doc ? doc.isActive !== false : false,
    updatedAt: doc?.updatedAt || null, updatedByName: doc?.updatedByName || '',
});

/** GET /settings/hero-banners/:key/public : what the customer screen shows. Display fields only; null when there is no active banner. */
export const getPublicHeroBanner = async (req, res, next) => {
    try {
        const key = validateHeroBannerKey(req.params.key);
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < TTL_MS) return sendResponse(res, 200, 'Banner', hit.data);
        const doc = await FoodHeroBanner.findOne({ key }).lean();
        const data = doc && doc.isActive !== false && doc.imageUrl ? { imageUrl: doc.imageUrl, title: doc.title || '', link: doc.link || '' } : null;
        cache.set(key, { at: Date.now(), data });
        return sendResponse(res, 200, 'Banner', data);
    } catch (err) {
        next(err);
    }
};

/** GET /settings/hero-banners/:key (super admin): the saved banner for the form. */
export const getHeroBannerAdmin = async (req, res, next) => {
    try {
        const key = validateHeroBannerKey(req.params.key);
        return sendResponse(res, 200, 'Banner', adminView(await FoodHeroBanner.findOne({ key }).lean(), key));
    } catch (err) {
        next(err);
    }
};

/** PUT /settings/hero-banners/:key (super admin): saves the banner. */
export const saveHeroBanner = async (req, res, next) => {
    try {
        const key = validateHeroBannerKey(req.params.key);
        const dto = validateHeroBannerDto(req.body);
        const doc = await FoodHeroBanner.findOneAndUpdate(
            { key },
            { $set: { ...dto, updatedByName: String(req.user?.name || req.user?.email || 'super admin').slice(0, 100) }, $setOnInsert: { key } },
            { upsert: true, new: true, runValidators: true },
        ).lean();
        resetHeroBannerCache();
        return sendResponse(res, 200, 'Banner saved', adminView(doc, key));
    } catch (err) {
        next(err);
    }
};
