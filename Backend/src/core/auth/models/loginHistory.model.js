import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    },
    loginAt: Date,
    logoutAt: Date,
    ipAddress: String,
    browser: String,
    os: String,
    device: String,
    status: {
        type: String,
        enum: [
            "SUCCESS",
            "FAILED",
            "LOGOUT"
        ]
    },
    location: String
}, { 
    timestamps: true,
    collection: 'loginHistories'
});

export const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
