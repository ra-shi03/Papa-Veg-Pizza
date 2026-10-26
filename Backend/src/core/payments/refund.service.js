import mongoose from 'mongoose';
import { Refund } from './models/refund.model.js';
import { Payment } from './models/payment.model.js';
import { FoodOrder } from '../../modules/food/orders/models/order.model.js';
import { buildOrderIdentityFilter } from '../../modules/food/orders/services/order.helpers.js';
import { ValidationError, NotFoundError } from '../auth/errors.js';
import {
    creditWallet,
    rupeesToPaise,
    paiseToRupees,
    getOrderWalletRefundedPaise
} from '../../modules/food/user/services/walletLedger.service.js';
import { reverseOrderPointsSafely } from '../../modules/food/user/services/rewards.service.js';
import { getRazorpayInstance, isRazorpayConfigured, initiateRazorpayRefund } from '../../modules/food/orders/helpers/razorpay.helper.js';
import { logger } from '../../utils/logger.js';

/**
 * Refund workflow (trusted backend only).
 *
 * - The refund destination is always respected: a 'gateway' (original payment method) refund
 *   never touches the wallet, and a 'wallet' refund is credited to the wallet exactly once.
 * - Wallet credits go through walletLedger.creditWallet with an idempotency key and are capped at the
 *   refundable amount of the order, so no combination of flows can over-refund.
 * - Every refund (automatic on cancellation, or customer-requested) is recorded in `refunds`
 *   with destination + provider reference for reconciliation.
 */

const orderRefOf = (order) => order?.order_id || order?.orderId || String(order?._id || '');

/** Sum of gateway refunds already processed for an order (paise). */
async function getGatewayRefundedPaise(orderOid) {
    const rows = await Refund.find({ orderId: orderOid, refundTo: 'gateway', status: 'processed' })
        .select('amount')
        .lean();
    return rows.reduce((sum, r) => sum + rupeesToPaise(r.amount), 0);
}

/** How much of the order can still be refunded to the wallet (paise). */
async function getWalletRefundCapPaise(order) {
    const totalPaise = rupeesToPaise(order?.pricing?.total || 0);
    const gatewayPaise = await getGatewayRefundedPaise(order._id);
    return Math.max(0, totalPaise - gatewayPaise);
}

async function getRemainingRefundablePaise(order) {
    const totalPaise = rupeesToPaise(order?.pricing?.total || 0);
    const [walletPaise, gatewayPaise] = await Promise.all([
        getOrderWalletRefundedPaise(order._id),
        getGatewayRefundedPaise(order._id)
    ]);
    return Math.max(0, totalPaise - walletPaise - gatewayPaise);
}

/**
 * Automatic wallet refund for a cancelled order (user cancel with wallet destination, wallet-paid
 * order cancelled by user/store). Idempotent per order.
 * @returns {{ amount:number, transaction:object, duplicate:boolean }}
 */
export async function refundCancelledOrderToWallet(order, { description, reason = 'Order cancelled', amount } = {}) {
    if (!order?._id || !order?.userId) throw new ValidationError('Order not found');
    // `amount` lets a caller refund less than the total (e.g. after a cancellation fee); it can never exceed it.
    const refundRupees = Math.min(Number(amount ?? order.pricing?.total) || 0, Number(order.pricing?.total) || 0);
    const amountPaise = rupeesToPaise(refundRupees);
    if (!(amountPaise > 0)) throw new ValidationError('Nothing to refund for this order');

    const { transaction, duplicate } = await creditWallet({
        userId: order.userId,
        amountPaise,
        reason: 'ORDER_REFUND',
        idempotencyKey: `order:${order._id}:cancel-refund:wallet-credit`,
        orderId: order._id,
        orderRef: orderRefOf(order),
        description: description || `Refund for cancelled order #${orderRefOf(order)}`,
        maxOrderRefundPaise: await getWalletRefundCapPaise(order)
    });

    await Refund.findOneAndUpdate(
        { orderId: order._id, refundTo: 'wallet', requestedBy: 'SYSTEM' },
        {
            $set: {
                status: 'processed',
                processedAt: transaction.completedAt || new Date(),
                walletTransactionId: transaction._id
            },
            $setOnInsert: {
                userId: order.userId,
                amount: paiseToRupees(transaction.amountPaise),
                currency: order.pricing?.currency || 'INR',
                reason
            }
        },
        { upsert: true }
    );

    reverseOrderPointsSafely(order._id, 'Points reversed: order refunded');
    return { amount: paiseToRupees(transaction.amountPaise), transaction, duplicate };
}

