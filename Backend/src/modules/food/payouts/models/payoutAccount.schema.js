import mongoose from 'mongoose';

// Where a store, a franchise or a kitchen staff member is paid. Riders keep their own bank fields on the partner record.
// changedAt is set whenever an existing account is changed: payouts are held for 24 hours after a change, so someone who
// takes over a login cannot redirect a payout straight away.
export const payoutAccountSchema = new mongoose.Schema(
    {
        accountHolderName: { type: String, trim: true, default: '' },
        accountNumber: { type: String, trim: true, default: '' },
        ifscCode: { type: String, trim: true, uppercase: true, default: '' },
        bankName: { type: String, trim: true, default: '' },
        upiId: { type: String, trim: true, default: '' },
        changedAt: { type: Date, default: null },
        updatedAt: { type: Date, default: null },
    },
    { _id: false }
);
