import mongoose from 'mongoose';
import { FoodStore } from '../models/store.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { openStoreIds } from '../../franchise/services/storeHours.js';
import { sendResponse } from '../../../../utils/response.js';
import { NotFoundError } from '../../../../core/auth/errors.js';

// Public, read-only views the customer app needs about a store and the coupons it can use. Only fields a customer
// already sees in the app: no franchise, owner, documents, approval or internal data.

const ORDERABLE = { approvalStatus: 'Approved', isActive: { $ne: false } };

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

/** GET /v1/food/offers/public[?storeId=] : coupons a customer can see right now. */
export async function getPublicOffers(req, res, next) {
  try {
    const now = new Date();
    const storeId = mongoose.isValidObjectId(String(req.query.storeId || '')) ? String(req.query.storeId) : null;
    const filter = {
      status: 'active',
      showInCart: { $ne: false },
      $and: [
        { $or: [{ startDate: null }, { startDate: { $exists: false } }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: now } }] },
        storeId
          ? { $or: [{ storeScope: { $ne: 'selected' } }, { storeId }] }
          : { storeScope: { $ne: 'selected' } },
      ],
    };
    const offers = await FoodOffer.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const allOffers = offers
      .filter((o) => !(Number(o.usageLimit) > 0 && Number(o.usedCount || 0) >= Number(o.usageLimit)))
      .map((o) => ({
        id: String(o._id), _id: String(o._id), couponCode: o.couponCode,
        title: o.discountType === 'percentage' ? `${o.discountValue}% OFF` : `FLAT ₹${o.discountValue} OFF`,
        description: [o.minOrderValue > 0 ? `On orders above ₹${o.minOrderValue}` : 'On any order', o.maxDiscount ? `Up to ₹${o.maxDiscount} off` : ''].filter(Boolean).join('. '),
        discountType: o.discountType, discountValue: o.discountValue, minOrderValue: o.minOrderValue || 0, maxDiscount: o.maxDiscount ?? null,
        customerScope: o.customerScope, startDate: o.startDate || null, endDate: o.endDate || null, status: 'active', offerType: 'online', showInCart: true,
      }));
    return sendResponse(res, 200, 'OK', { allOffers });
  } catch (err) {
    next(err);
  }
}
