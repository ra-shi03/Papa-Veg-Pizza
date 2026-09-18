import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
    {
        franchiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodFranchise',
            required: true,
            index: true
        },
        storeName: {
            type: String,
            required: true,
            trim: true
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        pincode: {
            type: String,
            required: true,
            trim: true
        },
        latitude: {
            type: Number
        },
        longitude: {
            type: Number
        },
        storeType: {
            type: String,
            required: true,
            default: 'DELIVERY_CARRYOUT'
        },
        fulfillmentModes: [{
            type: String
        }],
        regionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRegion'
        },
        zoneId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodZone'
        },
        territoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodTerritory'
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        approvalStatus: {
            type: String,
            enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Changes Requested'],
            default: 'Draft',
            index: true
        },
        rejectionReason: {
            type: String,
            default: null
        },
        rejectionNotes: {
            type: String,
            default: null
        },
        changesInstructions: {
            type: String,
            default: null
        },
        changesNotes: {
            type: String,
            default: null
        },
        changesDeadline: {
            type: Date,
            default: null
        },
        submittedAt: {
            type: Date,
            default: null
        },
        approvedAt: {
            type: Date,
            default: null
        },
        documents: [{
            type: { type: String, required: true },
            name: { type: String, required: true },
            url: { type: String, required: true },
            isVerified: { type: Boolean, default: false },
            uploadedAt: { type: Date, default: Date.now }
        }]
    },
    {
        collection: 'food_stores',
        timestamps: true
    }
);

export const FoodStore = mongoose.model('FoodStore', storeSchema);
