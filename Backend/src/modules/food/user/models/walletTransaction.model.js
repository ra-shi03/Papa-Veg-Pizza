import mongoose from 'mongoose';

export const WALLET_TX_REASONS = [
    'ORDER_REFUND',
    'ORDER_PAYMENT',
    'REFERRAL_REWARD',
    'PROMOTIONAL_CREDIT',
    'TOPUP'
];

/**
 * Permanent wallet ledger. COMPLETED rows are immutable; reversals are new compensating rows.
 * Only a PENDING reservation (checkout hold) may move to COMPLETED or RELEASED.
 * Amounts are integer paise. idempotencyKey is unique so a credit/debit can never be applied twice.
 */
const walletTransactionSchema = new mongoose.Schema(
    {
        walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletAccount', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null },
        /** Human-readable order number (e.g. FOD-…) shown in history. */
        orderRef: { type: String, default: '', trim: true },
        refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Refund', default: null },
        type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
        reason: { type: String, enum: WALLET_TX_REASONS, required: true },
        amountPaise: {
            type: Number,
            required: true,
            min: 1,
            validate: { validator: Number.isInteger, message: 'amountPaise must be an integer' }
        },
        currency: { type: String, default: 'INR', uppercase: true, trim: true },
        /** Available balance right after this transaction was applied. */
        balanceAfterPaise: { type: Number, required: true, min: 0 },
        idempotencyKey: { type: String, required: true, unique: true, trim: true },
        status: { type: String, enum: ['PENDING', 'COMPLETED', 'RELEASED'], default: 'COMPLETED' },
        description: { type: String, default: '', trim: true },
        /** Refund-provider / payment-gateway reference for reconciliation. */
        providerRef: { type: String, default: '', trim: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
        /** Only for PENDING reservations: stale holds are released after this time. */
        expiresAt: { type: Date, default: null },
        completedAt: { type: Date, default: null }
    },
    { collection: 'walletTransactions', timestamps: { createdAt: true, updatedAt: false } }
);

walletTransactionSchema.index({ walletId: 1, status: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ orderId: 1 });
walletTransactionSchema.index({ status: 1, expiresAt: 1 });

export const WalletTransaction =
    mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', walletTransactionSchema);
