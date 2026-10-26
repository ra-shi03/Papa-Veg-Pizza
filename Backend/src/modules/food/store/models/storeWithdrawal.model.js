import mongoose from 'mongoose';

// A store's payout request, reviewed by the super admin (admin.service getWithdrawals / updateWithdrawalStatus).
// Mirrors FoodDeliveryWithdrawal. Payouts themselves are on the deferred finance list; this model exists so the
// admin code that already reads it (withdrawal list, sidebar badges, store deletion) works instead of throwing.
const storeWithdrawalSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        amount: { type: Number, required: true, min: [1, 'Minimum withdrawal amount is ₹1'] },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
        paymentMethod: { type: String, default: 'bank_transfer' },
        adminNote: String,
        rejectionReason: String,
        transactionId: String, // bank reference entered by the admin
        processedAt: Date
    },
    { collection: 'food_store_withdrawals', timestamps: true }
);

export const FoodStoreWithdrawal = mongoose.model('FoodStoreWithdrawal', storeWithdrawalSchema);
