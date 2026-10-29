import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
import { FoodStore as FoodStore } from '../../store/models/store.model.js';
import { FoodTransaction } from '../models/foodTransaction.model.js';
import { FoodDeliveryPartner } from '../../delivery/models/deliveryPartner.model.js';
import { FoodDeliveryCashDeposit } from '../../delivery/models/foodDeliveryCashDeposit.model.js';
import { FoodDeliveryCashLimit } from '../../admin/models/deliveryCashLimit.model.js';
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from '../../../../core/auth/errors.js';
import { buildPaginatedResult, buildPaginationOptions } from '../../../../utils/helpers.js';
import { logger } from '../../../../utils/logger.js';
import { getIO, rooms } from '../../../../config/socket.js';
import { getFirebaseDB } from '../../../../config/firebase.js';
import {
  fetchRazorpayPaymentLink,
  isRazorpayConfigured,
} from '../helpers/razorpay.helper.js';
import { fetchPolyline } from '../utils/googleMaps.js';
import * as foodTransactionService from './foodTransaction.service.js';
import * as dispatchService from './order-dispatch.service.js';
import { awardOrderPointsSafely } from '../../user/services/rewards.service.js';
import {
  buildOrderIdentityFilter,
  emitDeliveryDropOtpToUser,
  enqueueOrderEvent,
  generateFourDigitDeliveryOtp,
  notifyOwnerSafely,
  notifyOwnersSafely,
  pushStatusHistory,
  sanitizeOrderForExternal,
} from './order.helpers.js';

function normalizeOtpValue(value) {
  return String(value ?? '').replace(/\D/g, '').trim();
}

function isOtpMatch(expectedOtp, enteredOtp) {
  const expected = normalizeOtpValue(expectedOtp);
  const entered = normalizeOtpValue(enteredOtp);
  if (!expected || !entered) return false;
  if (entered === expected) return true;

  // Accept last 4 digits if client sends prefixed/padded OTP.
  if (expected.length === 4 && entered.length > 4) {
    return entered.slice(-4) === expected;
  }

  return false;
}

// Rider steps run in one order: accept -> reached pickup -> pickup (once the kitchen is done) -> reached drop
// (sends the customer their OTP) -> customer OTP -> complete. A step on someone else's order is 403; a step repeated
// or taken out of order is 409 and changes nothing.
const CANCELLED_STATUSES = ['cancelled_by_user', 'cancelled_by_store', 'cancelled_by_admin'];
const BEFORE_PICKUP = ['confirmed', 'preparing', 'ready_for_pickup'];
const PICKUP_FROM = ['ready_for_pickup', 'reached_pickup'];
const COMPLETE_FROM = ['picked_up', 'reached_drop'];
const PAID_STATUSES = ['paid', 'captured', 'authorized'];
const RACED = 'This order was just updated. Refresh and try again.';

const stepConflict = (message) => Object.assign(new Error(message), { name: 'ConflictError', statusCode: 409 });

// The drop OTP is 4 digits, so tries are limited: DROP_OTP_MAX_TRIES per order, shared by verify-drop-otp and complete.
// Past that the order answers 429 until the store manager (or super admin) resets it (POST /store/orders/:id/reset-drop-otp).
export const DROP_OTP_MAX_TRIES = 5;
const TRIES_PATH = 'deliveryVerification.dropOtp.failedAttempts';

/** Uses one try, atomically (parallel guesses cannot get past the limit). Throws 429 when none are left. */
async function spendDropOtpTry(order) {
  const res = await FoodOrder.updateOne(
    { _id: order._id, $or: [{ [TRIES_PATH]: { $lt: DROP_OTP_MAX_TRIES } }, { [TRIES_PATH]: { $exists: false } }] },
    { $inc: { [TRIES_PATH]: 1 } },
  );
  if (res.modifiedCount !== 1) {
    throw Object.assign(
      new Error('Too many wrong OTP attempts. Ask the store manager to reset the OTP for this order.'),
      { name: 'TooManyAttemptsError', statusCode: 429 },
    );
  }
}

/** The order must be this rider's accepted order, still on its way. */
function assertOwnLiveOrder(order, deliveryPartnerId) {
  if (order.dispatch?.deliveryPartnerId?.toString() !== String(deliveryPartnerId)) {
    throw new ForbiddenError('Not your order');
  }
  if (order.dispatch?.status !== 'accepted') throw stepConflict('Accept this order before updating it.');
  if (CANCELLED_STATUSES.includes(order.orderStatus)) throw stepConflict('This order was cancelled.');
  if (order.orderStatus === 'delivered') throw stepConflict('This order is already delivered.');
}

/**
 * Takes the step only if the order is still where the step expects it, so two taps (or the store and the rider at the
 * same moment) cannot both succeed. False when another request got there first.
 */
