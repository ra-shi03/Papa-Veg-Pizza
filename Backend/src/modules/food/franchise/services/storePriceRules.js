// How a store's price rule (StoreProductPrice) maps onto a catalogue product. Shared by the Store Pricing screens
// and the server-side order pricing (orders/services/catalog-pricing.service.js).
//
// The screens edit small / medium / large prices; a product has its own size list. Each slot takes the size whose
// name says so (Small/Regular/Personal, Medium, Large), else by price: cheapest = small, dearest = large, the one
// in between = medium (with two sizes, medium is the cheaper one). A product without sizes is priced by medium.

export const PRICE_KEYS = ['smallPrice', 'mediumPrice', 'largePrice', 'deliveryPrice', 'takeawayPrice', 'dineInPrice', 'specialPrice'];
export const RULE_KEYS = [...PRICE_KEYS, 'startDate', 'endDate', 'availability', 'status'];
const SLOT_KEYS = ['smallPrice', 'mediumPrice', 'largePrice', 'deliveryPrice', 'takeawayPrice', 'dineInPrice'];

const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const pad = (n) => String(n).padStart(2, '0');
export const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** { small, medium, large } -> { size, price } from the product's catalogue sizes. */
export function sizeSlots(product) {
  const sizes = (Array.isArray(product?.sizes) ? product.sizes : []).filter((s) => s && s.size).sort((a, b) => a.price - b.price);
  if (!sizes.length) {
    const only = { size: '', price: Number(product?.price) || 0 };
    return { small: only, medium: only, large: only };
  }
  const named = (rx) => sizes.find((s) => rx.test(s.size));
  const small = named(/small|regular|personal|mini/i) || sizes[0];
  const large = named(/large/i) || sizes[sizes.length - 1];
  const medium = named(/medium/i) || sizes.find((s) => s !== small && s !== large) || small;
  const out = (s) => ({ size: s.size, price: Number(s.price) || 0 });
  return { small: out(small), medium: out(medium), large: out(large) };
}

/** The rule a product has at a store without an override: the catalogue prices. */
export function catalogRule(product) {
  const s = sizeSlots(product);
  return {
    smallPrice: s.small.price, mediumPrice: s.medium.price, largePrice: s.large.price,
    deliveryPrice: s.medium.price, takeawayPrice: s.medium.price, dineInPrice: s.medium.price, specialPrice: 0,
    startDate: '', endDate: '', availability: 'AVAILABLE', status: 'ACTIVE',
  };
}

export const pickRule = (r) => Object.fromEntries(RULE_KEYS.map((k) => [k, r?.[k] ?? (PRICE_KEYS.includes(k) ? 0 : '')]));
export const sameRule = (a, b) => RULE_KEYS.every((k) => String(a?.[k] ?? '') === String(b?.[k] ?? ''));
/** Does the rule charge something other than the catalogue? */
export const isCustomPrice = (rule, product) => {
  const base = catalogRule(product);
  return !!rule && SLOT_KEYS.some((k) => Number(rule[k]) !== base[k]);
};

const promoRunning = (rule, day) => rule.availability === 'PROMOTION ACTIVE' && Number(rule.specialPrice) > 0
  && (!rule.startDate || rule.startDate <= day) && (!rule.endDate || day <= rule.endDate);

/**
 * What the store charges for one unit of this product in this size (before add-ons):
 *   null                       -> no active rule, the catalogue price applies
 *   { available: false }       -> the store does not sell it
 *   { available: true, price } -> the store's price
 */
export function storeUnitPrice(rule, product, sizeName = '', day = today()) {
  if (!rule || rule.status !== 'ACTIVE') return null;
  if (rule.availability === 'UNAVAILABLE') return { available: false };
  const slots = sizeSlots(product);
  const mine = ['medium', 'small', 'large'].filter((k) => same(slots[k].size, sizeName));
  if (!mine.length) return null;
  if (promoRunning(rule, day) && mine.includes('medium')) return { available: true, price: Number(rule.specialPrice) };
  // a size that fills two slots (two-size products) takes the one the admin changed
  const changed = mine.find((k) => Number(rule[`${k}Price`]) > 0 && Number(rule[`${k}Price`]) !== slots[k].price);
  const price = Number(rule[`${changed || mine[0]}Price`]);
  return price > 0 ? { available: true, price } : null;
}
