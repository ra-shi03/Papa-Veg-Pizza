import mongoose from 'mongoose';

const foodAddressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodUser',
            required: true,
            index: true
        },
        addressType: {
            type: String,
            enum: ['Home', 'Office', 'Other'],
            default: 'Home'
        },
        houseNumber: {
            type: String,
            trim: true
        },
        street: {
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
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    {
        collection: 'food_addresses',
        timestamps: true
    }
);

export const FoodAddress = mongoose.model('FoodAddress', foodAddressSchema);