async function claimStep(order, filter, set) {
  const res = await FoodOrder.updateOne(
    { _id: order._id, 'dispatch.deliveryPartnerId': order.dispatch.deliveryPartnerId, 'dispatch.status': 'accepted', ...filter },
    { $set: set },
  );
  return res.modifiedCount === 1;
}

async function getPartnerCashCapacity(deliveryPartnerId) {
  const partnerObjectId = new mongoose.Types.ObjectId(deliveryPartnerId);
  const limitDoc = await FoodDeliveryCashLimit.findOne({ isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  const totalCashLimit = Number(limitDoc?.deliveryCashLimit || 0);
  // If limit is not configured, don't block assignments globally.
  if (!Number.isFinite(totalCashLimit) || totalCashLimit <= 0) {
    return {
      totalCashLimit: 0,
      cashInHand: 0,
      availableCashLimit: Number.MAX_SAFE_INTEGER,
      hasCapacity: true,
    };
  }

  const [cashAgg, depositsAgg] = await Promise.all([
    FoodOrder.aggregate([
      {
        $match: {
          'dispatch.deliveryPartnerId': partnerObjectId,
          orderStatus: 'delivered',
        },
      },
      {
        $lookup: {
          from: 'food_transactions',
          localField: '_id',
          foreignField: 'orderId',
          as: 'tx',
        },
      },
      {
        $match: {
          $or: [
            { 'tx.paymentMethod': 'cash' },
            { 'tx': { $size: 0 }, 'payment.method': 'cash' }
          ]
        }
      },
      {
        $group: {
          _id: null,
          grossCashCollected: { $sum: { $ifNull: ['$pricing.total', 0] } },
        },
      },
    ]),
    FoodDeliveryCashDeposit.aggregate([
      {
        $match: {
          deliveryPartnerId: partnerObjectId,
          status: 'Completed',
        },
      },
      {
        $group: {
          _id: null,
          depositedCash: { $sum: { $ifNull: ['$amount', 0] } },
        },
      },
    ]),
  ]);

  const grossCashCollected = Number(cashAgg?.[0]?.grossCashCollected || 0);
  const depositedCash = Number(depositsAgg?.[0]?.depositedCash || 0);
  const cashInHand = Math.max(0, grossCashCollected - depositedCash);
  const availableCashLimit = Math.max(0, totalCashLimit - cashInHand);

  return {
    totalCashLimit,
    cashInHand,
    availableCashLimit,
    hasCapacity: availableCashLimit > 0,
  };
}

function emitOrderUpdate(order, deliveryPartnerId, options = {}) {
  const shouldSendMilestonePush = options?.sendMilestonePush !== false;
  try {
    const io = getIO();
    if (io) {
      const dv =
        order.deliveryVerification?.toObject?.() || order.deliveryVerification;
      const payload = {
        orderMongoId: order._id?.toString?.(),
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        deliveryState: order.deliveryState,
        deliveryVerification: dv,
      };
      io.to(rooms.delivery(deliveryPartnerId)).emit(
        'order_status_update',
        payload,
      );
      io.to(rooms.store(order.storeId)).emit(
        'order_status_update',
        payload,
      );
      io.to(rooms.user(order.userId)).emit('order_status_update', payload);
    }

    // Only send push notifications for key delivery milestones when explicitly allowed.
    if (!shouldSendMilestonePush) return;

    // Only send push notifications for key delivery milestones
    const status = order.orderStatus;
    if (!['picked_up', 'reached_drop', 'delivered'].includes(status)) return;

    let userTitle = '';
    let userBody = '';
    let riderTitle = '';
    let riderBody = '';

    const orderId = order._id.toString();

    if (status === 'picked_up') {
      userTitle = 'Order on the way!';
      userBody = `Partner has picked up your order #${orderId} and is heading your way.`;
      riderTitle = 'Order picked up!';
      riderBody = `You have picked up order #${orderId}. Proceed to the customer location.`;
    } else if (status === 'reached_drop') {
      userTitle = 'Partner nearby!';
      userBody = `Your delivery partner has reached your location for order #${orderId}.`;
      riderTitle = 'Arrived at drop!';
      riderBody = `You have reached the customer location for order #${orderId}.`;
    } else if (status === 'delivered') {
      userTitle = `Order #${orderId} delivered!`;
      userBody = 'Hope you enjoyed your meal! Don\'t forget to rate your experience.';
      riderTitle = 'Delivery successful!';
      riderBody = `Order #${orderId} has been successfully delivered.`;

      if (order.payment?.method === 'cash' || order.paymentMethod === 'cash') {
        riderTitle = 'Payment collected!';
        const amt = order.pricing?.total || order.amounts?.totalCustomerPaid || 0;
        riderBody = `You have collected Rs ${amt} cash for Order #${orderId}.`;
      }
    }

    if (userTitle) {
      void notifyOwnerSafely(
        { ownerType: 'USER', ownerId: order.userId },
        {
          title: userTitle,
          body: userBody,
          dataOnly: true,
          data: {
            type: 'order_status_update',
            orderId,
            orderMongoId: order._id?.toString?.() || '',
            orderStatus: status,
          },
        },
      );
    }

    if (riderTitle) {
      void notifyOwnerSafely(
        { ownerType: 'DELIVERY_PARTNER', ownerId: deliveryPartnerId },
        {
          title: riderTitle,
          body: riderBody,
          dataOnly: true,
          data: {
            type: status === 'delivered' ? 'order_completed' : 'order_status_update',
            orderId,
            orderMongoId: order._id?.toString?.() || '',
            paymentMethod: order.payment?.method || order.paymentMethod,
            amountCollected: String(order.pricing?.total || order.amounts?.totalCustomerPaid || 0),
          },
        },
      );
    }
  } catch (error) {
    logger.error(`Error emitting delivery order update: ${error?.message || error}`);
  }
}

async function syncRazorpayQrPayment(orderDoc) {
  // Phase 2: FoodTransaction is source of truth; avoid relying on FoodOrder.payment.
  const tx = await FoodTransaction.findOne({ orderId: orderDoc?._id }).lean();
  const payment = tx?.payment || orderDoc?.payment || null;
  if (!payment) return null;
  if (payment.method !== 'razorpay_qr') return payment;
  if (payment.status === 'paid') return payment;

  const paymentLinkId = payment?.qr?.paymentLinkId;
  if (!paymentLinkId || !isRazorpayConfigured()) return payment;

  let link;
  try {
    link = await fetchRazorpayPaymentLink(paymentLinkId);
  } catch (error) {
    logger.warn(
      `Razorpay payment-link fetch failed for ${paymentLinkId}: ${
        error?.message || error
      }`,
    );
    return orderDoc.payment;
  }

  const linkStatus = String(link?.status || '').toLowerCase();
  if (!linkStatus) return orderDoc.payment;

  await FoodTransaction.updateOne(
    { orderId: orderDoc?._id },
    {
      $set: {
        'payment.qr.status': linkStatus,
        'payment.status': ['paid', 'captured', 'authorized'].includes(linkStatus)
          ? 'paid'
          : ['expired', 'cancelled', 'canceled', 'failed'].includes(linkStatus)
            ? 'failed'
            : (payment.status || 'pending_qr'),
      },
    },
  );

  const updatedTx = await FoodTransaction.findOne({ orderId: orderDoc?._id }).lean();
  return updatedTx?.payment || payment;
}

export async function getCurrentTripDelivery(deliveryPartnerId) {
  if (!deliveryPartnerId) {
    throw new ValidationError('Delivery partner ID required');
  }

  const partnerId = new mongoose.Types.ObjectId(deliveryPartnerId);
  const order = await FoodOrder.findOne({
    'dispatch.deliveryPartnerId': partnerId,
    'dispatch.status': 'accepted',
    orderStatus: {
      $in: ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'],
    },
  })
    .populate({
      path: 'storeId',
      select: 'storeName name phone location addressLine1 area city state profileImage',
    })
    .populate({ path: 'userId', select: 'name phone' })
    .sort({ updatedAt: -1 })
    .lean();

  if (!order) return null;
  const tx = await FoodTransaction.findOne({ orderId: order._id }).lean();
  const out = sanitizeOrderForExternal(order);
  if (tx) {
    out.paymentMethod = tx.payment?.method || tx.paymentMethod || out.paymentMethod;
    out.payment = tx.payment || out.payment;
    out.pricing = tx.pricing || out.pricing;
    out.amounts = tx.amounts || out.amounts;
    out.transactionStatus = tx.status || out.transactionStatus;
  }
  return out;
}

export async function listOrdersAvailableDelivery(deliveryPartnerId, query) {
  const { page, limit, skip } = buildPaginationOptions(query);
  const partnerCapacity = await getPartnerCashCapacity(deliveryPartnerId);
  const cashLimit = {
    blocked: !partnerCapacity.hasCapacity,
    message: !partnerCapacity.hasCapacity
      ? 'Please deposit your amount to get new orders.'
      : '',
    totalCashLimit: Number(partnerCapacity.totalCashLimit || 0),
    cashInHand: Number(partnerCapacity.cashInHand || 0),
    availableCashLimit: Number(partnerCapacity.availableCashLimit || 0),
  };

  const activeOwnOrderFilter = {
    'dispatch.deliveryPartnerId': new mongoose.Types.ObjectId(deliveryPartnerId),
    orderStatus: {
      $nin: [
        'delivered',
        'cancelled_by_user',
        'cancelled_by_store',
        'cancelled_by_admin',
      ],
    },
  };

  const filter = partnerCapacity.hasCapacity
    ? {
        $or: [
          {
            'dispatch.status': 'unassigned',
            orderStatus: { $in: ['confirmed', 'preparing', 'ready_for_pickup'] },
          },
          activeOwnOrderFilter,
        ],
      }
    : activeOwnOrderFilter;

  const [docs, total] = await Promise.all([
    FoodOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name phone email')
      .populate(
        'storeId',
        'storeName name address phone phone location profileImage',
      )
      .lean(),
    FoodOrder.countDocuments(filter),
  ]);

  const orderIds = (docs || []).map((d) => d?._id).filter(Boolean);
  const txRows = orderIds.length
    ? await FoodTransaction.find({ orderId: { $in: orderIds } }).lean()
    : [];
  const txByOrderId = new Map(txRows.map((t) => [String(t.orderId), t]));

  const enriched = (docs || []).map((doc) => {
    const tx = txByOrderId.get(String(doc?._id)) || null;
    if (!tx) return doc;
    return {
      ...doc,
      paymentMethod: tx.payment?.method || tx.paymentMethod || doc.paymentMethod,
      payment: tx.payment || doc.payment,
      pricing: tx.pricing || doc.pricing,
      amounts: tx.amounts || doc.amounts,
      transactionStatus: tx.status || doc.transactionStatus,
    };
  });

  return {
    ...buildPaginatedResult({ docs: enriched, total, page, limit }),
    cashLimit,
  };
}

export async function acceptOrderDelivery(orderId, deliveryPartnerId) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');

  const partnerId = new mongoose.Types.ObjectId(deliveryPartnerId);

  const existingOrder = await FoodOrder.findOne(identity)
    .select('pricing payment dispatch orderStatus')
    .lean();
  if (!existingOrder) throw new NotFoundError('Order not found');

  const paymentMethod = String(existingOrder?.payment?.method || 'cash').toLowerCase();
  const isCashOrder = paymentMethod === 'cash';
  const orderAmount = Math.max(0, Number(existingOrder?.pricing?.total || 0));
  const offeredEntry = (existingOrder?.dispatch?.offeredTo || []).find(
    (entry) => String(entry?.partnerId || '') === String(deliveryPartnerId),
  );
  const canBypassCashLimit = Boolean(offeredEntry?.allowOverLimit);

  const partnerCapacity = await getPartnerCashCapacity(deliveryPartnerId);
  const hasAmountCapacity = Number(partnerCapacity.availableCashLimit || 0) >= orderAmount;

  if (isCashOrder && !hasAmountCapacity && !canBypassCashLimit) {
    throw new ValidationError('Cash limit is not enough for this order amount. Please deposit your amount to get orders.');
  }

  if (!partnerCapacity.hasCapacity && !canBypassCashLimit) {
    throw new ValidationError('Cash limit reached. Please deposit your amount to get orders.');
  }

  const now = new Date();
  const acceptedStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'picked_up'];
  const cancellableStatuses = [
    'cancelled_by_user',
    'cancelled_by_store',
    'cancelled_by_admin',
  ];

  const statusHistoryEntry = {
    byRole: 'DELIVERY_PARTNER',
    byId: partnerId,
    from: 'dispatchable',
    to: 'accepted',
    note: 'Delivery partner accepted order',
    at: now,
  };

  const order = await FoodOrder.findOneAndUpdate(
    {
      ...identity,
      orderStatus: { $in: acceptedStatuses },
      $or: [
        { 'dispatch.status': 'unassigned' },
        {
          'dispatch.status': 'assigned',
          'dispatch.deliveryPartnerId': partnerId,
        },
      ],
    },
    {
      $set: {
        'dispatch.deliveryPartnerId': partnerId,
        'dispatch.status': 'accepted',
        'dispatch.assignedAt': now,
        'dispatch.acceptedAt': now,
      },
      $push: {
        statusHistory: statusHistoryEntry,
      },
    },
    { new: true },
  ).populate('storeId userId');

  if (!order) {
    const existing = await FoodOrder.findOne(identity)
      .select('orderStatus dispatch')
      .lean();

    if (!existing) throw new NotFoundError('Order not found');
    if (cancellableStatuses.includes(existing.orderStatus)) {
      throw new ValidationError('Order was cancelled');
    }
    if (existing.orderStatus === 'delivered') {
      throw new ValidationError('Order already delivered');
    }
    if (!acceptedStatuses.includes(existing.orderStatus)) {
      throw new ValidationError('Order not ready for delivery assignment');
    }
    if (
      existing.dispatch?.status === 'accepted' &&
      String(existing.dispatch?.deliveryPartnerId || '') === String(deliveryPartnerId)
    ) {
      const acceptedOrder = await FoodOrder.findOne(identity)
        .populate('storeId userId');
      return acceptedOrder
        ? sanitizeOrderForExternal(acceptedOrder)
        : null;
    }
    if (
      existing.dispatch?.status === 'accepted' &&
      String(existing.dispatch?.deliveryPartnerId || '') !== String(deliveryPartnerId)
    ) {
      throw new ForbiddenError('Order already accepted by another partner');
    }

    throw new ValidationError('Order is no longer available to accept');
  }

  const responseOrder = sanitizeOrderForExternal(order);

  void (async () => {
    try {
      const rest = order.storeId;
      const userLoc = order.deliveryAddress?.location?.coordinates;
      const restLoc = rest?.location?.coordinates;

      if (restLoc?.[0] && userLoc?.[0]) {
        const polyline = await fetchPolyline(
          { lat: restLoc[1], lng: restLoc[0] },
          { lat: userLoc[1], lng: userLoc[0] },
        );

        const db = getFirebaseDB();
        if (db) {
          const orderRef = db.ref(`active_orders/${order._id.toString()}`);
          await orderRef
            .set({
              polyline,
              lat: restLoc[1],
              lng: restLoc[0],
              boy_lat: restLoc[1],
              boy_lng: restLoc[0],
              store_lat: restLoc[1],
              store_lng: restLoc[0],
              customer_lat: userLoc[1],
              customer_lng: userLoc[0],
              status: 'accepted',
              last_updated: Date.now(),
            })
            .catch((error) =>
              logger.error(`Firebase orderRef set error: ${error.message}`),
            );
        }
      }
    } catch (error) {
      logger.error(
        `Error initializing Firebase order tracking: ${error?.message || error}`,
      );
    }

    try {
      await foodTransactionService.updateTransactionRider(order._id, deliveryPartnerId);
    } catch (error) {
      logger.error(
        `Error updating delivery rider transaction for ${order._id}: ${
          error?.message || error
        }`,
      );
    }

    try {
      const io = getIO();
      if (io) {
        const payload = {
          orderMongoId: order._id?.toString?.(),
          orderId: order._id.toString(),
          orderStatus: order.orderStatus,
          dispatchStatus: order.dispatch?.status,
        };
        io.to(rooms.delivery(deliveryPartnerId)).emit('order_status_update', payload);
        io.to(rooms.store(order.storeId)).emit('order_status_update', payload);
        io.to(rooms.user(order.userId)).emit('order_status_update', payload);

        // Broadcast order_claimed to ALL online delivery partners so every popup is dismissed
        const claimedPayload = {
          orderId: order._id.toString(),
          orderMongoId: order._id?.toString?.(),
          claimedBy: deliveryPartnerId.toString(),
        };
        // 1. Global broadcast to all_delivery room — covers every online delivery boy
        io.to('all_delivery').emit('order_claimed', claimedPayload);
        logger.info(`[DeliveryDispatch] Broadcasted order_claimed globally (all_delivery room) for order ${order._id.toString()}`);

      }

      await notifyOwnerSafely(
        { ownerType: 'USER', ownerId: order.userId },
        {
          title: `Delivery partner assigned`,
          body: `A delivery partner has accepted Order #${order._id.toString()}.`,
          data: {
            type: 'delivery_accepted',
            orderId: order._id.toString(),
            orderMongoId: order._id?.toString?.() || '',
            dispatchStatus: order.dispatch?.status,
            link: '/food/user/orders',
          },
        },
      );

      await notifyOwnerSafely(
        { ownerType: 'STORE', ownerId: order.storeId },
        {
          title: `Rider assigned`,
          body: `Order #${order._id.toString()} is now assigned to a delivery partner.`,
          data: {
            type: 'delivery_accepted',
            orderId: order._id.toString(),
            orderMongoId: order._id?.toString?.() || '',
            dispatchStatus: order.dispatch?.status,
            link: '/food/store/orders',
          },
        },
      );
    } catch (error) {
      logger.error(
        `Error notifying delivery acceptance for ${order._id}: ${
          error?.message || error
        }`,
      );
    }
  })();

  enqueueOrderEvent('delivery_accepted', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
    dispatchStatus: order.dispatch?.status,
    orderStatus: order.orderStatus,
  });

  return responseOrder;
}

