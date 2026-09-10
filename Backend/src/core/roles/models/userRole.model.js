import mongoose from 'mongoose';

const userRoleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    roleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        required: true
    },
    franchiseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Franchise",
        default: null
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["ACTIVE", "SUSPENDED", "REMOVED"],
        default: "ACTIVE"
    }
}, { 
    timestamps: true,
    collection: 'userRoles'
});

export const UserRole = mongoose.model('UserRole', userRoleSchema);
