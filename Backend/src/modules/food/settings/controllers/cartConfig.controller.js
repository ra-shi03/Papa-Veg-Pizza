import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { CartConfig } from '../models/cartConfig.model.js';
import { Product } from '../../admin/models/product.model.js';
import { Addon } from '../../admin/models/addon.model.js';
import { FoodOrder } from '../../orders/models/order.model.js';
import { verifyAccessToken } from '../../../../core/auth/token.util.js';
import { config as envConfig } from '../../../../config/env.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

const CANCELLED_STATUSES = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const HISTORY_ORDER_LIMIT = 1500;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const toIdList = (list) => (Array.isArray(list) ? list.filter(isValidId).map(String) : []);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

const getOrCreate = async () => (await CartConfig.findOne()) || CartConfig.create({});

const normalizeAddonType = (raw = '') => {
    const t = String(raw || '').trim().toLowerCase();
    if (t.includes('crust')) return 'crust';
    if (t.includes('cheese')) return 'cheese';
    if (t.includes('dip') || t.includes('sauce')) return 'dip';
    if (t.includes('topping')) return 'topping';
    if (t.includes('burst')) return 'burst';
    return t || 'other';
};

const addonPrice = (addon, sizeName = '') => {
    const prices = Array.isArray(addon.prices) ? addon.prices : [];
    const wanted = String(sizeName || '').trim().toLowerCase();
    const match =
        prices.find((p) => wanted && String(p.size).toLowerCase() === wanted) ||
        prices.find((p) => /^default$/i.test(p.size)) ||
        prices.find((p) => /^regular$/i.test(p.size)) ||
        prices[0];
    return Number(match?.price) || 0;
};

const productEntry = (product, sizeName = '') => {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const wanted = String(sizeName || '').trim().toLowerCase();
    const size = (wanted && sizes.find((s) => String(s.size).toLowerCase() === wanted)) ||
        [...sizes].sort((a, b) => a.price - b.price)[0];
    const price = Number(size?.price ?? product.price) || 0;
    const originalPrice = Number(size?.originalPrice ?? product.originalPrice) || 0;
    return {
        id: String(product._id),
        kind: 'product',
        name: product.name,
        image: product.image || '',
        price,
        originalPrice: originalPrice > price ? originalPrice : 0,
        size: size?.size || '',
        isVeg: product.vegType !== 'non-veg',
        group: product.categoryId?.label || product.categoryId?.name || 'Menu',
        groupId: String(product.categoryId?._id || product.categoryId || '')
    };
};

const addonEntry = (addon) => {
    const type = normalizeAddonType(addon.type);
    return {
        id: String(addon._id),
        kind: type === 'topping' ? 'topping' : 'addon',
        name: addon.name,
        image: addon.image || '',
        price: addonPrice(addon),
        originalPrice: 0,
        size: '',
        isVeg: true,
        group: addon.type || 'Add-ons',
        groupId: type
    };
};

// Resolves the configured limited-time-offer item so clients never need to look it up.
const resolveOfferItem = async (offer) => {
    if (!offer?.enabled) return null;
    let entry = null;
    if (offer.itemType === 'product' && offer.productId) {
        const product = await Product.findById(offer.productId).populate('categoryId', 'label name').lean();
        if (product && /^active$/i.test(product.status)) entry = productEntry(product, offer.sizeName);
    } else if (offer.itemType === 'addon' && offer.addonId) {
        const addon = await Addon.findById(offer.addonId).lean();
        if (addon && addon.status !== 'Inactive') entry = addonEntry(addon);
    }
    if (!entry) return null;
    return {
        ...entry,
        originalPrice: entry.originalPrice || entry.price,
        price: Number(offer.offerPrice) || 0
    };
};

const publicShape = async (cfg) => {
    const plain = cfg.toObject ? cfg.toObject() : cfg;
    return { ...plain, offerItem: await resolveOfferItem(plain.offer) };
};