/** Audit record for an automatic refund to the original payment method (Razorpay). Never touches the wallet. */
export async function recordGatewayRefund(order, { status, gatewayRefundId = '', amount, reason = 'Order cancelled', error } = {}) {
    try {
        await Refund.create({
            orderId: order._id,
            userId: order.userId,
            amount: Number(amount ?? order.pricing?.total) || 0,
            currency: order.pricing?.currency || 'INR',
            reason,
            status: status === 'processed' ? 'processed' : 'failed',
            refundTo: 'gateway',
            requestedBy: 'SYSTEM',
            gatewayRefundId: gatewayRefundId || '',
            processedAt: status === 'processed' ? new Date() : null,
            metadata: error ? { error } : undefined
        });
        if (status === 'processed') reverseOrderPointsSafely(order._id, 'Points reversed: order refunded');
    } catch (err) {
        logger.error(`[Refund] Could not record gateway refund for order ${order?._id}: ${err.message}`);
    }
}

function formatRefund(refund) {
    return {
        id: String(refund._id),
        orderId: refund.orderId ? String(refund.orderId) : null,
        amount: Number(refund.amount) || 0,
        currency: refund.currency || 'INR',
        reason: refund.reason || '',
        status: refund.status,
        destination: refund.refundTo === 'gateway' ? 'source' : 'wallet',
        requestedBy: refund.requestedBy,
        gatewayRefundId: refund.gatewayRefundId || '',
        rejectionReason: refund.rejectionReason || '',
        processedAt: refund.processedAt || null,
        createdAt: refund.createdAt
    };
}

/**
 * Customer refund request. Creates a PENDING record only — no money moves until a trusted
 * admin approval (approveRefund). Ownership is enforced from the authenticated userId.
 */
export async function requestRefund({ userId, orderId, reason = '', destination = 'wallet', amount }) {
    const identity = buildOrderIdentityFilter(orderId);
    if (!identity) throw new ValidationError('orderId is required');
    if (!mongoose.isValidObjectId(String(userId || ''))) throw new ValidationError('User not found');

    const order = await FoodOrder.findOne({ ...identity, userId: new mongoose.Types.ObjectId(String(userId)) }).lean();
    if (!order) throw new NotFoundError('Order not found');

    const method = String(order.payment?.method || '').toLowerCase();
    const paymentStatus = String(order.payment?.status || '').toLowerCase();
    if (paymentStatus !== 'paid') throw new ValidationError('Only paid orders can be refunded');

    const status = String(order.orderStatus || '');
    if (status !== 'delivered' && !status.startsWith('cancelled')) {
        throw new ValidationError('A refund can be requested once the order is delivered or cancelled');
    }

    const wantsSource = String(destination || '').toLowerCase() === 'source';
    if (wantsSource && method !== 'razorpay') {
        throw new ValidationError('This order can only be refunded to your wallet');
    }
    const refundTo = wantsSource ? 'gateway' : 'wallet';

    if (await Refund.exists({ orderId: order._id, status: { $in: ['pending', 'processing'] } })) {
        throw new ValidationError('A refund request for this order is already in progress');
    }

    const remainingPaise = await getRemainingRefundablePaise(order);
    if (remainingPaise <= 0) throw new ValidationError('This order has already been fully refunded');

    const requestedPaise = amount == null || amount === '' ? remainingPaise : rupeesToPaise(amount);
    if (!Number.isInteger(requestedPaise) || requestedPaise <= 0) throw new ValidationError('Invalid refund amount');
    if (requestedPaise > remainingPaise) {
        throw new ValidationError(`Refund amount cannot exceed ₹${paiseToRupees(remainingPaise)}`);
    }

    const refund = await Refund.create({
        orderId: order._id,
        userId: order.userId,
        amount: paiseToRupees(requestedPaise),
        currency: order.pricing?.currency || 'INR',
        reason: String(reason || '').slice(0, 500),
        status: 'pending',
        refundTo,
        requestedBy: 'USER'
    });
    logger.info(`[Refund] REQUESTED ${refund._id} order=${order._id} user=${userId} to=${refundTo}`);
    return formatRefund(refund.toObject());
}

export async function getRefundForUser(userId, refundId) {
    if (!mongoose.isValidObjectId(String(refundId || ''))) throw new NotFoundError('Refund not found');
    if (!mongoose.isValidObjectId(String(userId || ''))) throw new NotFoundError('Refund not found');
    const refund = await Refund.findOne({
        _id: new mongoose.Types.ObjectId(String(refundId)),
        userId: new mongoose.Types.ObjectId(String(userId))
    }).lean();
    if (!refund) throw new NotFoundError('Refund not found');
    return formatRefund(refund);
}

