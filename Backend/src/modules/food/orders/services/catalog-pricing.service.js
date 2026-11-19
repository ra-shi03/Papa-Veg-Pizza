import mongoose from 'mongoose';
import { Product } from '../../admin/models/product.model.js';
import { Addon } from '../../admin/models/addon.model.js';
import { FoodCombo } from '../../admin/models/combo.model.js';
import { loadComboBuilderOptions } from '../../settings/services/comboBuilder.service.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { addonPrice, getOfferMinCartValue, verifyOfferClaim } from '../../settings/controllers/cartConfig.controller.js';
import { StoreProductPrice } from '../../franchise/models/storeProductPrice.model.js';
import { storeUnitPrice } from '../../franchise/services/storePriceRules.js';

// The user app adds a flat amount for "extra cheese" (MenuList.jsx calculateTotalPrice); it is not a catalogue item.
const EXTRA_CHEESE_PRICE = 65;

const round2 = (n) => Math.round(n * 100) / 100;
const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const typeOf = (addon) => String(addon.type || '').toLowerCase();

const unavailable = (item) => new ValidationError(`"${item.name || item.itemId}" is no longer available. Please remove it from your cart.`);

// Same rule the menu uses when a customer ticks an add-on: the default crust is free, otherwise the price for the
// chosen size, falling back to the first listed price.
const addonPriceForSize = (addon, sizeName, defaultCrust) => {
  if (addon.isDefault || same(addon.name, defaultCrust) || String(addon.name || '').toLowerCase().includes('hand tossed')) return 0;
  const prices = Array.isArray(addon.prices) ? addon.prices : [];
  const match = prices.find((p) => same(p.size, sizeName)) || prices[0];
  return Number(match?.price) || 0;
};

async function priceProductLine(item, addons, storeRules) {
  const product = mongoose.isValidObjectId(item.itemId) ? await Product.findById(item.itemId).lean() : null;
  if (!product || !/^active$/i.test(product.status || '')) return null;
  const rule = storeRules?.get(String(product._id));

  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  let base = Number(product.price) || 0;
  let sizeName = '';
  if (sizes.length > 0) {
    // No size sent means the menu's default: the cheapest one. A size that is not on the product is a bad cart.
    const size = item.size
      ? sizes.find((s) => same(s.size, item.size))
      : [...sizes].sort((a, b) => a.price - b.price)[0];
    if (!size) throw new ValidationError(`"${item.name}" is not sold in size "${item.size}".`);
    base = Number(size.price) || 0;
    sizeName = size.size;
  }
  // The store's own price (Store Pricing) replaces the catalogue price; add-ons keep their catalogue prices.
  const storePrice = storeUnitPrice(rule, product, sizeName);
  if (storePrice?.available === false) throw unavailable(item);
  if (storePrice) base = storePrice.price;

  let unit = base;
  const selectedAddons = [];
  const take = (addon, price) => {
    unit += price;
    selectedAddons.push({ id: String(addon._id), name: addon.name, type: addon.type || '', price });
  };
  // Only what the super admin assigned to this product can be picked (the menu offers nothing else). Crusts
  // follow the menu's order: the product's own crusts, else its assigned crust-type add-ons, else every crust.
  const idsOf = (list) => new Set((list || []).map(String));
  const assigned = idsOf(product.toppings);
  const assignedAddons = addons.filter((a) => assigned.has(String(a._id)));
  const ownCrusts = idsOf(product.crusts);
  const crustPool = ownCrusts.size > 0
    ? addons.filter((a) => ownCrusts.has(String(a._id)))
    : assignedAddons.some((a) => typeOf(a).includes('crust'))
      ? assignedAddons.filter((a) => typeOf(a).includes('crust'))
      : addons.filter((a) => typeOf(a).includes('crust'));
  const find = (name, test) => (test('crust') ? crustPool : assignedAddons).find((a) => same(a.name, name) && test(typeOf(a)));
  const choose = (name, test, label) => {
    const addon = find(name, test);
    if (!addon) throw new ValidationError(`${label} "${name}" is not available for "${item.name}".`);
    return addon;
  };

  let crust = '';
  if (item.crust) {
    const defaultCrust = product.defaultCrust || 'New Hand Tossed';
    const addon = find(item.crust, (t) => t.includes('crust'));
    if (addon) {
      crust = addon.name;
      const price = addonPriceForSize(addon, sizeName, defaultCrust);
      if (price > 0) take(addon, price);
    } else if (same(item.crust, defaultCrust)) {
      crust = defaultCrust;
    } else {
      throw new ValidationError(`Crust "${item.crust}" is not available for "${item.name}".`);
    }
  }
  for (const name of new Set(item.toppings || [])) {
    const addon = choose(name, (t) => t.includes('topping'), 'Topping');
    take(addon, addonPriceForSize(addon, sizeName));
  }
  for (const name of new Set(item.meals || [])) {
    const addon = choose(name, (t) => !t.includes('crust') && !t.includes('topping'), 'Extra');
    take(addon, addonPriceForSize(addon, sizeName));
  }
  if (item.extraCheese) {
    unit += EXTRA_CHEESE_PRICE;
    selectedAddons.push({ id: '', name: 'Extra Cheese', type: 'cheese', price: EXTRA_CHEESE_PRICE });
  }

  return { price: round2(unit), size: sizeName, crust, selectedAddons, isVeg: product.vegType !== 'non-veg' };
}