export async function rejectOrderDelivery(orderId, deliveryPartnerId) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');

  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  if (order.dispatch.deliveryPartnerId?.toString() !== deliveryPartnerId.toString()) {
    throw new ForbiddenError('Not your order');
  }

  const offer = order.dispatch.offeredTo.find(
    (item) =>
      String(item.partnerId) === String(deliveryPartnerId) &&
      item.action === 'offered',
  );
  if (offer) offer.action = 'rejected';

  order.dispatch.status = 'unassigned';
  order.dispatch.deliveryPartnerId = undefined;
  order.dispatch.assignedAt = undefined;
  order.dispatch.acceptedAt = undefined;
  pushStatusHistory(order, {
    byRole: 'DELIVERY_PARTNER',
    byId: deliveryPartnerId,
    from: 'assigned',
    to: 'unassigned',
    note: 'Rejected',
  });
  await order.save();

  enqueueOrderEvent('delivery_rejected', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
  });

  void dispatchService
    .tryAutoAssign(order._id)
    .catch((error) =>
      logger.error(`SmartDispatch: Auto-assign after reject failed: ${error.message}`),
    );

  return order.toObject();
}

export async function confirmReachedPickupDelivery(orderId, deliveryPartnerId) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');

  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  assertOwnLiveOrder(order, deliveryPartnerId);

  const currentPhase = order.deliveryState?.currentPhase || '';
  const currentStatus = order.deliveryState?.status || '';
  if (currentPhase === 'at_pickup' || currentStatus === 'reached_pickup') {
    throw stepConflict('Reached pickup is already marked for this order.');
  }
  if (!BEFORE_PICKUP.includes(order.orderStatus)) throw stepConflict('This order is already picked up.');
  const claimed = await claimStep(
    order,
    { orderStatus: { $in: BEFORE_PICKUP }, 'deliveryState.currentPhase': { $ne: 'at_pickup' }, 'deliveryState.status': { $ne: 'reached_pickup' } },
    { 'deliveryState.currentPhase': 'at_pickup', 'deliveryState.status': 'reached_pickup' },
  );
  if (!claimed) throw stepConflict(RACED);

  const from = currentStatus || currentPhase || order.orderStatus;
  order.deliveryState = {
    ...(order.deliveryState?.toObject?.() || order.deliveryState || {}),
    currentPhase: 'at_pickup',
    status: 'reached_pickup',
    reachedPickupAt: order.deliveryState?.reachedPickupAt || new Date(),
  };
  pushStatusHistory(order, {
    byRole: 'DELIVERY_PARTNER',
    byId: deliveryPartnerId,
    from,
    to: 'reached_pickup',
    note: 'Reached pickup location',
  });
  await order.save();

  emitOrderUpdate(order, deliveryPartnerId);

  try {
    const store = await FoodStore.findById(order.storeId)
      .select('storeName')
      .lean();
    const partner = await FoodDeliveryPartner.findById(deliveryPartnerId)
      .select('name')
      .lean();

    await notifyOwnersSafely(
      [{ ownerType: 'STORE', ownerId: order.storeId }],
      {
        title: 'Rider arrived!',
        body: `${partner?.name || 'The delivery partner'} has arrived at ${
          store?.storeName || 'your store'
        } to pick up Order #${order._id.toString()}.`,
        data: {
          type: 'rider_arrived',
          orderId: String(order._id.toString()),
          orderMongoId: String(order._id),
          partnerName: partner?.name || '',
        },
      },
    );
  } catch (error) {
    logger.error(
      `Error notifying store about rider arrival for ${order._id}: ${
        error?.message || error
      }`,
    );
  }

  enqueueOrderEvent('reached_pickup', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
    orderStatus: order.orderStatus,
    deliveryPhase: order.deliveryState?.currentPhase,
    deliveryStatus: order.deliveryState?.status,
  });
  return order.toObject();
}

