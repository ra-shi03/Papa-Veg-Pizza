import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    token: {
        type: String,
        required: true
    },
    deviceId: {
        type: String
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    collection: 'refreshTokens'
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