/** One line of text for what is in a combo: "Wow Pizza: Corn Paneer (Regular) + Drink: Coke". Kept as the item's notes. */
export const describeComponents = (components = []) =>
  components
    .map((c) => `${c.label ? `${c.label}: ` : ''}${c.name}${c.size ? ` (${c.size})` : ''}${c.crust ? `, ${c.crust}` : ''}${c.quantity > 1 ? ` x${c.quantity}` : ''}`)
    .join(' + ');

/**
 * A meal combo the super admin made. The price is the combo's own price. What is inside it is rebuilt here from the
 * combo and the customer's choice for each "pick one" slot (the first option when they did not choose), so the kitchen
 * and the packer get the real list, and an unknown choice is refused.
 */
async function priceComboLine(item) {
  const combo = mongoose.isValidObjectId(item.itemId) ? await FoodCombo.findById(item.itemId).lean() : null;
  if (!combo || combo.status !== 'active') return null;
  const wanted = item.comboChoices && typeof item.comboChoices === 'object' ? item.comboChoices : {};
  const components = [];
  for (const slot of combo.items || []) {
    const quantity = Math.max(1, Number(slot.quantity) || 1);
    if ((slot.choices || []).length > 0) {
      const name = wanted[String(slot._id)];
      const pick = name ? slot.choices.find((c) => same(c.name, name)) : slot.choices[0];
      if (!pick) throw new ValidationError(`"${name}" is not available for "${slot.name}" in "${combo.name}".`);
      components.push({ label: slot.name, name: pick.name, size: pick.size || '', crust: '', quantity, kitchen: !!pick.productId, productId: pick.productId ? String(pick.productId) : '', slot: String(slot._id) });
    } else {
      components.push({ label: '', name: slot.name, size: slot.size || '', crust: '', quantity, kitchen: !!slot.productId, productId: slot.productId ? String(slot.productId) : '', slot: '' });
    }
  }
  return {
    price: round2(Number(combo.price) || 0), size: '', crust: '', selectedAddons: [],
    name: combo.name, comboType: 'meal', components, notes: describeComponents(components),
  };
}

/**
 * A combo made in the Combo Builder (the customer picked pizzas). The app sends only which pizzas; the price is the sum
 * of those pizzas at the configured size with the combo discount, taken from the same settings the builder page shows.
 */
