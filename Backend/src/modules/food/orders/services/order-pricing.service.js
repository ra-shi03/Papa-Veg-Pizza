import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
import { FoodStore as FoodStore } from '../../store/models/store.model.js';
import { FoodFeeSettings } from '../../admin/models/feeSettings.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { FoodAppConfig } from '../../settings/models/appConfig.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { haversineKm } from './order.helpers.js';
import { priceCartItems } from './catalog-pricing.service.js';
import { getOrderableStore } from './order-store.service.js';

const DEFAULT_FEES = {
  deliveryFee: 25,
  deliveryFeeRanges: [],
  freeDeliveryUpTo: 0,
  freeDeliveryThreshold: 149,
  platformFee: 5,
  packagingFee: 0,
  handlingFee: 0,
  cancellationFee: 0,
  cancellationFreeMinutes: 0,
  gstRate: 5,
};

// The fees the super admin configured (the built-in defaults apply only until they save any).
async function loadFeeSettings() {
  const doc = await FoodFeeSettings.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
  // Once the super admin has saved settings, a field they left blank means 0, not the built-in default.
  return doc || DEFAULT_FEES;
}

// Public view of the fees, so the cart can show the same numbers the server will charge.
export async function getPublicFeeConfig() {
  const f = await loadFeeSettings();
  const pick = (k) => Number(f[k]) || 0;
  return {
    deliveryFee: pick('deliveryFee'),
    deliveryFeeRanges: f.deliveryFeeRanges || [],
    freeDeliveryUpTo: pick('freeDeliveryUpTo'),
    freeDeliveryThreshold: pick('freeDeliveryThreshold'),
    platformFee: pick('platformFee'),
    packagingFee: pick('packagingFee'),
    handlingFee: pick('handlingFee'),
    gstRate: pick('gstRate'),
    cancellationFee: pick('cancellationFee'),
    cancellationFreeMinutes: pick('cancellationFreeMinutes'),
  };
}

// Quote for a quick price check. Nothing is spent here.
export async function calculateOrderPricing(userId, dto) {
  const { pricing } = await buildOrderPricing(userId, dto);
  return { pricing };
}

