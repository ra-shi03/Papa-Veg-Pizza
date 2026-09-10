import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../../config/env.js';

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        name: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        mobile: { type: String, trim: true, default: '' },
        profileImage: { type: String, trim: true, default: '' },
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRole',
            default: null
        },
        fcmTokens: {
            type: [String],
            default: []
        },
        fcmTokenMobile: {
            type: [String],
            default: []
        },
        role: {
            type: String,
            enum: ['superadmin', 'franchise-admin', 'store-manager', 'kitchen-supervisor', 'kitchen-staff'],
            default: 'superadmin'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        emailVerified: {
            type: Boolean,
            default: true
        },
        franchiseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodFranchise',
            default: null,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            default: null,
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin',
            default: null
        },
        permissions: {
            type: [String],
            default: []
        },
        lastLogin: {
            type: Date,
            default: null
        },
        refreshToken: {
            type: String,
            default: ''
        },
        servicesAccess: {
            type: [String],
            enum: ['food'],
            default: ['food']
        }
    },
    {
        collection: 'food_admins',
        timestamps: true
    }
);

adminSchema.index({ servicesAccess: 1 });
adminSchema.index({ mobile: 1 }, { sparse: true });
adminSchema.index({ phone: 1 }, { sparse: true });
adminSchema.index({ role: 1, isActive: 1, isDeleted: 1 });

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

adminSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export const FoodAdmin = mongoose.model('FoodAdmin', adminSchema);