export async function listRefundsForUser(userId, { page = 1, limit = 20 } = {}) {
    if (!mongoose.isValidObjectId(String(userId || ''))) throw new ValidationError('User not found');
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const filter = { userId: new mongoose.Types.ObjectId(String(userId)) };
    const [rows, total] = await Promise.all([
        Refund.find(filter).sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit).lean(),
        Refund.countDocuments(filter)
    ]);
    return { refunds: rows.map(formatRefund), total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

/**
 * Keep the denormalised order.payment snapshot in sync after a refund is processed.
 * Targeted $set (no full-document validation/hooks); a failure here never undoes a processed refund.
 */
async function syncOrderRefundSnapshot(orderOid, refund) {
    try {
        const order = await FoodOrder.findById(orderOid).select('pricing payment').lean();
        if (!order?.payment) return;
        const fullyRefunded = (await getRemainingRefundablePaise(order)) <= 0;
        const set = {
            'payment.refund': {
                status: 'processed',
                destination: refund.refundTo === 'gateway' ? 'source' : 'wallet',
                amount: Number(refund.amount) || 0,
                refundId: refund.gatewayRefundId || String(refund._id),
                processedAt: refund.processedAt || new Date()
            }
        };
        if (fullyRefunded) set['payment.status'] = 'refunded';
        await FoodOrder.updateOne({ _id: order._id }, { $set: set });
        if (fullyRefunded) reverseOrderPointsSafely(order._id, 'Points reversed: order refunded');
    } catch (err) {
        logger.error(`[Refund] Order snapshot sync failed for order ${orderOid}: ${err.message}`);
    }
}

/**
 * Approve a pending refund and move the money (admin/trusted workflow only).
 * The pending → processing claim is atomic, so two approvals can never both pay out.
 */
export async function approveRefund(refundId, { adminId } = {}) {
    if (!mongoose.isValidObjectId(String(refundId || ''))) throw new NotFoundError('Refund not found');
    const refund = await Refund.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(String(refundId)), status: 'pending' },
        { $set: { status: 'processing', processedBy: adminId && mongoose.isValidObjectId(String(adminId)) ? new mongoose.Types.ObjectId(String(adminId)) : null } },
        { new: true }
    );
    if (!refund) {
        const existing = await Refund.findById(refundId).lean();
        if (!existing) throw new NotFoundError('Refund not found');
        throw new ValidationError(`Refund is already ${existing.status}`);
    }

    const order = await FoodOrder.findById(refund.orderId).lean();
    try {
        if (!order) throw new ValidationError('Order not found');

        if (refund.refundTo === 'wallet') {
            const { transaction } = await creditWallet({
                userId: refund.userId,
                amountPaise: rupeesToPaise(refund.amount),
                reason: 'ORDER_REFUND',
                idempotencyKey: `refund:${refund._id}:wallet-credit`,
                orderId: refund.orderId,
                orderRef: orderRefOf(order),
                refundId: refund._id,
                description: `Refund credited for order #${orderRefOf(order)}`,
                maxOrderRefundPaise: await getWalletRefundCapPaise(order)
            });
            refund.walletTransactionId = transaction._id;
        } else {
            const gatewayPaymentId = order.payment?.razorpay?.paymentId;
            if (String(order.payment?.method) !== 'razorpay' || !gatewayPaymentId) {
                throw new ValidationError('Original payment reference not found for a source refund');
            }
            const result = await initiateRazorpayRefund(gatewayPaymentId, refund.amount);
            if (!result?.success) throw new ValidationError(result?.error || 'Payment gateway refund failed');
            refund.gatewayRefundId = result.refundId || '';
        }

    } catch (err) {
        refund.status = 'failed';
        refund.metadata = { ...(refund.metadata || {}), error: err.message };
        await refund.save();
        logger.error(`[Refund] FAILED ${refund._id}: ${err.message}`);
        throw err;
    }

    refund.status = 'processed';
    refund.processedAt = new Date();
    await refund.save();
    await syncOrderRefundSnapshot(refund.orderId, refund);
    logger.info(`[Refund] APPROVED ${refund._id} to=${refund.refundTo} by=${adminId || 'system'}`);
    return formatRefund(refund.toObject());
}

