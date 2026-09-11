import mongoose from 'mongoose';

const franchiseSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        ownerName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        gstNumber: {
            type: String,
            trim: true,
            default: ''
        },
        panNumber: {
            type: String,
            trim: true,
            default: ''
        },
        address: {
            type: String,
            trim: true,
            default: ''
        },
        pincode: {
            type: String,
            trim: true,
            default: ''
        },
        franchiseCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        regionId: { type: String, trim: true, default: '' },
        zoneId: { type: String, trim: true, default: '' },
        territoryId: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        gender: { type: String, trim: true, default: '' },
        alternatePhone: { type: String, trim: true, default: '' },
        dob: { type: Date, default: null },
        type: {
            type: String,
            enum: ['Single Store', 'Multi Store'],
            default: 'Single Store'
        },
        totalStores: {
            type: Number,
            default: 1
        },
        franchiseDuration: {
            type: Number,
            default: 3
        },
        franchiseCost: {
            type: Number,
            default: 0
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        dueAmount: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        // References the User who owns/manages this franchise.
        // This is the auth identity link — populated after user account creation.
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        // References the Super Admin User who created this franchise record.
        // Changed from FoodAdmin ref to User ref — single source of identity.
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    {
        collection: 'food_franchises',
        timestamps: true
    }
);

// ─── Production Indexes ───────────────────────────────────────────────────────
// Note: franchiseCode and email already have unique:true on field definition
// Only add indexes not already covered by unique constraints
franchiseSchema.index({ isActive: 1, createdAt: -1 });
franchiseSchema.index({ ownerUserId: 1 }, { sparse: true });

export const FoodFranchise = mongoose.model('FoodFranchise', franchiseSchema);
