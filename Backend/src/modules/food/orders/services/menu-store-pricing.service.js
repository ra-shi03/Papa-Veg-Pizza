import mongoose from 'mongoose';
import { StoreProductPrice } from '../../franchise/models/storeProductPrice.model.js';
import { applyStorePrice } from '../../franchise/services/storePriceRules.js';
import { resolveStoreForLocation } from './order-store.service.js';

// Customer menu for one store: the same store price rules the order pricing uses (catalog-pricing.service.js),
// so the price on the menu is the price charged. A request names its store with ?storeId=, or with ?lat&lng
// (the customer's location, the way checkout picks the store). Neither, or no store found: catalogue prices.

async function menuStoreId(query = {}) {
  if (query.storeId && mongoose.isValidObjectId(String(query.storeId))) return String(query.storeId);
  const lat = parseFloat(query.lat);
  const lng = parseFloat(query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    return String((await resolveStoreForLocation(lat, lng)).store._id);
  } catch {
    return null;
  }
}

/** Products (plain objects or documents) priced for the requested store; unavailable ones are left out. */
export async function priceMenuForStore(products, query = {}) {
  const plain = products.map((p) => (p?.toObject ? p.toObject() : p));
  const storeId = await menuStoreId(query);
  if (!storeId || !plain.length) return plain;
  const rules = new Map(
    (await StoreProductPrice.find({ storeId, productId: { $in: plain.map((p) => p._id) } }).lean()).map((r) => [String(r.productId), r]),
  );
  if (!rules.size) return plain;
  return plain.map((p) => applyStorePrice(p, rules.get(String(p._id)))).filter(Boolean);
}