export async function rejectRefund(refundId, { adminId, reason = '' } = {}) {
    if (!mongoose.isValidObjectId(String(refundId || ''))) throw new NotFoundError('Refund not found');
    const refund = await Refund.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(String(refundId)), status: 'pending' },
        {
            $set: {
                status: 'rejected',
                rejectionReason: String(reason || '').slice(0, 500),
                processedAt: new Date(),
                processedBy: adminId && mongoose.isValidObjectId(String(adminId)) ? new mongoose.Types.ObjectId(String(adminId)) : null
            }
        },
        { new: true }
    ).lean();
    if (!refund) {
        const existing = await Refund.findById(refundId).lean();
        if (!existing) throw new NotFoundError('Refund not found');
        throw new ValidationError(`Refund is already ${existing.status}`);
    }
    logger.info(`[Refund] REJECTED ${refund._id} by=${adminId || 'system'}`);
    return formatRefund(refund);
}

/**
 * Initiate a refund for a Payment document (queue processor path).
 * Destination defaults to the original method: wallet-paid → wallet, otherwise → gateway.
 */
export async function initiateRefund({ paymentId, orderId, userId, amount, reason = '', refundTo }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'success') throw new Error('Can only refund successful payments');

    const to = refundTo || (payment.method === 'wallet' ? 'wallet' : 'gateway');
    const refund = await Refund.create({
        paymentId: new mongoose.Types.ObjectId(paymentId),
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : payment.orderId,
        userId: userId ? new mongoose.Types.ObjectId(userId) : payment.userId,
        amount: Number(amount) || payment.amount,
        currency: payment.currency || 'INR',
        reason,
        status: 'pending',
        refundTo: to,
        requestedBy: 'SYSTEM'
    });

    if (to === 'wallet') {
        try {
            const order = await FoodOrder.findById(refund.orderId).lean();
            const { transaction } = await creditWallet({
                userId: refund.userId,
                amountPaise: rupeesToPaise(refund.amount),
                reason: 'ORDER_REFUND',
                idempotencyKey: `refund:${refund._id}:wallet-credit`,
                orderId: refund.orderId,
                orderRef: orderRefOf(order),
                refundId: refund._id,
                description: 'Refund for order',
                maxOrderRefundPaise: order ? await getWalletRefundCapPaise(order) : rupeesToPaise(payment.amount)
            });

            refund.walletTransactionId = transaction._id;
            refund.status = 'processed';
            refund.processedAt = new Date();
            await refund.save();

            payment.status = 'refunded';
            await payment.save();
            logger.info(`Refund processed (wallet): ${refund._id} amount=${refund.amount}`);
        } catch (err) {
            refund.status = 'failed';
            refund.metadata = { error: err.message };
            await refund.save();
            throw err;
        }
    }

    return refund.toObject();
}

/**
 * Process a gateway refund (Razorpay) for a pending refund record.
 * Never falls back to the wallet: the customer's chosen destination must be respected.
 */
export async function processGatewayRefund(refundId) {
    const refund = await Refund.findById(refundId);
    if (!refund) throw new Error('Refund not found');
    if (refund.status === 'processed') return refund.toObject();
    if (refund.refundTo !== 'gateway') throw new Error('Refund is not a gateway refund');

    const payment = refund.paymentId ? await Payment.findById(refund.paymentId) : null;
    if (!payment) throw new Error('Payment not found');

    if (payment.gateway !== 'razorpay' || !payment.gatewayPaymentId || !isRazorpayConfigured()) {
        refund.status = 'failed';
        refund.metadata = { error: 'Payment gateway unavailable for this refund' };
        await refund.save();
        throw new Error('Payment gateway unavailable for this refund');
    }

    try {
        const instance = getRazorpayInstance();
        const rzRefund = await instance.payments.refund(payment.gatewayPaymentId, {
            amount: Math.round(refund.amount * 100), // paise
            speed: 'normal'
        });

        refund.gatewayRefundId = rzRefund.id;
        refund.status = 'processed';
        refund.processedAt = new Date();
        await refund.save();

        payment.status = 'refunded';
        await payment.save();

        logger.info(`Gateway refund processed: ${refundId} gatewayRefundId=${rzRefund.id}`);
    } catch (err) {
        refund.status = 'failed';
        refund.metadata = { error: err.message };
        await refund.save();
        throw err;
    }

    return refund.toObject();
}

/**
 * Get refunds for an order.
 */
export async function getRefundsByOrder(orderId) {
    return Refund.find({ orderId: new mongoose.Types.ObjectId(orderId) })
        .sort({ createdAt: -1 })
        .lean();
}

/**
 * List refunds with filters.
 */
export async function listRefunds({ status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
        Refund.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Refund.countDocuments(filter)
    ]);

    return { refunds: docs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
