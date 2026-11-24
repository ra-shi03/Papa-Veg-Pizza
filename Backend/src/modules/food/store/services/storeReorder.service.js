import { FoodOrder } from '../../orders/models/order.model.js';
import { createOrder } from '../../orders/services/order.service.js';
import { User } from '../../../../core/users/models/user.model.js';
import { NotFoundError, ValidationError } from '../../../../core/auth/errors.js';
import { conflict } from './attendanceAccess.js';
import { findOrder, requireManager, requireStore } from './storeOrders.service.js';

// Completed Orders -> Reorder: the customer phones the store ("same as last time") and the store manager places the same
// order again for that customer. It goes through the normal order placement (createOrder), so:
//   - prices, fees and tax are TODAY's, worked out by the server from the menu and the store's own prices (never the
//     old bill, never the screen); an item no longer sold, or a size / crust / topping no longer offered, is refused
//   - the store must be open and offer the order method; payment is cash on delivery only (the customer is not there to
//     pay online), so it is refused when the super admin has switched COD off
//   - the customer gets the usual "order placed" notice and can cancel it in the app under the normal rules
// No coupon, limited-time-offer price or free reward item is carried over (each was for that one order).

const REPEATABLE = ['picked_up', 'reached_drop', 'delivered'];   // the store's Completed Orders list
const MAX_QTY = 20;
const DOUBLE_CLICK_MS = 2 * 60 * 1000;
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isReward = (item) => String(item.itemId || '').startsWith('reward:');

/** A saved order line back into what the cart sends (what was picked, never a price). */
export function cartLineFrom(item, quantity) {
  const base = { itemId: item.itemId, name: item.name, quantity, image: item.image || '', isVeg: item.isVeg !== false };
  if (item.kind === 'addon' || item.kind === 'topping') return { ...base, kind: item.kind };
  if (item.comboType === 'builder') {
    return { ...base, comboLines: (item.components || []).filter((c) => c.productId).map((c) => ({ productId: c.productId })) };
  }
  if (item.comboType === 'meal') {
    return { ...base, comboChoices: Object.fromEntries((item.components || []).filter((c) => c.slot).map((c) => [c.slot, c.name])) };
  }
  const type = (a) => String(a.type || '').toLowerCase();
  const extras = item.selectedAddons || [];
  return {
    ...base,
    kind: 'product',
    size: item.size || '',
    crust: item.crust || '',
    toppings: extras.filter((a) => type(a).includes('topping')).map((a) => a.name),
    meals: extras.filter((a) => !type(a).includes('topping') && !type(a).includes('crust') && type(a) !== 'cheese').map((a) => a.name),
    extraCheese: extras.some((a) => type(a) === 'cheese'),
    notes: item.notes || '',
  };
}

/**
 * body: { lines: [{ index, quantity }] } — which lines of the old order (their position on it) and how many of each.
 * Everything else (customer, address, method, items picked) comes from the saved order, never from the screen.
 */
export async function reorderForCustomer(user, orderId, body = {}) {
  requireManager(user);
  const storeId = requireStore(user);
  const old = await findOrder(orderId, storeId);                 // another store's order is 404
  if (!REPEATABLE.includes(old.orderStatus)) throw new ValidationError('Only a completed order can be ordered again.');
  if (old.orderMethod === 'train' || old.train?.trainNo) throw new ValidationError('A train order cannot be repeated: the customer has to order again from the app.');

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) throw new ValidationError('Choose at least one item to order again.');
  const items = old.items || [];
  const seen = new Set();
  const cart = lines.map((l) => {
    const index = Number(l?.index);
    const quantity = Number(l?.quantity);
    if (!Number.isInteger(index) || index < 0 || index >= items.length || seen.has(index)) throw new ValidationError('That item is not on the original order.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) throw new ValidationError(`Quantity must be between 1 and ${MAX_QTY}.`);
    seen.add(index);
    const item = items[index];
    if (isReward(item)) throw new ValidationError(`"${item.name}" was a free reward on that order and cannot be ordered again.`);
    return cartLineFrom(item.toObject ? item.toObject() : item, quantity);
  });

  const customer = old.userId ? await User.findById(old.userId).select('isActive isBlocked isDeleted').lean() : null;
  if (!customer || customer.isDeleted) throw new NotFoundError('The customer of that order no longer has an account.');
  if (customer.isBlocked || customer.isActive === false) throw new ValidationError('The customer\'s account is blocked, so no order can be placed for them.');

  const ref = old.order_id || old.orderId || String(old._id);
  const note = `Reorder of #${ref}, placed by the store at the customer's request`;
  // a second click (or a second manager) within a moment must not place the same order twice
  if (await FoodOrder.exists({ userId: old.userId, storeId: old.storeId, note: new RegExp(`^${escape(note)}`), createdAt: { $gt: new Date(Date.now() - DOUBLE_CLICK_MS) } })) {
    throw conflict('This order was placed again a moment ago. Check Incoming Orders.');
  }

  const addr = old.deliveryAddress || {};
  const { order } = await createOrder(String(old.userId), {
    storeId: String(storeId),
    zoneId: old.zoneId ? String(old.zoneId) : undefined,
    items: cart,
    orderMethod: old.orderMethod || (old.isPickup ? 'takeaway' : 'delivery'),
    paymentMethod: 'cash',
    address: {
      label: addr.label, name: addr.name, fullName: addr.fullName, phone: addr.phone, street: addr.street,
      additionalDetails: addr.additionalDetails, city: addr.city, state: addr.state, zipCode: addr.zipCode,
      ...(addr.location?.coordinates?.length === 2 ? { location: { coordinates: addr.location.coordinates } } : {}),
    },
    customerName: old.customerName || addr.fullName || addr.name || '',
    customerPhone: old.customerPhone || addr.phone || '',
    customerEmail: old.customerEmail || '',
    sendCutlery: old.sendCutlery !== false,
    note: [note, old.note && !String(old.note).startsWith('Reorder of #') ? old.note : ''].filter(Boolean).join(' | '),
  });

  return {
    message: `Order placed for ${old.customerName || 'the customer'} at today's prices (cash on delivery). It is in Incoming Orders.`,
    order: { _id: order.orderMongoId, orderId: order.orderId, total: order.pricing?.total ?? null, from: ref },
  };
}
