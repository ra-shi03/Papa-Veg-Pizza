import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema({
    mobile: String,
    email: String,
    otp: String,
    purpose: {
        type: String,
        enum: [
            "LOGIN",
            "REGISTER",
            "RESET_PASSWORD",
            "CHANGE_PHONE",
            "CHANGE_EMAIL"
        ]
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: Date,
    verified: {
        type: Boolean,
        default: false
    },
    requestCount: {
        type: Number,
        default: 1
    },
    lastRequestAt: Date
}, { 
    timestamps: true,
    collection: 'otpVerifications'
});

export const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
