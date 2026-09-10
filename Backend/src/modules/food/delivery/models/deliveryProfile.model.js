import mongoose from 'mongoose';

const deliveryProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true
    },
    vehicleType: String,
    vehicleNumber: String,
    drivingLicense: String,
    aadhaarNumber: String,
    currentStoreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    isOnline: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    collection: 'deliveryProfiles'
});

export const DeliveryProfile = mongoose.model('DeliveryProfile', deliveryProfileSchema);
