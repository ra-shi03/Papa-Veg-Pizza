import mongoose from 'mongoose';

/**
 * Refund — tracks refund requests against a Payment.
 * Supports partial refunds. Gateway refund id stored once processed.
 */
const refundSchema = new mongoose.Schema(
    {
        /** Optional: many orders carry only the denormalised order.payment snapshot, not a Payment doc. */
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
            default: null,
            index: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodOrder',
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR', trim: true },

        reason: { type: String, default: '', trim: true },

        status: {
            type: String,
            enum: ['pending', 'processing', 'processed', 'failed', 'rejected'],
            default: 'pending',
            index: true
        },

        /** Original payment method → determines refund path (gateway / wallet credit) */
        refundTo: {
            type: String,
            enum: ['gateway', 'wallet'],
            default: 'wallet'
        },

        /** Refund-provider reference (Razorpay refund id) for reconciliation. */
        gatewayRefundId: { type: String, default: '', sparse: true },

        /** Who raised it: USER (customer request), SYSTEM (automatic on cancellation), ADMIN. */
        requestedBy: { type: String, enum: ['USER', 'SYSTEM', 'ADMIN'], default: 'SYSTEM' },

        /** Wallet ledger row created when a wallet refund is credited. */
        walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', default: null },

        rejectionReason: { type: String, default: '', trim: true },

        processedAt: { type: Date, default: null },
        processedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

        metadata: { type: mongoose.Schema.Types.Mixed, default: undefined }
    },
    {
        collection: 'refunds',
        timestamps: true
    }
);

refundSchema.index({ orderId: 1, status: 1 });

export const Refund = mongoose.model('Refund', refundSchema);
