import mongoose from 'mongoose';
import { ComboPage } from '../models/comboPage.model.js';
import { Product } from '../../admin/models/product.model.js';
import { sendResponse } from '../../../../utils/response.js';

const TEXT_FIELDS = [
    'topBannerUrl', 'bottomBannerUrl', 'sectionTitle', 'sectionSubtitle', 'buttonText',
    'offerName', 'sizeName', 'loadingTitle', 'loadingSubtitle', 'includesTitle',
    'changeNotice', 'exploreText', 'pickerTitle', 'addButtonText'
];
const ID_LIST_FIELDS = ['eligibleCategoryIds', 'eligibleProductIds', 'defaultProductIds'];

const getOrCreate = async () => (await ComboPage.findOne()) || ComboPage.create({});

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

export const getComboPageConfig = async (req, res, next) => {
    try {
        const config = await getOrCreate();
        return sendResponse(res, 200, 'Combo page configuration retrieved', config);
    } catch (error) {
        next(error);
    }
};

export const updateComboPageConfig = async (req, res, next) => {
    try {
        const config = await getOrCreate();
        const body = req.body || {};
        TEXT_FIELDS.forEach((key) => {
            if (body[key] !== undefined) config[key] = String(body[key]);
        });
        ID_LIST_FIELDS.forEach((key) => {
            if (Array.isArray(body[key])) {
                config[key] = body[key].filter((id) => mongoose.Types.ObjectId.isValid(id));
            }
        });
        ['isActive', 'showVegFilter', 'showNonVegFilter', 'showSort'].forEach((key) => {
            if (body[key] !== undefined) config[key] = Boolean(body[key]);
        });
        if (body.slotCount !== undefined) config.slotCount = clamp(body.slotCount, 1, 6);
        if (body.loadingSeconds !== undefined) config.loadingSeconds = clamp(body.loadingSeconds, 1, 10);
        if (Array.isArray(body.productDiscounts)) {
            config.productDiscounts = body.productDiscounts
                .filter((d) => mongoose.Types.ObjectId.isValid(d?.productId) && Number(d.discountValue) > 0)
                .map((d) => ({
                    productId: d.productId,
                    discountType: d.discountType === 'percentage' ? 'percentage' : 'flat',
                    discountValue: Number(d.discountValue)
                }));
        }
        if (body.discountType !== undefined) config.discountType = body.discountType === 'percentage' ? 'percentage' : 'flat';
        if (body.discountValue !== undefined) config.discountValue = Math.max(0, Number(body.discountValue) || 0);
        await config.save();
        return sendResponse(res, 200, 'Combo page configuration updated successfully', config);
    } catch (error) {
        next(error);
    }
};

// Eligible pizzas for the builder, priced for the configured size.
export const getComboBuilderData = async (req, res, next) => {
    try {
        const config = await getOrCreate();
        const sizeName = String(config.sizeName || '').trim().toLowerCase();

        const filter = { status: { $regex: /^active$/i }, inStock: { $ne: false } };
        if (config.eligibleProductIds.length > 0) {
            filter._id = { $in: config.eligibleProductIds };
        } else if (config.eligibleCategoryIds.length > 0) {
            filter.categoryId = { $in: config.eligibleCategoryIds };
        }

        const products = await Product.find(filter).sort({ name: 1 }).lean();

        const rules = new Map(config.productDiscounts.map((d) => [String(d.productId), d]));
        const resolveDiscount = (productId, price) => {
            const rule = rules.get(String(productId)) || { discountType: config.discountType, discountValue: config.discountValue };
            const value = Number(rule.discountValue) || 0;
            const amount = rule.discountType === 'percentage' ? Math.round((price * value) / 100) : value;
            return Math.min(Math.max(0, amount), price);
        };

        const options = products
            .map((p) => {
                const size = (p.sizes || []).find((s) => String(s.size || '').trim().toLowerCase() === sizeName);
                if (!size) return null;
                const price = Number(size.price) || 0;
                // Menu price is the "was" price; the combo discount is taken off it (Domino's style).
                // With no combo discount, fall back to the product's own markdown.
                const discount = resolveDiscount(p._id, price);
                const markdownOriginal = Math.max(price, Number(size.originalPrice) || price + (Number(size.saveAmount) || 0));
                const originalPrice = discount > 0 ? price : markdownOriginal;
                const finalPrice = Math.max(0, price - discount);
                return {
                    id: String(p._id),
                    name: p.name,
                    image: p.image || '',
                    description: p.shortDescription || p.description || '',
                    vegType: p.vegType || 'veg',
                    crust: p.showCrust === false ? '' : (p.defaultCrust || ''),
                    size: size.size,
                    price,
                    finalPrice,
                    originalPrice,
                    saveAmount: Math.max(0, originalPrice - finalPrice)
                };
            })
            .filter(Boolean);

        const maxSaving = options.reduce((max, o) => Math.max(max, o.saveAmount), 0);

        // One default product per slot: configured defaults first, then the first eligible pizza.
        const byId = new Map(options.map((o) => [o.id, o]));
        const configured = config.defaultProductIds.map(String).filter((id) => byId.has(id));
        const fallback = options[0]?.id;
        const defaults = Array.from({ length: config.slotCount }, (_, i) => configured[i] || configured[0] || fallback).filter(Boolean);

        return sendResponse(res, 200, 'Combo builder data retrieved', {
            config: {
                bannerUrl: config.bottomBannerUrl,
                isActive: config.isActive,
                offerName: config.offerName,
                slotCount: config.slotCount,
                sizeName: config.sizeName,
                maxSaving,
                loadingSeconds: config.loadingSeconds,
                loadingTitle: config.loadingTitle,
                loadingSubtitle: config.loadingSubtitle,
                includesTitle: config.includesTitle,
                changeNotice: config.changeNotice,
                exploreText: config.exploreText,
                pickerTitle: config.pickerTitle,
                addButtonText: config.addButtonText,
                showVegFilter: config.showVegFilter,
                showNonVegFilter: config.showNonVegFilter,
                showSort: config.showSort
            },
            options,
            defaults
        });
    } catch (error) {
        next(error);
    }
};