// Everything is rebuilt from the catalogue and the fee settings; prices and totals sent by the client are ignored.
export async function buildOrderPricing(userId, dto) {
  const store = await getOrderableStore(dto.storeId);

  const { items, subtotal, offerClaims } = await priceCartItems(userId, dto.items, { storeId: store._id });

  const feeSettings = await loadFeeSettings();

  const packagingFee = feeSettings.packagingFee != null ? Number(feeSettings.packagingFee) : 0;
  const platformFee = feeSettings.platformFee != null ? Number(feeSettings.platformFee) : 0;

  const freeUpTo = Number(feeSettings.freeDeliveryUpTo || 0);
  const freeThreshold = Number(feeSettings.freeDeliveryThreshold || 0);
  let distanceKm = null;
  if (
    store?.location?.coordinates?.length === 2 &&
    dto?.deliveryAddress?.location?.coordinates?.length === 2
  ) {
    const [rLng, rLat] = store.location.coordinates;
    const [dLng, dLat] = dto.deliveryAddress.location.coordinates;
    const d = haversineKm(rLat, rLng, dLat, dLng);
    distanceKm = Number.isFinite(d) ? d : null;
  }
  let deliveryFee = 0;
  let deliveryFeeBreakdown = null;
  if (
    Number.isFinite(freeUpTo) &&
    freeUpTo > 0 &&
    subtotal >= freeUpTo
  ) {
    deliveryFee = 0;
  } else if (
    Number.isFinite(freeThreshold) &&
    freeThreshold > 0 &&
    subtotal >= freeThreshold
  ) {
    deliveryFee = 0;
  } else {
    const ranges = Array.isArray(feeSettings.deliveryFeeRanges)
      ? [...feeSettings.deliveryFeeRanges]
      : [];
    if (ranges.length > 0) {
      ranges.sort((a, b) => Number(a.min) - Number(b.min));
      let matched = null;
      for (let i = 0; i < ranges.length; i += 1) {
        const r = ranges[i] || {};
        const min = Number(r.min);
        const max = Number(r.max);
        const fee = Number(r.fee);
        if (
          !Number.isFinite(min) ||
          !Number.isFinite(max) ||
          !Number.isFinite(fee)
        ) {
          continue;
        }
        const isLast = i === ranges.length - 1;
        if (!Number.isFinite(distanceKm)) {
          continue;
        }
        const inRange = isLast
          ? distanceKm >= min && distanceKm <= max
          : distanceKm >= min && distanceKm < max;
        if (inRange) {
          matched = fee;
          if (Number.isFinite(distanceKm)) {
            deliveryFeeBreakdown = {
              source: "distance",
              distanceKm,
              minKm: min,
              maxKm: max,
              fee,
            };
          }
          break;
        }
      }
      deliveryFee = Number.isFinite(matched)
        ? matched
        : Number(feeSettings.deliveryFee || 0);
    } else {
      deliveryFee = Number(feeSettings.deliveryFee || 0);
    }
  }

  const handlingFee = Number(feeSettings.handlingFee) > 0 ? Number(feeSettings.handlingFee) : 0;
  const cancellationFee = Number(feeSettings.cancellationFee) > 0 ? Number(feeSettings.cancellationFee) : 0;
  const cancellationFreeMinutes = Number(feeSettings.cancellationFreeMinutes) > 0 ? Number(feeSettings.cancellationFreeMinutes) : 0;
  const gstRate = feeSettings.gstRate != null ? Number(feeSettings.gstRate) : 0;

  let discount = 0;
  let appliedCoupon = null;
  const codeRaw = dto.couponCode
    ? String(dto.couponCode).trim().toUpperCase()
    : "";

  if (codeRaw) {
    const appConfig = await FoodAppConfig.findOne().lean();
    if (appConfig && appConfig.couponEnabled === false) {
      throw new ValidationError("Coupon system is currently disabled globally");
    }
    const now = new Date();
    const offer = await FoodOffer.findOne({ couponCode: codeRaw }).lean();
    if (offer) {
      const statusOk = offer.status === "active";
      const startOk = !offer.startDate || now >= new Date(offer.startDate);
      const endOk = !offer.endDate || now < new Date(offer.endDate);
      const scopeOk =
        offer.storeScope !== "selected" ||
        String(offer.storeId || "") === String(dto.storeId || "");
      const minOk = subtotal >= (Number(offer.minOrderValue) || 0);
      let usageOk = true;
      if (
        Number(offer.usageLimit) > 0 &&
        Number(offer.usedCount || 0) >= Number(offer.usageLimit)
      ) {
        usageOk = false;
      }

      let perUserOk = true;
      if (userId && Number(offer.perUserLimit) > 0) {
        const usage = await FoodOfferUsage.findOne({
          offerId: offer._id,
          userId,
        }).lean();
        if (usage && Number(usage.count) >= Number(offer.perUserLimit)) {
          perUserOk = false;
        }
      }

      let firstOrderOk = true;
      if (userId && offer.customerScope === "first-time") {
        const c = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        firstOrderOk = c === 0;
      }
      if (userId && offer.isFirstOrderOnly === true) {
        const c2 = await FoodOrder.countDocuments({
          userId: new mongoose.Types.ObjectId(userId),
        });
        if (c2 > 0) firstOrderOk = false;
      }

      const allowed =
        statusOk &&
        startOk &&
        endOk &&
        scopeOk &&
        minOk &&
        usageOk &&
        perUserOk &&
        firstOrderOk;

      if (allowed) {
        if (offer.discountType === "percentage") {
          const raw = subtotal * (Number(offer.discountValue) / 100);
          const capped = Number(offer.maxDiscount)
            ? Math.min(raw, Number(offer.maxDiscount))
            : raw;
          discount = Math.max(0, Math.min(subtotal, Math.floor(capped)));
        } else {
          discount = Math.max(
            0,
            Math.min(subtotal, Math.floor(Number(offer.discountValue) || 0)),
          );
        }
        appliedCoupon = { code: codeRaw, discount };
      }
    }
  }

  // GST is charged on the food after discount plus the handling charge (what the cart shows).
  const taxable = Math.max(0, subtotal - discount + handlingFee);
  const tax =
    Number.isFinite(gstRate) && gstRate > 0
      ? Math.round(taxable * (gstRate / 100))
      : 0;

  const total = Math.max(
    0,
    subtotal + packagingFee + deliveryFee + platformFee + handlingFee + tax - discount,
  );

  return {
    items,
    offerClaims,
    pricing: {
      subtotal,
      tax,
      packagingFee,
      deliveryFee,
      deliveryFeeBreakdown: deliveryFeeBreakdown || undefined,
      freeDeliveryUpTo: Number.isFinite(freeUpTo) ? freeUpTo : undefined,
      platformFee,
      handlingFee,
      cancellationFee,
      cancellationFreeMinutes,
      discount,
      total,
      currency: "INR",
      couponCode: appliedCoupon?.code || codeRaw || null,
      appliedCoupon,
    },
  };
}
