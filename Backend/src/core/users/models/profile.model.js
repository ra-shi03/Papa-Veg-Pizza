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
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    profilePhoto: {
        type: String
    },
    gender: {
        type: String,
        enum: ["MALE", "FEMALE", "OTHER"]
    },
    dob: Date,
    phone: {
        type: String,
        trim: true
    },
    alternatePhone: {
        type: String,
        trim: true
    },
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
    language: String,
    timezone: String
}, { 
    timestamps: true,
    collection: 'profiles'
});

export const Profile = mongoose.model('Profile', profileSchema);
