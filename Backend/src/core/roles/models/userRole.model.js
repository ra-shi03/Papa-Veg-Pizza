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
        ref: "FoodFranchise",
        default: null
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodStore",
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
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

// ─── Production Indexes ───────────────────────────────────────────────────────
// Compound unique index: prevents duplicate role assignments for the same
// user + role + franchise + store combination (the source of truth for authorization)
userRoleSchema.index(
    { userId: 1, roleId: 1, franchiseId: 1, storeId: 1 },
    { unique: true, name: 'uq_user_role_franchise_store' }
);

// Efficient lookup: "give me all active roles for this user"
userRoleSchema.index({ userId: 1, status: 1 });

// Efficient lookup: "give me all users assigned to this franchise"
userRoleSchema.index({ franchiseId: 1, status: 1 });

// Efficient lookup: "give me all users assigned to this store"
userRoleSchema.index({ storeId: 1, status: 1 });

export const UserRole = mongoose.model('UserRole', userRoleSchema);