export async function confirmPickupDelivery(orderId, deliveryPartnerId, billImageUrl) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');
  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  assertOwnLiveOrder(order, deliveryPartnerId);

  // Only an order the kitchen has finished (ready for pickup) can leave the store.
  const from = order.orderStatus;
  const nextStatus = 'picked_up';
  if (COMPLETE_FROM.includes(from)) throw stepConflict('This order is already picked up.');
  if (!PICKUP_FROM.includes(from)) {
    throw stepConflict('The kitchen has not finished this order yet. Pick it up once the store marks it ready.');
  }
  if (!(await claimStep(order, { orderStatus: { $in: PICKUP_FROM } }, { orderStatus: nextStatus }))) throw stepConflict(RACED);
  order.orderStatus = nextStatus;
  order.deliveryState = {
    ...(order.deliveryState?.toObject?.() || order.deliveryState || {}),
    currentPhase: 'en_route_to_delivery',
    status: 'picked_up',
    pickedUpAt: new Date(),
    billImageUrl,
  };

  // OTP should be generated/sent only when rider explicitly requests it at drop.

  pushStatusHistory(order, {
    byRole: 'DELIVERY_PARTNER',
    byId: deliveryPartnerId,
    from,
    to: 'picked_up',
    note: 'Order picked up',
  });
  await order.save();

  emitOrderUpdate(order, deliveryPartnerId);
  enqueueOrderEvent('picked_up', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
    billImageUrl: billImageUrl || null,
  });
  return order.toObject();
}