async function priceBuilderComboLine(item) {
  const { config, options } = await loadComboBuilderOptions();
  if (!config.isActive) throw new ValidationError('This combo offer is not available right now.');
  const byId = new Map(options.map((o) => [o.id, o]));
  const picks = (item.comboLines || []).map((l) => byId.get(String(l.productId)));
  if (picks.length !== config.slotCount || picks.some((p) => !p)) {
    throw new ValidationError('This combo has changed or is no longer available. Please build it again.');
  }
  const components = picks.map((p) => ({ label: '', name: p.name, size: p.size, crust: p.crust || '', quantity: 1, kitchen: true, productId: p.id, slot: '' }));
  return {
    price: round2(picks.reduce((sum, p) => sum + p.finalPrice, 0)), size: '', crust: '', selectedAddons: [],
    // the same id for the same pizzas, so one id never means two different combos
    itemId: `combo-offer-${picks.map((p) => p.id).join('-')}`,
    name: config.offerName || 'Pizza Combo', comboType: 'builder', components, notes: describeComponents(components),
    isVeg: picks.every((p) => p.vegType !== 'non-veg'),
  };
}

async function priceAddonLine(item) {
  const addon = mongoose.isValidObjectId(item.itemId) ? await Addon.findById(item.itemId).lean() : null;
  if (!addon || addon.status === 'Inactive') return null;
  return { price: round2(addonPrice(addon)), size: '', crust: '', selectedAddons: [] };
}

/**
 * Rebuilds the cart from the catalogue. The client's price, subtotal and total are never read.
 * Limited-time-offer lines take their price from the signed claim (bound to this user, one use each);
 * the offer's minimum is re-checked against the server subtotal of the other lines.
 * With a storeId, that store's price rules (Store Pricing) override the catalogue price of its products.
 * Returns { items, subtotal, offerClaims } where offerClaims must be spent with spendOfferClaims() when the order is saved.
 */
export async function priceCartItems(userId, clientItems, { storeId } = {}) {
  const items = Array.isArray(clientItems) ? clientItems : [];
  const addons = items.some((i) => i.kind !== 'addon' && i.kind !== 'topping' && !i.offerToken)
    ? await Addon.find({ status: { $ne: 'Inactive' } }).lean()
    : [];
  const productIds = items.filter((i) => mongoose.isValidObjectId(i.itemId)).map((i) => String(i.itemId));
  const storeRules = storeId && mongoose.isValidObjectId(storeId) && productIds.length
    ? new Map((await StoreProductPrice.find({ storeId, productId: { $in: productIds } }).lean()).map((r) => [String(r.productId), r]))
    : null;

  const priced = [];
  const offerClaims = [];
  for (const item of items) {
    const { offerToken, toppings, meals, extraCheese, comboLines, comboChoices, ...rest } = item;

    if (offerToken) {
      const claim = verifyOfferClaim(offerToken, item.itemId, userId);
      if (!claim) throw new ValidationError('The limited time offer has expired. Please remove it from your cart.');
      if (offerClaims.some((c) => c.jti === claim.jti)) throw new ValidationError('A limited time offer can only be used once per order.');
      offerClaims.push(claim);
      priced.push({ ...rest, price: round2(claim.price), quantity: 1, isLimitedOffer: true, selectedAddons: [] });
      continue;
    }

    let line;
    if (item.kind === 'addon' || item.kind === 'topping') line = await priceAddonLine(item);
    else if (Array.isArray(comboLines) && comboLines.length > 0) line = await priceBuilderComboLine(item);
    else line = (await priceProductLine(item, addons, storeRules)) || (await priceComboLine(item));
    if (!line) throw unavailable(item);

    priced.push({ ...rest, ...line, isVeg: line.isVeg ?? rest.isVeg, isLimitedOffer: false });
  }

  const sum = (list) => round2(list.reduce((total, it) => total + it.price * it.quantity, 0));
  const regular = priced.filter((it) => !it.isLimitedOffer);
  if (offerClaims.length > 0) {
    const min = await getOfferMinCartValue();
    if (sum(regular) < min) throw new ValidationError(`Add items worth ₹${min} to unlock this offer.`);
  }

  return { items: priced, subtotal: sum(priced), offerClaims };
}
