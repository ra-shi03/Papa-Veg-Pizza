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

const lastTenDigits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

// Profile.gender enum is MALE | FEMALE | OTHER; the DTO also accepts "prefer-not-to-say".
const GENDER_TO_PROFILE = { male: 'MALE', female: 'FEMALE', other: 'OTHER', 'prefer-not-to-say': null };

/**
 * Single normalized view of the customer's account for the My Profile screen.
 * Name/email live in `profiles`; the phone is the login mobile on `users`.
 */
const buildAccount = (user, profile) => {
    const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
    const name = profileName || user.name || user.fullName || '';
    return {
        id: String(user._id),
        name,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        email: profile?.email || null,
        emailVerified: Boolean(user.emailVerified),
        phone: user.mobile || profile?.phone || user.phone || null,
        profileImage: profile?.profilePhoto || null,
        profileCompleted: Boolean(profile?.profileCompleted)
    };
};

export const getCurrentUserProfile = async (userId) => {
    const user = await FoodUser.findById(userId).lean();
    if (!user) throw new AuthError('Profile not found');
    const profile = await Profile.findOne({ userId }).lean();
    return { user, profile: profile || {}, account: buildAccount(user, profile) };
};

export const updateCurrentUserProfile = async (userId, body) => {
    const user = await FoodUser.findById(userId);
    if (!user) throw new AuthError('Profile not found');

    if (body.phone !== undefined) {
        // OTP login is phone-based (users.mobile); don't allow changing it from profile edit.
        const nextPhone = lastTenDigits(body.phone);
        if (nextPhone && nextPhone !== lastTenDigits(user.mobile)) {
            throw new ValidationError('Phone number cannot be changed');
        }
    }

    if (body.name !== undefined) {
        const trimmedName = String(body.name || '').trim().replace(/\s+/g, ' ');
        if (!trimmedName) throw new ValidationError('Name cannot be empty');
        body.name = trimmedName;
        user.name = trimmedName;
    }
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
    if (body.gender !== undefined) profileUpdates.gender = body.gender ? (GENDER_TO_PROFILE[String(body.gender).trim().toLowerCase()] ?? null) : null;
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
    
    let profile = await Profile.findOne({ userId });
    const previousEmail = profile?.email || null;
    if (!profile) {
        profile = new Profile({ userId, ...profileUpdates });
    } else {
        Object.assign(profile, profileUpdates);
    }

    // A changed email has not been verified yet.
    if (emailUpdate !== undefined && emailUpdate !== previousEmail && user.emailVerified) {
        user.emailVerified = false;
        await user.save();
    }

    // Completion is judged on the saved profile (not just this request's fields), and is never undone.
    if (body.profileCompleted !== undefined) {
        profile.profileCompleted = body.profileCompleted;
        if (body.profileCompleted && !profile.profileCompletedAt) profile.profileCompletedAt = new Date();
    } else if (!profile.profileCompleted && profile.firstName && profile.lastName && profile.email) {
        profile.profileCompleted = true;
        profile.profileCompletedAt = new Date();
    }
    await profile.save();

    const profileObj = profile.toObject();
    return { user: user.toObject(), profile: profileObj, account: buildAccount(user, profileObj) };
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

