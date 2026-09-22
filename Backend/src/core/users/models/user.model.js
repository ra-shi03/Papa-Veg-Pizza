import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true,       // allows multiple docs with null email
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        default: null
    },
    loginType: {
        type: String,
        enum: ["PASSWORD", "OTP", "GOOGLE", "APPLE"],
        default: "OTP"
    },
    // Quick-access hint for which role to default to on login.
    // Source of truth is always userRoles collection.
    primaryRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
        default: null
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    mobileVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'users'
});

// ─── Production Indexes ───────────────────────────────────────────────────────
// Partial indexes: only index active, non-deleted accounts — keeps index small
userSchema.index({ email: 1, isDeleted: 1 }, { name: 'idx_email_active' });
userSchema.index({ mobile: 1, isDeleted: 1 }, { name: 'idx_mobile_active' });
userSchema.index({ primaryRole: 1, isActive: 1, isDeleted: 1 }, { name: 'idx_role_active' });
userSchema.index({ isActive: 1, isDeleted: 1 });

userSchema.pre('save', async function (next) {
    // Password hashing has been moved to controllers to prevent double-hashing issues.
    return next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// ─── Account Lockout Helpers ──────────────────────────────────────────────────
userSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementFailedLogin = async function() {
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
        this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    return this.save();
};

userSchema.methods.resetFailedLogin = async function() {
    if (this.failedLoginAttempts > 0 || this.lockUntil) {
        this.failedLoginAttempts = 0;
        this.lockUntil = null;
        return this.save();
    }
};

export const User = mongoose.model('User', userSchema);
