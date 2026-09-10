import mongoose from 'mongoose';

const storeCommissionSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            required: true,
            unique: true,
            index: true
        },
        defaultCommission: {
            type: {
                type: String,
                enum: ['percentage', 'amount'],
                default: 'percentage'
            },
            value: { type: Number, default: 0 }
        },
        notes: { type: String, trim: true, default: '' },
        status: { type: Boolean, default: true, index: true }
    },
    { collection: 'food_store_commissions', timestamps: true }
);


export const FoodStoreCommission = mongoose.model('FoodStoreCommission', storeCommissionSchema);

