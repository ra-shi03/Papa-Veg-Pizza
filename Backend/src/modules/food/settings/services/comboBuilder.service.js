import { ComboPage } from '../models/comboPage.model.js';
import { Product } from '../../admin/models/product.model.js';

const getOrCreate = async () => (await ComboPage.findOne()) || ComboPage.create({});

/**
 * The pizzas a customer can pick in the Combo Builder, priced for the configured size with the combo discount applied.
 * One place for this: the builder page shows these prices, and checkout re-prices a builder combo with the same function,
 * so the price on the screen and the price charged can never differ.
 */
export async function loadComboBuilderOptions() {
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

    return { config, options };
}
