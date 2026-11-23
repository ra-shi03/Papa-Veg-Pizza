import mongoose from 'mongoose';
import { FoodStore } from '../models/store.model.js';
import { openStoreIds, windowOn, to12 } from '../../franchise/services/storeHours.js';
import { StoreHours } from '../../franchise/models/storeHours.model.js';
import { sendResponse } from '../../../../utils/response.js';
import { NotFoundError } from '../../../../core/auth/errors.js';
import { FoodAppConfig } from '../../settings/models/appConfig.model.js';
import { couponStoreFromQuery, liveCouponsForStore, publicCouponView } from '../../settings/services/couponOffer.service.js';
import { resolveStoreForLocation, resolveTrainStore, findOrderableStore } from '../../orders/services/order-store.service.js';
import { buildSlots, SCHEDULE } from '../../orders/services/order-schedule.service.js';

// Public, read-only views the customer app needs about a store and the coupons it can use. Only fields a customer
// already sees in the app: no franchise, owner, documents, approval or internal data.

const ORDERABLE = { approvalStatus: 'Approved', isActive: { $ne: false } };

/**
 * GET /v1/food/stores/status?lat=&lng= (or ?storeId=) : is the store serving this customer taking orders right now?
 * Open means inside its operating hours, no temporary closure, and not switched to Closed by the store manager.
 * The store is found whether or not it is open. When no store serves the point, serviceable is false (the app shows
 * its own "not available here" messages), and nothing is said about opening hours.
 */
export async function getStoreStatus(req, res, next) {
  try {
    let store = null;
    try {
      if (req.query.storeId) store = await findOrderableStore(req.query.storeId);
      else if (req.query.lat !== undefined && req.query.lng !== undefined && req.query.lat !== '' && req.query.lng !== '') {
        store = (await resolveStoreForLocation(parseFloat(req.query.lat), parseFloat(req.query.lng), { anyHours: true }))?.store || null;
      } else if (req.query.fallback === '1' || req.query.auto === '1') {
        store = (await resolveStoreForLocation(NaN, NaN, { anyHours: true }))?.store || null;
      }
    } catch { store = null; }
    res.set('Cache-Control', 'no-store');
    if (!store) return sendResponse(res, 200, 'OK', { serviceable: false, isOpen: true });
    const open = await openStoreIds([store._id]);
    const isOpen = open.has(String(store._id));

    // Dynamic operating hours for store
    const hoursDoc = await StoreHours.findOne({ storeId: store._id }).lean();
    const todayWindow = windowOn(hoursDoc, new Date());
    let openTime = '10:00 AM';
    let closeTime = '11:00 PM';
    if (todayWindow?.open && todayWindow?.close && (todayWindow.open !== todayWindow.close || todayWindow.isClosed)) {
      openTime = to12(todayWindow.open);
      closeTime = to12(todayWindow.close);
    }
    const storeTiming = `${openTime} - ${closeTime}`;

    const baseData = { serviceable: true, storeId: String(store._id), storeName: store.storeName, isOpen };

    if (req.query.includeHours === '1' || req.query.fallback === '1') {
      return sendResponse(res, 200, 'OK', {
        ...baseData,
        openTime,
        closeTime,
        storeTiming,
        opensAt: openTime,
      });
    }

    return sendResponse(res, 200, 'OK', baseData);
  } catch (err) {
    next(err);
  }
}

/** GET /v1/food/stores/:id */
export async function getPublicStore(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new NotFoundError('Store not found');
    const store = await FoodStore.findOne({ _id: id, ...ORDERABLE }).select('storeName phone address city state pincode latitude longitude zoneId').lean();
    if (!store) throw new NotFoundError('Store not found');
    const open = await openStoreIds([store._id]);
    return sendResponse(res, 200, 'OK', {
      _id: String(store._id), storeId: String(store._id), storeName: store.storeName, phone: store.phone || '',
      address: store.address || '', city: store.city || '', state: store.state || '', pincode: store.pincode || '',
      latitude: store.latitude ?? null, longitude: store.longitude ?? null, zoneId: store.zoneId ? String(store.zoneId) : null,
      isOpen: open.has(String(store._id)),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/food/stores/slots?lat=&lng= : the store serving that point and its delivery slots for "Order for later".
 * The store is picked regardless of today's hours, so a closed store still offers tomorrow's slots.
 */
export async function getDeliverySlots(req, res, next) {
  try {
    // a pickup order uses the store the customer chose; train and delivery find theirs
    const { store } = req.query.storeId
      ? { store: await findOrderableStore(req.query.storeId) }
      : req.query.train === '1'
        ? await resolveTrainStore(req.query.stationCode, { anyHours: true })
        : await resolveStoreForLocation(parseFloat(req.query.lat), parseFloat(req.query.lng), { anyHours: true });
    const [open, config] = await Promise.all([
      openStoreIds([store._id]),
      FoodAppConfig.findOne().select('scheduledOrdersEnabled').lean(),
    ]);
    const scheduledOrdersEnabled = config?.scheduledOrdersEnabled !== false;
    return sendResponse(res, 200, 'OK', {
      storeId: String(store._id),
      storeName: store.storeName,
      openNow: open.has(String(store._id)),
      scheduledOrdersEnabled,
      leadMinutes: SCHEDULE.leadMinutes,
      days: scheduledOrdersEnabled ? await buildSlots(store._id) : [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/food/offers/public[?storeId= | ?lat=&lng=] : coupons a customer can use right now.
 * With a store (or a location that resolves to one): every coupon checkout accepts for that store. Without: global
 * coupons only. Same list as /settings/coupons/public (couponOffer.service liveCouponsForStore).
 */
export async function getPublicOffers(req, res, next) {
  try {
    const storeId = await couponStoreFromQuery(req.query);
    const allOffers = (await liveCouponsForStore(storeId)).map(publicCouponView);
    res.set('Cache-Control', 'no-store');
    return sendResponse(res, 200, 'OK', { allOffers });
  } catch (err) {
    next(err);
  }
}
