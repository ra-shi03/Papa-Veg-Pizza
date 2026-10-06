import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        trim: true,
        default: null
    },
    lastName: {
        type: String,
        trim: true,
        default: null
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    profilePhoto: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER"],
        default: null
    },
    dob: {
        type: Date,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    alternatePhone: {
        type: String,
        trim: true,
        default: null
    },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    language: String,
    timezone: String,
    preferences: {
        theme: { type: String, enum: ["LIGHT", "DARK", "SYSTEM"], default: "LIGHT" },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: false }
        },
        currency: { type: String, default: "INR" }
    },
    profileCompleted: {
        type: Boolean,
        default: false
    },
    profileCompletedAt: {
        type: Date,
        default: null
    }
}, { 
    timestamps: true,
    collection: 'profiles'
});

export const Profile = mongoose.model('Profile', profileSchema);
