import mongoose from 'mongoose';

// One record per payout between two levels of the business. Money comes in to the super admin (online payments and
// riders' cash deposits) and goes down by hand:
//   franchise_payout  super admin     -> franchise admin   (the franchise asks)
//   store_payout      franchise admin -> store            (the store manager asks)
//   rider_withdrawal  store manager   -> rider            (the rider asks; one request per store the rider delivered for)
//   staff_salary      store manager   -> kitchen staff    (the manager records it, or the staff member asks once it is overdue)
//
// Rules that keep it honest (payout.service.js enforces them):
//   - the amount asked for is never more than the balance the server works out from delivered orders;
//   - one open request per payee and payer at a time (activeKey is unique), so two requests sent together cannot both pass;
//   - pending -> paid (with the bank / UPI reference) or rejected (with a reason), once; a paid one can only be reversed by a
//     dispute decided one level up;
//   - the payee's bank details are copied from their saved profile when they ask, never taken from the request.

const STATUSES = ['pending', 'paid', 'rejected', 'reversed'];

const actorSchema = new mongoose.Schema(
    {
        role: { type: String, default: '' },
        userId: { type: mongoose.Schema.Types.ObjectId, default: null },
        name: { type: String, default: '' },
        at: { type: Date, default: null },
    },
    { _id: false }
);

const bankSnapshotSchema = new mongoose.Schema(
    {
        accountHolderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' },
        upiId: { type: String, default: '' },
    },
    { _id: false }
);

const payoutSchema = new mongoose.Schema(
    {
        kind: { type: String, enum: ['franchise_payout', 'store_payout', 'rider_withdrawal', 'staff_salary'], required: true, index: true },
        // who receives the money
        payeeType: { type: String, enum: ['franchise', 'store', 'rider', 'staff'], required: true },
        payeeId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        payeeName: { type: String, default: '' },
        // who pays it: the platform (super admin), a franchise or a store
        payerType: { type: String, enum: ['platform', 'franchise', 'store'], required: true },
        payerId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
        // where it belongs, for scoping every list and action
        franchiseId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
        storeId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
        // staff salary: the month it is for ('YYYY-MM') and the staff member's login (for notifications)
        period: { type: String, default: '' },
        staffUserId: { type: mongoose.Schema.Types.ObjectId, default: null },

        amount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: STATUSES, default: 'pending', index: true },
        origin: { type: String, enum: ['request', 'recorded'], default: 'request' },
        note: { type: String, default: '', maxlength: 500 },

        bank: { type: bankSnapshotSchema, default: () => ({}) },
        requestedBy: { type: actorSchema, default: () => ({}) },

        payment: {
            method: { type: String, enum: ['', 'bank_transfer', 'upi', 'cash'], default: '' },
            reference: { type: String, default: '' },          // UTR / UPI reference / cash receipt number
            referenceKey: { type: String, default: '' },       // reference normalised, for the reuse check
            proofUrl: { type: String, default: '' },
            paidAt: { type: Date, default: null },
            paidBy: { type: actorSchema, default: () => ({}) },
        },
        rejection: {
            reason: { type: String, default: '' },
            at: { type: Date, default: null },
            by: { type: actorSchema, default: () => ({}) },
        },
        // "Not received": the payee says a paid payout never arrived; decided one level up
        dispute: {
            status: { type: String, enum: ['none', 'open', 'resolved'], default: 'none', index: true },
            note: { type: String, default: '' },
            raisedAt: { type: Date, default: null },
            outcome: { type: String, enum: ['', 'paid_confirmed', 'not_paid'], default: '' },
            resolution: { type: String, default: '' },
            resolvedAt: { type: Date, default: null },
            resolvedBy: { type: actorSchema, default: () => ({}) },
        },
        activity: [{
            _id: false,
            at: { type: Date, default: Date.now },
            action: { type: String, default: '' },
            byRole: { type: String, default: '' },
            byName: { type: String, default: '' },
            note: { type: String, default: '' },
        }],

        // Set while a request is open (and, for a salary, while it is paid): unique, so there is never a second open
        // request for the same payee and payer, nor two salaries for one month. Absent otherwise (sparse index).
        activeKey: { type: String },
    },
    { collection: 'food_payouts', timestamps: true }
);

payoutSchema.index({ activeKey: 1 }, { unique: true, sparse: true });
payoutSchema.index({ kind: 1, payeeId: 1, createdAt: -1 });
payoutSchema.index({ payerType: 1, payerId: 1, status: 1, createdAt: -1 });
// a bank / UPI reference proves one payment only: the same payer cannot use it for two payouts
payoutSchema.index(
    { payerType: 1, payerId: 1, 'payment.referenceKey': 1 },
    { unique: true, partialFilterExpression: { 'payment.referenceKey': { $gt: '' } } }
);

export const PAYOUT_STATUSES = STATUSES;
export const FoodPayout = mongoose.model('FoodPayout', payoutSchema);