export const getCartConfig = async (req, res, next) => {
    try {
        return sendResponse(res, 200, 'Cart configuration retrieved', await publicShape(await getOrCreate()));
    } catch (error) {
        next(error);
    }
};

export const updateCartConfig = async (req, res, next) => {
    try {
        const cfg = await getOrCreate();
        const body = req.body || {};

        const { bottomBar, upsell, offer } = body;
        if (bottomBar && typeof bottomBar === 'object') {
            ['enabled', 'showUpsell'].forEach((k) => {
                if (bottomBar[k] !== undefined) cfg.bottomBar[k] = Boolean(bottomBar[k]);
            });
            ['ctaText', 'freeDeliveryText'].forEach((k) => {
                if (bottomBar[k] !== undefined) cfg.bottomBar[k] = String(bottomBar[k]);
            });
        }

        if (upsell && typeof upsell === 'object') {
            ['enabled', 'includeProducts', 'includeAddons', 'includeToppings', 'hideItemsInCart',
                'showCategoryChips', 'frequentlyBoughtEnabled'].forEach((k) => {
                if (upsell[k] !== undefined) cfg.upsell[k] = Boolean(upsell[k]);
            });
            ['title', 'cartTitle'].forEach((k) => {
                if (upsell[k] !== undefined) cfg.upsell[k] = String(upsell[k]);
            });
            ['productCategoryIds', 'pinnedProductIds', 'pinnedAddonIds', 'excludeProductIds', 'excludeAddonIds'].forEach((k) => {
                if (Array.isArray(upsell[k])) cfg.upsell[k] = toIdList(upsell[k]);
            });
            if (Array.isArray(upsell.addonTypes)) {
                cfg.upsell.addonTypes = upsell.addonTypes.map((t) => String(t).trim()).filter(Boolean);
            }
            if (upsell.mode !== undefined) cfg.upsell.mode = upsell.mode === 'manual' ? 'manual' : 'auto';
            if (upsell.maxItems !== undefined) cfg.upsell.maxItems = clamp(upsell.maxItems, 1, 30);
            if (upsell.minPastOrders !== undefined) cfg.upsell.minPastOrders = clamp(upsell.minPastOrders, 1, 50);
        }

        if (offer && typeof offer === 'object') {
            if (offer.enabled !== undefined) cfg.offer.enabled = Boolean(offer.enabled);
            ['sliderText', 'modalTitle', 'buttonText', 'sizeName'].forEach((k) => {
                if (offer[k] !== undefined) cfg.offer[k] = String(offer[k]);
            });
            if (offer.itemType !== undefined) cfg.offer.itemType = offer.itemType === 'product' ? 'product' : 'addon';
            if (offer.productId !== undefined) cfg.offer.productId = isValidId(offer.productId) ? offer.productId : null;
            if (offer.addonId !== undefined) cfg.offer.addonId = isValidId(offer.addonId) ? offer.addonId : null;
            if (offer.offerPrice !== undefined) cfg.offer.offerPrice = Math.max(0, Number(offer.offerPrice) || 0);
            if (offer.expiryMinutes !== undefined) cfg.offer.expiryMinutes = clamp(offer.expiryMinutes, 1, 240);
            if (offer.minCartValue !== undefined) cfg.offer.minCartValue = Math.max(0, Number(offer.minCartValue) || 0);
        }

        await cfg.save();
        return sendResponse(res, 200, 'Cart configuration updated successfully', await publicShape(cfg));
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------------------------
// Suggestions: "Complete your order"
// ---------------------------------------------------------------------------------------------

const optionalUserId = (req) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    try {
        const decoded = verifyAccessToken(header.substring(7));
        const role = String(decoded.role || '').toUpperCase();
        return role === 'USER' && isValidId(decoded.userId) ? decoded.userId : null;
    } catch {
        return null;
    }
};

const loadCandidates = async (up) => {
    const exclude = {
        products: new Set(toIdList(up.excludeProductIds)),
        addons: new Set(toIdList(up.excludeAddonIds))
    };
    const candidates = [];

    if (up.includeProducts) {
        const filter = { status: { $regex: /^active$/i }, inStock: { $ne: false } };
        if (up.productCategoryIds?.length) filter.categoryId = { $in: up.productCategoryIds };
        const products = await Product.find(filter).populate('categoryId', 'label name').lean();
        products.forEach((p) => {
            if (!exclude.products.has(String(p._id))) candidates.push(productEntry(p));
        });
    }

    if (up.includeAddons || up.includeToppings) {
        const wantedTypes = new Set((up.addonTypes || []).map(normalizeAddonType));
        const addons = await Addon.find({ status: { $ne: 'Inactive' } }).lean();
        addons.forEach((a) => {
            if (exclude.addons.has(String(a._id))) return;
            const type = normalizeAddonType(a.type);
            if (type === 'crust') return; // crusts are a pizza option, not a standalone add-on
            if (type === 'topping' ? !up.includeToppings : !up.includeAddons) return;
            if (wantedTypes.size && !wantedTypes.has(type)) return;
            candidates.push(addonEntry(a));
        });
    }
    return candidates;
};

// Manual mode: exactly the items the superadmin picked, in the order they picked them.
const loadHandPicked = async (up) => {
    const productIds = toIdList(up.pinnedProductIds);
    const addonIds = toIdList(up.pinnedAddonIds);
    const [products, addons] = await Promise.all([
        productIds.length
            ? Product.find({ _id: { $in: productIds }, status: { $regex: /^active$/i }, inStock: { $ne: false } })
                .populate('categoryId', 'label name').lean()
            : [],
        addonIds.length ? Addon.find({ _id: { $in: addonIds }, status: { $ne: 'Inactive' } }).lean() : []
    ]);
    const entries = [...products.map((p) => productEntry(p)), ...addons.map(addonEntry)];
    const order = new Map([...productIds, ...addonIds].map((id, i) => [id, i]));
    return entries.sort((a, b) => order.get(a.id) - order.get(b.id));
};

// itemId -> score, built from past orders ("frequently bought together").
const buildHistoryScores = async (userId, cartIds) => {
    const scores = new Map();
    const add = (rows, weight) => rows.forEach((r) => scores.set(r._id, (scores.get(r._id) || 0) + r.n * weight));
    const live = { orderStatus: { $nin: CANCELLED_STATUSES } };

    if (cartIds.length) {
        const together = await FoodOrder.aggregate([
            { $match: { ...live, 'items.itemId': { $in: cartIds } } },
            { $sort: { createdAt: -1 } },
            { $limit: HISTORY_ORDER_LIMIT },
            { $unwind: '$items' },
            { $match: { 'items.itemId': { $nin: cartIds } } },
            { $group: { _id: '$items.itemId', n: { $sum: 1 } } }
        ]);
        add(together, 3);
    }

    const own = await FoodOrder.aggregate([
        { $match: { ...live, userId: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
        { $unwind: '$items' },
        { $group: { _id: '$items.itemId', n: { $sum: '$items.quantity' } } }
    ]);
    add(own, 2);
    return scores;
};

// Spreads the list across groups so one category cannot fill every slot.
const interleaveByGroup = (list) => {
    const buckets = new Map();
    list.forEach((item) => {
        if (!buckets.has(item.group)) buckets.set(item.group, []);
        buckets.get(item.group).push(item);
    });
    const queues = [...buckets.values()];
    const out = [];
    while (queues.some((q) => q.length)) {
        queues.forEach((q) => q.length && out.push(q.shift()));
    }
    return out;
};

export const getCartSuggestions = async (req, res, next) => {
    try {
        const cfg = await getOrCreate();
        const up = cfg.upsell;
        if (!up.enabled) return sendResponse(res, 200, 'Suggestions disabled', { enabled: false, items: [], groups: [] });

        const cartIds = toIdList(req.body?.cartItemIds);
        const limit = clamp(req.body?.limit || up.maxItems, 1, 30);

        const manual = up.mode === 'manual';
        let candidates = manual ? await loadHandPicked(up) : await loadCandidates(up);
        if (up.hideItemsInCart) {
            const inCart = new Set(cartIds);
            candidates = candidates.filter((c) => !inCart.has(c.id));
        }

        const userId = manual ? null : optionalUserId(req);
        let strategy = manual ? 'manual' : 'default';
        let scores = new Map();
        if (userId && up.frequentlyBoughtEnabled) {
            const pastOrders = await FoodOrder.countDocuments({
                userId, orderStatus: { $nin: CANCELLED_STATUSES }
            });
            if (pastOrders >= up.minPastOrders) {
                scores = await buildHistoryScores(userId, cartIds);
                strategy = 'frequently_bought';
            }
        }

        const pinned = new Map();
        [...(up.pinnedProductIds || []), ...(up.pinnedAddonIds || [])].forEach((id, i) => pinned.set(String(id), i));

        if (manual) {
            const items = candidates.slice(0, limit);
            return sendResponse(res, 200, 'Suggestions retrieved', {
                enabled: true,
                strategy,
                title: up.title,
                cartTitle: up.cartTitle,
                showCategoryChips: up.showCategoryChips,
                items,
                groups: [...new Set(items.map((i) => i.group))]
            });
        }

        const ranked = candidates.filter((c) => scores.has(c.id)).sort((a, b) => scores.get(b.id) - scores.get(a.id));
        const pinnedItems = candidates.filter((c) => pinned.has(c.id) && !scores.has(c.id))
            .sort((a, b) => pinned.get(a.id) - pinned.get(b.id));
        const rest = interleaveByGroup(
            candidates.filter((c) => !scores.has(c.id) && !pinned.has(c.id)).sort((a, b) => a.price - b.price)
        );

        // New customers: admin-pinned items first. Returning customers: their history first, pins fill the gaps.
        const ordered = strategy === 'frequently_bought'
            ? [...ranked, ...pinnedItems, ...rest]
            : [...pinnedItems, ...rest];
        const items = ordered.slice(0, limit);
        const groups = [...new Set(items.map((i) => i.group))];

        return sendResponse(res, 200, 'Suggestions retrieved', {
            enabled: true,
            strategy,
            title: up.title,
            cartTitle: up.cartTitle,
            showCategoryChips: up.showCategoryChips,
            items,
            groups
        });
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------------------------------
// Limited time offer
// ---------------------------------------------------------------------------------------------

const OFFER_TOKEN_AUDIENCE = 'cart-offer';

export const claimCartOffer = async (req, res, next) => {
    try {
        const cfg = await getOrCreate();
        const offerItem = await resolveOfferItem(cfg.offer);
        if (!offerItem) return sendError(res, 404, 'No limited time offer is available right now');

        const cartTotal = Number(req.body?.cartTotal) || 0;
        if (cartTotal < cfg.offer.minCartValue) {
            return sendError(res, 400, `Add items worth ₹${cfg.offer.minCartValue} to unlock this offer`);
        }

        const expiresAt = Date.now() + cfg.offer.expiryMinutes * 60 * 1000;
        const token = jwt.sign(
            { itemId: offerItem.id, price: offerItem.price },
            envConfig.jwtAccessSecret,
            { audience: OFFER_TOKEN_AUDIENCE, expiresIn: `${cfg.offer.expiryMinutes}m` }
        );

        return sendResponse(res, 200, 'Offer unlocked', {
            token,
            expiresAt,
            expiryMinutes: cfg.offer.expiryMinutes,
            title: cfg.offer.modalTitle,
            buttonText: cfg.offer.buttonText,
            item: offerItem
        });
    } catch (error) {
        next(error);
    }
};

// Used by order creation: returns the trusted offer price for an item, or null if the claim is invalid/expired.
export const verifyOfferClaim = (token, itemId) => {
    try {
        const decoded = jwt.verify(token, envConfig.jwtAccessSecret, { audience: OFFER_TOKEN_AUDIENCE });
        return String(decoded.itemId) === String(itemId) ? Number(decoded.price) : null;
    } catch {
        return null;
    }
};
