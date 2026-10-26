import mongoose from 'mongoose';
import { Product } from '../../admin/models/product.model.js';
import { Addon } from '../../admin/models/addon.model.js';
import { FoodCombo } from '../../admin/models/combo.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { addonPrice, getOfferMinCartValue, verifyOfferClaim } from '../../settings/controllers/cartConfig.controller.js';

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

async function priceProductLine(item, addons) {
  const product = mongoose.isValidObjectId(item.itemId) ? await Product.findById(item.itemId).lean() : null;
  if (!product || !/^active$/i.test(product.status || '')) return null;

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

async function priceComboLine(item) {
  const combo = mongoose.isValidObjectId(item.itemId) ? await FoodCombo.findById(item.itemId).lean() : null;
  if (!combo || combo.status !== 'active') return null;
  return { price: round2(Number(combo.price) || 0), size: '', crust: '', selectedAddons: [] };
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
 * Returns { items, subtotal, offerClaims } where offerClaims must be spent with spendOfferClaims() when the order is saved.
 */
export async function priceCartItems(userId, clientItems) {
  const items = Array.isArray(clientItems) ? clientItems : [];
  const addons = items.some((i) => i.kind !== 'addon' && i.kind !== 'topping' && !i.offerToken)
    ? await Addon.find({ status: { $ne: 'Inactive' } }).lean()
    : [];

  const priced = [];
  const offerClaims = [];
  for (const item of items) {
    const { offerToken, toppings, meals, extraCheese, ...rest } = item;

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
    else line = (await priceProductLine(item, addons)) || (await priceComboLine(item));
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