export async function confirmReachedDropDelivery(orderId, deliveryPartnerId) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');

  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  assertOwnLiveOrder(order, deliveryPartnerId);

  if (order.deliveryVerification?.dropOtp?.verified) {
    throw stepConflict("The customer's OTP is already verified. Complete the delivery.");
  }
  const alreadyAtDrop =
    order.deliveryState?.currentPhase === 'at_drop' ||
    order.deliveryState?.status === 'reached_drop';
  if (alreadyAtDrop) throw stepConflict('Reached drop is already marked; the customer already has the OTP.');
  if (order.orderStatus !== 'picked_up') throw stepConflict('Pick up the order before marking reached drop.');
  const claimed = await claimStep(
    order,
    { orderStatus: 'picked_up', 'deliveryState.currentPhase': { $ne: 'at_drop' }, 'deliveryState.status': { $ne: 'reached_drop' } },
    { 'deliveryState.currentPhase': 'at_drop', 'deliveryState.status': 'reached_drop' },
  );
  if (!claimed) throw stepConflict(RACED);

  const fromPhase =
    order.deliveryState?.status ||
    order.deliveryState?.currentPhase ||
    order.orderStatus ||
    '';

  const existingOtp = String(order.deliveryOtp || '').trim();

  if (!existingOtp) {
    order.deliveryOtp = generateFourDigitDeliveryOtp();
  }

  if (!order.deliveryVerification?.dropOtp) {
    order.deliveryVerification = {
      ...(order.deliveryVerification?.toObject?.() ||
        order.deliveryVerification ||
        {}),
      dropOtp: { required: true, verified: false },
    };
  }

  order.deliveryState = {
    ...(order.deliveryState?.toObject?.() || order.deliveryState || {}),
    currentPhase: 'at_drop',
    status: 'reached_drop',
    reachedDropAt: order.deliveryState?.reachedDropAt || new Date(),
  };

  pushStatusHistory(order, {
    byRole: 'DELIVERY_PARTNER',
    byId: deliveryPartnerId,
    from: fromPhase,
    to: 'reached_drop',
    note: 'Reached drop location',
  });

  await order.save();

  emitDeliveryDropOtpToUser(order, String(order.deliveryOtp || '').trim());
  emitOrderUpdate(order, deliveryPartnerId);
  enqueueOrderEvent('reached_drop', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
    dropOtpRequired: order.deliveryVerification?.dropOtp?.required ?? true,
    dropOtpVerified: order.deliveryVerification?.dropOtp?.verified ?? false,
  });
  return sanitizeOrderForExternal(order);
}

