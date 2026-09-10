import mongoose from 'mongoose';

const customerProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true
    },
    referralCode: String,
    loyaltyTier: String,
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Wallet"
    },
    defaultAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    }
}, { 
    timestamps: true,
    collection: 'customerProfiles'
});

export const CustomerProfile = mongoose.model('CustomerProfile', customerProfileSchema);
