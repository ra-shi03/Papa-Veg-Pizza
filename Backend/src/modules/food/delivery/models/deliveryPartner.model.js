import mongoose from 'mongoose';

const normalizeRatingValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(5, Number(numeric.toFixed(1))));
};

const deliveryPartnerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        email: { type: String, trim: true },
        password: { type: String },
        franchiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodFranchise',
            default: null,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            default: null,
            index: true
        },
        countryCode: {
            type: String,
            default: '+91'
        },
        address: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        vehicleType: {
            type: String
        },
        vehicleName: {
            type: String
        },
        vehicleNumber: {
            type: String,
            unique: true,
            sparse: true
        },
        panNumber: {
            type: String
        },
        aadharNumber: {
            type: String
        },
        drivingLicenseNumber: {
            type: String,
            trim: true
        },
        profilePhoto: {
            type: String
        },
        fcmTokens: {
            type: [String],
            default: []
        },
        fcmTokenMobile: {
            type: [String],
            default: []
        },
        aadharPhoto: {
            type: String
        },
        panPhoto: {
            type: String
        },
        drivingLicensePhoto: {
            type: String
        },
        // Collected at signup for the franchise admin to verify: the vehicle's registration certificate and insurance
        // (not asked for a bicycle) and a proof of address.
        vehicleRcPhoto: {
            type: String
        },
        vehicleInsurancePhoto: {
            type: String
        },
        addressProofPhoto: {
            type: String
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'suspended'],
            default: 'pending'
        },
        priorityRouting: {
            type: Boolean,
            default: false
        },
        rejectionReason: { type: String },
        rejectedAt: { type: Date },
        // Approval by a franchise admin (the first franchise to approve claims the rider: franchiseId is set then)
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        suspendedAt: { type: Date, default: null },
        suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        suspensionReason: { type: String, default: '' },
        // Audit trail of approval decisions (there is no shared audit log): who did what, from which franchise, when
        approvalHistory: [{
            _id: false,
            action: { type: String, enum: ['approved', 'rejected', 'suspended', 'activated'] },
            byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            byRole: { type: String },
            franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null },
            reason: { type: String, default: '' },
            at: { type: Date, default: Date.now }
        }],
        approvedAt: { type: Date },
        bankAccountHolderName: { type: String },
        bankAccountNumber: { type: String },
        bankIfscCode: { type: String },
        bankName: { type: String },
        upiId: { type: String },
        // When saved bank / UPI details were last changed (not their first entry): withdrawals wait 24 hours after it
        payoutDetailsChangedAt: { type: Date, default: null },
        upiQrCode: { type: String },
        availabilityStatus: {
            type: String,
            enum: ['online', 'offline'],
            default: 'offline'
        },
        lastLocation: {
            type: { type: String, enum: ['Point'] },
            coordinates: { type: [Number] }
        },
        lastLat: { type: Number },
        lastLng: { type: Number },
        lastLocationAt: { type: Date },
        referralCode: { type: String, index: true },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodDeliveryPartner',
            default: null,
            index: true
        },
        referralCount: { type: Number, default: 0, min: 0 },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            set: normalizeRatingValue
        },
        totalRatings: { type: Number, default: 0, min: 0 },
        walletAmount: { type: Number, default: 0 },
        totalDeliveries: { type: Number, default: 0 }
    },
    {
        collection: 'food_delivery_partners',
        timestamps: true
    }
);

// Indices
deliveryPartnerSchema.index({ lastLocation: '2dsphere' });

// Changing where the rider is paid (bank account, IFSC or UPI) stamps payoutDetailsChangedAt, on every save path, so a
// withdrawal cannot be sent to new details within 24 hours of the change. Filling them in for the first time does not.
const PAYOUT_FIELDS = ['bankAccountNumber', 'bankIfscCode', 'upiId'];
deliveryPartnerSchema.pre('save', async function stampPayoutChange() {
    if (this.isNew || !PAYOUT_FIELDS.some((f) => this.isModified(f))) return;
    const before = await this.constructor.findById(this._id).select(PAYOUT_FIELDS.join(' ')).lean();
    const changed = before && PAYOUT_FIELDS.some((f) => String(before[f] || '').trim() && String(before[f] || '').trim() !== String(this[f] || '').trim());
    if (changed) this.payoutDetailsChangedAt = new Date();
});

export const FoodDeliveryPartner = mongoose.model('FoodDeliveryPartner', deliveryPartnerSchema);

