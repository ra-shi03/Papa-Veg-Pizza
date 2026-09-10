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

    if (body.name !== undefined) user.name = String(body.name || '').trim();
    if (body.email !== undefined) user.email = String(body.email || '').trim().toLowerCase();
    if (body.profileImage !== undefined) user.profileImage = String(body.profileImage || '').trim();
    if (body.gender !== undefined) user.gender = String(body.gender || '').trim();

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
    if (body.gender !== undefined) profileUpdates.gender = String(body.gender || '').trim().toUpperCase();
    if (dob !== undefined) profileUpdates.dob = dob;
    if (body.name !== undefined) {
        const parts = String(body.name || '').trim().split(' ');
        profileUpdates.firstName = parts[0] || '';
        profileUpdates.lastName = parts.slice(1).join(' ') || '';
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
    return { profileImage: user.profileImage, user: user.toObject() };
};

