import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../../../config/env.js';
import { isBcryptHash } from '../../../utils/password.js';

const userSchema = new mongoose.Schema({

    mobile: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Login identifier for admin-panel accounts (customers sign in by mobile + OTP and have none).
    // Without this path Mongoose's strict mode silently drops `email` from User.create(), so staff
    // accounts could never be found by the email login.
    email: {
        type: String,
        unique: true,
        sparse: true,       // allows many accounts with no email
        trim: true,
        lowercase: true
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
    },
    addresses: [{
        label: { type: String, default: 'Home' },
        street: { type: String, default: '' },
        additionalDetails: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        phone: { type: String, default: '' },
        recipientName: { type: String, default: '' },
        recipientPhone: { type: String, default: '' },
        isForSomeoneElse: { type: Boolean, default: false },
        isDefault: { type: Boolean, default: false },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    }]
}, {
    timestamps: true,
    collection: 'users'
});

// ─── Production Indexes ───────────────────────────────────────────────────────
// Partial indexes: only index active, non-deleted accounts — keeps index small
userSchema.index({ mobile: 1, isDeleted: 1 }, { name: 'idx_mobile_active' });
userSchema.index({ primaryRole: 1, isActive: 1, isDeleted: 1 }, { name: 'idx_role_active' });
userSchema.index({ isActive: 1, isDeleted: 1 });
// Store panel "customers near this store" (store/services/nearby.js)
userSchema.index({ 'addresses.location': '2dsphere' });

// Hash plaintext passwords on save. A value that is already a bcrypt hash (controllers that hash
// first) is left alone, so nothing is ever double-hashed.
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password || isBcryptHash(this.password)) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
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