export async function verifyDropOtpDelivery(orderId, deliveryPartnerId, otp) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');
  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  assertOwnLiveOrder(order, deliveryPartnerId);
  if (!COMPLETE_FROM.includes(order.orderStatus)) {
    throw stepConflict("Pick up the order before verifying the customer's OTP.");
  }

  const otpStr = normalizeOtpValue(otp);
  if (!otpStr) throw new ValidationError('OTP is required');

  // Already verified: answered unchanged. The delivery app verifies in its OTP dialog and again just before completing.
  if (order.deliveryVerification?.dropOtp?.verified) {
    return { order: sanitizeOrderForExternal(order) };
  }
  if (!normalizeOtpValue(order.deliveryOtp)) {
    throw stepConflict('Mark reached drop first: that sends the customer their OTP.');
  }

  await spendDropOtpTry(order);
  if (!isOtpMatch(order.deliveryOtp, otpStr)) {
    throw new ValidationError(
      'Invalid OTP. Ask the customer for the code shown in their app.',
    );
  }

  order.deliveryVerification = {
    ...(order.deliveryVerification?.toObject?.() || order.deliveryVerification || {}),
    dropOtp: { required: true, verified: true },
  };
  order.markModified('deliveryVerification');
  await order.save();

  // OTP verification does not advance order status; suppress milestone push to avoid duplicates.
  emitOrderUpdate(order, deliveryPartnerId, { sendMilestonePush: false });
  enqueueOrderEvent('drop_otp_verified', {
    orderMongoId: order._id?.toString?.(),
    orderId: order._id.toString(),
    deliveryPartnerId,
  });
  return { order: sanitizeOrderForExternal(order) };
}

