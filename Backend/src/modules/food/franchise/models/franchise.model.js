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
        address: {
            type: String,
            trim: true,
            default: ''
        },
        franchiseCode: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        regionId: { type: String, trim: true, default: '' },
        zoneId: { type: String, trim: true, default: '' },
        territoryId: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin',
            default: null
        }
    },
    {
        collection: 'food_franchises',
        timestamps: true
    }
);

export const FoodFranchise = mongoose.model('FoodFranchise', franchiseSchema);
