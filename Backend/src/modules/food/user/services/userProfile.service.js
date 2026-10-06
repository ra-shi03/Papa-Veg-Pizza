import { FoodUser } from '../../../../core/users/user.model.js';
import { Profile } from '../../../../core/users/models/profile.model.js';
import { AuthError, ValidationError } from '../../../../core/auth/errors.js';
import { uploadImageBuffer } from '../../../../services/cloudinary.service.js';

const parseIsoDateOrNull = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const d = new Date(`${String(value)}T00:00:00.000Z`);
    // Keep null for invalid; validation is handled by DTO, but be defensive.
    return Number.isNaN(d.getTime()) ? null : d;
};

export const getCurrentUserProfile = async (userId) => {
    const user = await FoodUser.findById(userId).lean();
    if (!user) throw new AuthError('Profile not found');
    const profile = await Profile.findOne({ userId }).lean();
    return { user, profile: profile || {} };
};

export const updateCurrentUserProfile = async (userId, body) => {
    const user = await FoodUser.findById(userId);
    if (!user) throw new AuthError('Profile not found');

    if (body.phone !== undefined) {
        const nextPhone = String(body.phone || '').trim();
        const currentPhone = String(user.phone || '').trim();
        // OTP login is phone-based in this project; don't allow changing it from profile edit.
        if (nextPhone && nextPhone !== currentPhone) {
            throw new ValidationError('Phone number cannot be changed');
        }
    }

    if (body.name !== undefined) user.name = body.name ? String(body.name).trim() : null;
    let emailUpdate = undefined;
    if (body.email !== undefined) {
        emailUpdate = body.email ? String(body.email).trim().toLowerCase() : null;
    }
    if (body.profileImage !== undefined) user.profileImage = body.profileImage ? String(body.profileImage).trim() : null;
    if (body.gender !== undefined) user.gender = body.gender ? String(body.gender).trim() : null;

    const dob = parseIsoDateOrNull(body.dateOfBirth);
    if (dob !== undefined) user.dateOfBirth = dob;
    const ann = parseIsoDateOrNull(body.anniversary);
    if (ann !== undefined) user.anniversary = ann;

    await user.save();

    // Upsert Profile
    const profileUpdates = {};
    const profileKeys = ['alternatePhone', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'pincode', 'language', 'timezone', 'preferences'];
    for (const key of profileKeys) {
        if (body[key] !== undefined) {
            profileUpdates[key] = body[key];
        }
    }
    // ensure gender/dob match if they were provided
    if (body.gender !== undefined) profileUpdates.gender = body.gender ? String(body.gender).trim().toUpperCase() : null;
    if (dob !== undefined) profileUpdates.dob = dob;
    
    if (body.profileImage !== undefined) profileUpdates.profilePhoto = body.profileImage ? String(body.profileImage).trim() : null;
    if (user.mobile) profileUpdates.phone = user.mobile;
    
    if (emailUpdate !== undefined) profileUpdates.email = emailUpdate;
    
    if (body.firstName !== undefined) profileUpdates.firstName = body.firstName ? String(body.firstName).trim() : null;
    if (body.lastName !== undefined) profileUpdates.lastName = body.lastName ? String(body.lastName).trim() : null;
    
    if (body.name !== undefined && body.firstName === undefined) {
        const parts = body.name ? String(body.name).trim().split(' ') : [];
        profileUpdates.firstName = parts[0] || null;
        profileUpdates.lastName = parts.slice(1).join(' ') || null;
    }
    
    // Auto-compute profile completion if not explicitly provided as false
    const isComplete = Boolean(
        profileUpdates.firstName && 
        profileUpdates.lastName && 
        profileUpdates.email
    );
    
    if (body.profileCompleted !== undefined) {
        profileUpdates.profileCompleted = body.profileCompleted;
        if (body.profileCompleted && !profileUpdates.profileCompletedAt) {
            profileUpdates.profileCompletedAt = new Date();
        }
    } else if (isComplete) {
        profileUpdates.profileCompleted = true;
        profileUpdates.profileCompletedAt = new Date();
    }

    let profile = await Profile.findOne({ userId });
    if (!profile) {
        profile = new Profile({ userId, ...profileUpdates });
    } else {
        Object.assign(profile, profileUpdates);
    }
    await profile.save();

    return { user: user.toObject(), profile: profile.toObject() };
};

export const uploadCurrentUserProfileImage = async (userId, file) => {
    if (!file || !file.buffer) {
        throw new ValidationError('File is required');
    }
    const user = await FoodUser.findById(userId);
    if (!user) throw new AuthError('Profile not found');

    const url = await uploadImageBuffer(file.buffer, 'food/users/profile');
    user.profileImage = String(url || '').trim();
    await user.save();
    
    const profile = await Profile.findOne({ userId });
    if (profile) {
        profile.profilePhoto = user.profileImage;
        await profile.save();
    }
    return { profileImage: user.profileImage, user: user.toObject() };
};

