import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    refreshTokenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RefreshToken"
    },
    activeRoleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
    },
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Franchise"
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    device: String,
    browser: String,
    os: String,
    ipAddress: String,
    lastActivity: Date,
    expiresAt: Date,
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    collection: 'userSessions'
});

export const UserSession = mongoose.model('UserSession', userSessionSchema);