export async function completeDelivery(orderId, deliveryPartnerId, body = {}) {
  const identity = buildOrderIdentityFilter(orderId);
  if (!identity) throw new ValidationError('Order id required');
  const order = await FoodOrder.findOne(identity).select('+deliveryOtp');
  if (!order) throw new NotFoundError('Order not found');
  assertOwnLiveOrder(order, deliveryPartnerId);

  const from = order.orderStatus;
  const nextStatus = 'delivered';
  if (!COMPLETE_FROM.includes(from)) throw stepConflict('Pick up the order before completing the delivery.');

  const { otp, ratings, paymentMethod: selectedPaymentMethod } = body;

  // 1. Handover OTP: always required. Verified earlier (verify-drop-otp) or sent with this call; it exists only once
  // the rider has marked reached drop.
  if (!order.deliveryVerification?.dropOtp?.verified) {
    if (!normalizeOtpValue(order.deliveryOtp)) {
      throw stepConflict('Mark reached drop first: that sends the customer their OTP.');
    }
    if (!normalizeOtpValue(otp)) {
      throw new ValidationError(
        'Customer handover OTP is required. Verify the OTP from the customer before completing delivery.',
      );
    }
    await spendDropOtpTry(order);
    if (!isOtpMatch(order.deliveryOtp, otp)) throw new ValidationError('Invalid handover OTP provided.');
    order.deliveryVerification = {
      ...(order.deliveryVerification?.toObject?.() || order.deliveryVerification || {}),
      dropOtp: { required: true, verified: true },
    };
    order.markModified('deliveryVerification');
  }

  // 2. Financial Context Resolution
  const tx = await FoodTransaction.findOne({ orderId: order._id }).lean();
  const prevPayStatus = String(tx?.payment?.status || order?.payment?.status || 'cod_pending');
  const payMethod = String(tx?.payment?.method || order?.payment?.method || order?.paymentMethod || 'cash');

  /**
   * Final Payment Method Logic:
   * - Pay on delivery (cash, or a QR link the rider generated): the rider records how the customer paid,
   *   'qr' -> 'razorpay_qr', 'cash' -> 'cash'; otherwise the current method.
   * - Prepaid (online, wallet): the method stays, and the payment must already be verified. A rider cannot turn a
   *   prepaid order into cash.
   */
  const payOnDelivery = payMethod === 'cash' || payMethod === 'razorpay_qr';
  let finalPayMethod = payMethod;
  if (payOnDelivery && selectedPaymentMethod === 'qr') finalPayMethod = 'razorpay_qr';
  else if (payOnDelivery && selectedPaymentMethod === 'cash') finalPayMethod = 'cash';

  if (!payOnDelivery) {
    const statuses = [order.payment?.status, tx?.payment?.status, tx?.status].map((s) => String(s || '').toLowerCase());
    if (!statuses.some((s) => PAID_STATUSES.includes(s))) {
      throw new ValidationError('The online payment for this order is not verified yet. It cannot be completed until it is.');
    }
  }

  // 3. QR Payment Verification (Blocking)
  if (finalPayMethod === 'razorpay_qr') {
    const syncedPayment = await syncRazorpayQrPayment(order);
    if (String(syncedPayment?.status || '').toLowerCase() !== 'paid') {
      throw new ValidationError('Please wait for the customer to complete the QR payment. Payment not verified yet.');
    }
  }

  // Exactly once: only the request that moves the order to delivered goes on to the ledger (COD and cash limit).
  if (!(await claimStep(order, { orderStatus: { $in: COMPLETE_FROM } }, { orderStatus: nextStatus }))) {
    throw stepConflict(RACED);
  }

  // 4. Update Order State
  order.orderStatus = 'delivered';
  order.deliveryState = {
    ...(order.deliveryState?.toObject?.() || order.deliveryState || {}),
    currentPhase: 'delivered',
    status: 'delivered',
    deliveredAt: new Date(),
  };

  if (ratings) {
    order.ratings = {
      ...(order.ratings?.toObject?.() || order.ratings || {}),
      ...ratings,
    };
  }

  pushStatusHistory(order, {
    byRole: 'DELIVERY_PARTNER',
    byId: deliveryPartnerId,
    from,
    to: 'delivered',
    note: `Delivery completed using ${finalPayMethod}.`,
  });

  await order.save();

  // 5. Update Financial Ledger (FoodTransaction)
  // This triggers the sync back to FoodOrder.payment.method which updates the Rider's Cash Limit (if cash) or Pocket (always).
  const ledgerKind =
    finalPayMethod === 'cash' 
      ? 'cod_marked_paid_on_delivery' 
      : (finalPayMethod === 'razorpay_qr' ? 'cod_collect_qr_settled' : 'payment_snapshot_sync');

  await foodTransactionService.updateTransactionStatus(order._id, ledgerKind, {
    status: 'captured', // This marks payment as 'paid'
    paymentMethod: finalPayMethod,
    recordedByRole: 'DELIVERY_PARTNER',
    recordedById: deliveryPartnerId,
    note: `Rider finalized payment as ${finalPayMethod}. Order is now delivered.`,
  });

  emitOrderUpdate(order, deliveryPartnerId);

  // Cheesy Rewards: award points once for this delivered order (eligibility checked in the service).
  awardOrderPointsSafely(order._id);
  
  enqueueOrderEvent('delivery_completed', {
    orderMongoId: order._id?.toString?.(),
    orderId: order.orderId || order._id.toString(),
    deliveryPartnerId,
    payMethod: finalPayMethod,
    prevPayStatus,
    paymentStatus: 'paid'
  });

  return sanitizeOrderForExternal(order);
}
