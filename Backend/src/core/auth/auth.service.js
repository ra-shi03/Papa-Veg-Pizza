import crypto from "crypto";
import ms from "ms";
import { User } from "../users/models/user.model.js";
import { Profile } from "../users/models/profile.model.js";
import { Role } from "../roles/models/role.model.js";
import { UserRole } from "../roles/models/userRole.model.js";
import { FoodAdmin } from "../admin/admin.model.js";
import { AdminResetOtp } from "../admin/adminResetOtp.model.js";

import { FoodDeliveryPartner } from "../../modules/food/delivery/models/deliveryPartner.model.js";
import { FoodFranchise } from "../../modules/food/franchise/models/franchise.model.js";
import { FoodReferralSettings } from "../../modules/food/admin/models/referralSettings.model.js";
import { FoodReferralLog } from "../../modules/food/admin/models/referralLog.model.js";
import { createOrUpdateOtp, verifyOtp } from "../otp/otp.service.js";
import { signAccessToken, signRefreshToken } from "./token.util.js";
import { RefreshToken } from "./models/refreshToken.model.js";
import { ValidationError, AuthError } from "./errors.js";
import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { sendAdminResetOtpEmail } from "../../utils/email.js";
import mongoose from "mongoose";
import { creditReferralReward } from "../../modules/food/user/services/userWallet.service.js";

const ROLES = {
  USER: "USER",

  DELIVERY_PARTNER: "DELIVERY_PARTNER",
  ADMIN: "ADMIN",
};

const normalizeAdminRole = (role) => {
  return String(role || '').trim().replace(/_/g, '-').toLowerCase();
};

const ADMIN_PANEL_ROLES = new Set([
  'superadmin',
  'franchise-admin',
  'store-manager',
  'kitchen-supervisor',
  'kitchen-staff'
]);

const toSafeImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.url || value.secure_url || "";
  return "";
};

const sanitizeUserForAuthResponse = (userDoc = {}) => {
  const id = userDoc?._id?.toString?.() || userDoc?.id?.toString?.() || userDoc?._id || userDoc?.id || null;
  return {
    id,
    _id: id,
    name: userDoc?.name || "",
    phone: userDoc?.phone || "",
    email: userDoc?.email || "",
    role: userDoc?.role || ROLES.USER,
    isVerified: Boolean(userDoc?.isVerified),
    isActive: userDoc?.isActive !== false,
    profileImage: toSafeImageUrl(userDoc?.profileImage),
    gender: userDoc?.gender || null,
    referralCode: userDoc?.referralCode || "",
    refCode: userDoc?.referralCode || "",
    referralCount: Number(userDoc?.referralCount || 0),
    walletAmount: Number(userDoc?.walletAmount || 0),
  };
};


const sanitizeDeliveryForAuthResponse = (deliveryDoc = {}) => {
  const id =
    deliveryDoc?._id?.toString?.() ||
    deliveryDoc?.id?.toString?.() ||
    deliveryDoc?._id ||
    deliveryDoc?.id ||
    null;

  return {
    id,
    _id: id,
    name: deliveryDoc?.name || "",
    phone: deliveryDoc?.phone || "",
    email: deliveryDoc?.email || "",
    status: deliveryDoc?.status || "",
    profileImage: toSafeImageUrl(deliveryDoc?.profilePhoto),
    walletAmount: Number(deliveryDoc?.walletAmount || 0),
    refCode: deliveryDoc?.referralCode || "",
  };
};

const sanitizeAdminForAuthResponse = (adminDoc = {}) => {
  const id = adminDoc?._id?.toString?.() || adminDoc?.id?.toString?.() || adminDoc?._id || adminDoc?.id || null;
  return {
    id,
    _id: id,
    name: adminDoc?.name || "",
    email: adminDoc?.email || "",
    role: adminDoc?.role || "superadmin",
    storeId: adminDoc?.storeId || null,
    franchiseId: adminDoc?.franchiseId || null,
    permissions: adminDoc?.permissions || []
  };
};

export const requestUserOtp = async (phone) => {
  if (!phone) {
    throw new ValidationError("Phone is required");
  }

  const otp = await createOrUpdateOtp(phone);
  // TODO: integrate SMS provider here
  const shouldExposeOtp =
    config.nodeEnv !== "production" || config.useDefaultOtp;
  return shouldExposeOtp ? { otp } : {};
};

export const verifyUserOtpAndLogin = async (
  phone,
  otp,
  ref,
  fcmToken,
  platform,
  name,
) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const existingUser = await User.findOne({ phone });

  const result = await verifyOtp(phone, otp);

  if (!result.valid) {
    throw new AuthError(result.reason || "OTP verification failed");
  }

  let userDoc = existingUser;
  
  // Ensure user exists and mark as verified on successful OTP.
  // Check if user is new or hasn't provided a name yet
  const needsNamePrompt = !userDoc || !userDoc.name || String(userDoc.name).trim() === "" || String(userDoc.name).toLowerCase() === "null";
  const isNewUser = needsNamePrompt;

  if (!userDoc) {
    userDoc = await User.create({
      phone,
      isVerified: true,
      name: trimmedName,
    });
  } else {
    let needsSave = false;
    if (!userDoc.isVerified) {
      userDoc.isVerified = true;
      needsSave = true;
    }
    if (trimmedName && !userDoc.name) {
      userDoc.name = trimmedName;
      needsSave = true;
    }
    if (needsSave) await userDoc.save();
  }

  // Block login for deactivated users
  if (userDoc.isActive === false) {
    throw new AuthError(
      "Your account has been deactivated. Please contact support.",
    );
  }

  // Update FCM token if provided
  if (fcmToken) {
    let isModified = false;
    if (platform === "mobile") {
      if (!userDoc.fcmTokenMobile) userDoc.fcmTokenMobile = [];
      if (!userDoc.fcmTokenMobile.includes(fcmToken)) {
        userDoc.fcmTokenMobile.push(fcmToken);
        isModified = true;
      }
    } else {
      // Default to web if not explicitly mobile
      if (!userDoc.fcmTokens) userDoc.fcmTokens = [];
      if (!userDoc.fcmTokens.includes(fcmToken)) {
        userDoc.fcmTokens.push(fcmToken);
        isModified = true;
      }
    }
    if (isModified) {
      await userDoc.save();
    }
  }

  // Ensure referralCode exists (used for share links on older accounts).
  if (!userDoc.referralCode) {
    userDoc.referralCode = String(userDoc._id);
    await userDoc.save();
  }

  // Referral crediting: only for brand new accounts.
  const refRaw = typeof ref === "string" ? String(ref).trim() : "";
  if (!existingUser && refRaw) {
    try {
      if (mongoose.Types.ObjectId.isValid(refRaw)) {
        const referrerId = new mongoose.Types.ObjectId(refRaw);
        if (String(referrerId) !== String(userDoc._id)) {
          const [referrer, settingsDoc] = await Promise.all([
            User.findById(referrerId).select("_id referralCount").lean(),
            FoodReferralSettings.findOne({ isActive: true })
              .sort({ createdAt: -1 })
              .lean(),
          ]);

          if (referrer && settingsDoc) {
            const reward = Math.max(
              0,
              Number(settingsDoc.referralRewardUser) || 0,
            );
            const limit = Math.max(
              0,
              Number(settingsDoc.referralLimitUser) || 0,
            );

            if (
              reward > 0 &&
              limit > 0 &&
              Number(referrer.referralCount || 0) < limit
            ) {
              userDoc.referredBy = referrerId;
              await userDoc.save();

              const log = await FoodReferralLog.create({
                referrerId,
                refereeId: userDoc._id,
                role: "USER",
                rewardAmount: reward,
                status: "credited",
              });

              await Promise.all([
                User.updateOne(
                  { _id: referrerId },
                  { $inc: { referralCount: 1 } },
                ),
                creditReferralReward(referrerId, reward, {
                  role: "USER",
                  refereeId: String(userDoc._id),
                  referralLogId: String(log._id),
                }),
              ]);
            } else {
              await FoodReferralLog.create({
                referrerId,
                refereeId: userDoc._id,
                role: "USER",
                rewardAmount: reward,
                status: "rejected",
                reason:
                  reward <= 0
                    ? "reward_disabled"
                    : limit <= 0
                      ? "limit_disabled"
                      : "limit_reached",
              });
            }
          }
        }
      }
    } catch (e) {
      // Never fail login due to referral errors.
      logger?.warn?.({ err: e }, "Referral crediting failed (user)");
    }
  }

  const user = userDoc.toObject();
  const payload = { userId: user._id.toString(), role: user.role || "USER" };

  const accessToken = signAccessToken(payload);
  const rawRefreshToken = signRefreshToken(payload);
  const tokenHash = RefreshToken.hashToken(rawRefreshToken);

  const ttlMs = ms(config.jwtRefreshExpiresIn || "7d");
  const expiresAt = new Date(Date.now() + ttlMs);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken: rawRefreshToken,
    user: sanitizeUserForAuthResponse(user),
    isNewUser,
  };
};

export const adminLogin = async ({ email, mobile, password } = {}, allowedRoles = null) => {
  if ((!email && !mobile) || !password) {
    throw new ValidationError("Email/mobile and password are required");
  }

  const normalizedEmail  = typeof email  === "string" ? email.trim().toLowerCase()    : "";
  const normalizedMobile = typeof mobile === "string" ? mobile.replace(/\D/g, "") : "";
  const filters = [];
  if (normalizedEmail)  filters.push({ email: normalizedEmail });
  if (normalizedMobile) filters.push({ mobile: normalizedMobile });

  const user = await User.findOne(
    filters.length > 1 ? { $or: filters } : filters[0],
    null,
    { lean: false }
  ).populate('primaryRole');

  if (!user) throw new AuthError("Invalid credentials");

  // Account state checks
  if (user.isDeleted === true)                      throw new AuthError("Account not found");
  if (user.isActive === false || user.isBlocked === true) throw new AuthError("Your account is inactive. Please contact support.");
  if (user.isLocked && user.isLocked())             throw new AuthError("Too many failed attempts. Account locked for 30 minutes.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    // Increment failed attempts (with auto-lockout after 5 fails)
    await user.incrementFailedLogin();
    throw new AuthError("Invalid credentials");
  }

  // Reset failed attempts on successful login
  await user.resetFailedLogin();

  if (!user.primaryRole) {
    throw new AuthError("This account has no roles assigned. Contact Super Admin.");
  }

  let role = normalizeAdminRole(user.primaryRole.code);
  // Normalize SUPER_ADMIN -> superadmin
  if (role === 'super-admin' || role === 'super_admin') role = 'superadmin';

  if (!ADMIN_PANEL_ROLES.has(role)) {
    throw new AuthError("This account is not allowed to access admin panels");
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    throw new AuthError("Access denied: Insufficient permissions for this portal");
  }

  // Fetch the active userRole to get franchiseId + storeId for JWT
  // This is the production-correct approach: context-aware JWT payload
  const activeUserRole = await UserRole.findOne({
    userId: user._id,
    roleId: user.primaryRole._id,
    status: 'ACTIVE'
  }).lean();

  const jwtPayload = {
    userId:      user._id.toString(),
    role,
    franchiseId: activeUserRole?.franchiseId?.toString() || null,
    storeId:     activeUserRole?.storeId?.toString()     || null,
  };

  const accessToken     = signAccessToken(jwtPayload);
  const rawRefreshToken = signRefreshToken(jwtPayload);
  const tokenHash       = RefreshToken.hashToken(rawRefreshToken);

  const ttlMs     = ms(config.jwtRefreshExpiresIn || "7d");
  const expiresAt = new Date(Date.now() + ttlMs);

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  user.lastLoginAt = new Date();
  await user.save();

  const profile = await Profile.findOne({ userId: user._id }).lean();

  const userResponse = {
    id:          user._id,
    _id:         user._id,
    name:        profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : "",
    email:       user.email,
    mobile:      user.mobile,
    role,
    franchiseId: jwtPayload.franchiseId,
    storeId:     jwtPayload.storeId,
  };

  return { accessToken, refreshToken: rawRefreshToken, user: userResponse };
};


export const requestDeliveryOtp = async (phone) => {
  if (!phone) {
    throw new ValidationError("Phone is required");
  }
  const otp = await createOrUpdateOtp(phone);
  // Only expose OTP in response when in default/dev mode — never in production with real SMS
  const shouldExposeOtp =
    config.nodeEnv !== "production" || config.useDefaultOtp;
  return shouldExposeOtp ? { otp } : {};
};

const normalizePhoneForDelivery = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.slice(-10) || null;
};

export const verifyDeliveryOtpAndLogin = async (phone, otp, fcmToken, platform) => {
  const result = await verifyOtp(phone, otp);
  if (!result.valid) {
    throw new AuthError(result.reason || "OTP verification failed");
  }

  const normalized = normalizePhoneForDelivery(phone);
  if (!normalized) {
    return { needsRegistration: true, phone };
  }

  const deliveryPartner = await FoodDeliveryPartner.findOne({
    $or: [
      { phone: normalized },
      { phone: { $regex: new RegExp(normalized + "$") } },
    ],
  });

  if (!deliveryPartner) {
    return { needsRegistration: true, phone };
  }

  // Update FCM token if provided - CRITICAL: do this BEFORE returning pendingApproval
  // so we can notify them when approved.
  if (fcmToken) {
    let isModified = false;
    if (platform === "mobile") {
      if (!deliveryPartner.fcmTokenMobile) deliveryPartner.fcmTokenMobile = [];
      if (!deliveryPartner.fcmTokenMobile.includes(fcmToken)) {
        deliveryPartner.fcmTokenMobile.push(fcmToken);
        isModified = true;
      }
    } else {
      if (!deliveryPartner.fcmTokens) deliveryPartner.fcmTokens = [];
      if (!deliveryPartner.fcmTokens.includes(fcmToken)) {
        deliveryPartner.fcmTokens.push(fcmToken);
        isModified = true;
      }
    }
    if (isModified) {
      await deliveryPartner.save();
    }
  }

  if (deliveryPartner.status && deliveryPartner.status !== "approved") {
    const isRejected = deliveryPartner.status === "rejected";
    return {
      pendingApproval: true,
      isRejected,
      rejectionReason: isRejected ? deliveryPartner.rejectionReason : null,
      message:
        isRejected
          ? (deliveryPartner.rejectionReason 
              ? `Your account was rejected: ${deliveryPartner.rejectionReason}`
              : "Your delivery account was not approved. Please contact support.")
          : "Your account is pending admin verification. You will be notified once approved.",
    };
  }

  const payload = {
    userId: deliveryPartner._id.toString(),
    role: ROLES.DELIVERY_PARTNER,
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const ttlMs = ms(config.jwtRefreshExpiresIn || "7d");
  const expiresAt = new Date(Date.now() + ttlMs);

  await RefreshToken.create({
    userId: deliveryPartner._id,
    token: refreshToken,
    expiresAt,
  });

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: sanitizeDeliveryForAuthResponse(
      deliveryPartner?.toObject?.() || deliveryPartner,
    ),
    needsRegistration: false,
  };
};

export const logout = async (refreshToken, fcmToken, platform) => {
  if (!refreshToken) {
    throw new ValidationError("Refresh token is required");
  }

  // 1. Remove specific FCM token from ALL collections if provided
  if (fcmToken) {
    console.log(`[FCM-Logout] Starting logout-driven token removal: platform=${platform}, tokenPreview=${fcmToken?.slice(0, 10)}...`);
    
    // We try to remove the token from all 4 possible models regardless of the user ID, 
    // ensuring no stale connections are left across any role or app the user was logged into.
    const field = platform === "mobile" ? "fcmTokenMobile" : "fcmTokens";
    const models = [User, FoodDeliveryPartner, FoodAdmin];
    
    try {
      await Promise.all(
        models.map((model) =>
          model.updateMany(
            { [field]: fcmToken },
            { $pull: { [field]: fcmToken } },
          ),
        ),
      );
      console.log("[FCM-Logout] Token removed from all collections successfully");
    } catch (err) {
      logger.warn({ err }, "Failed to remove FCM token from all collections during logout");
    }
  }

  // 2. Invalidate the refresh token (standard logout procedure)
  // Delete by hash — we never store raw tokens
  const tokenHash = RefreshToken.hashToken(refreshToken);
  const deleted = await RefreshToken.deleteOne({ tokenHash });
  return { invalidated: deleted.deletedCount > 0 };
};

export const getProfile = async (userId, role) => {
  if (!userId || !role) {
    throw new AuthError("Invalid token payload");
  }
  let profile = null;
  const id = userId;

  if (ADMIN_PANEL_ROLES.has(role) || role === ROLES.ADMIN) {
    const user = await User.findById(id).populate('primaryRole').lean();
    if (user) {
      const userProfile = await Profile.findOne({ userId: id }).lean();
      
      const activeUserRole = await UserRole.findOne({
        userId: user._id,
        roleId: user.primaryRole?._id,
        status: 'ACTIVE'
      }).lean();

      profile = {
        id: user._id,
        _id: user._id,
        name: userProfile && userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : user.name || "",
        email: user.email,
        mobile: user.mobile,
        role: role,
        franchiseId: activeUserRole?.franchiseId?.toString() || null,
        storeId: activeUserRole?.storeId?.toString() || null,
        ...(userProfile || {})
      };
    }
  } else {
    switch (role) {
      case ROLES.USER:
        profile = await User.findById(id).lean();
        break;

    case ROLES.DELIVERY_PARTNER: {
      const partner = await FoodDeliveryPartner.findById(id).lean();
      if (!partner) break;
      const deliveryId = partner._id
        ? `DP-${partner._id.toString().slice(-8).toUpperCase()}`
        : null;
      profile = {
        ...partner,
        email: partner.email || null,
        deliveryId,
        status: partner.status === "rejected" ? "blocked" : partner.status,
        profileImage: partner.profilePhoto
          ? { url: partner.profilePhoto }
          : null,
        documents: {
          aadhar:
            partner.aadharPhoto || partner.aadharNumber
              ? {
                  number: partner.aadharNumber || null,
                  document: partner.aadharPhoto || null,
                }
              : null,
          pan:
            partner.panPhoto || partner.panNumber
              ? {
                  number: partner.panNumber || null,
                  document: partner.panPhoto || null,
                }
              : null,
          drivingLicense: partner.drivingLicensePhoto || partner.drivingLicenseNumber
            ? {
                number: partner.drivingLicenseNumber || null,
                document: partner.drivingLicensePhoto || null,
              }
            : null,
          bankDetails:
            partner.bankAccountHolderName ||
            partner.bankAccountNumber ||
            partner.bankIfscCode ||
            partner.bankName ||
            partner.upiId ||
            partner.upiQrCode
              ? {
                  accountHolderName: partner.bankAccountHolderName || null,
                  accountNumber: partner.bankAccountNumber || null,
                  ifscCode: partner.bankIfscCode || null,
                  bankName: partner.bankName || null,
                  upiId: partner.upiId || null,
                  upiQrCode: partner.upiQrCode || null,
                }
              : null,
        },
        location:
          partner.address || partner.city || partner.state
            ? {
                addressLine1: partner.address,
                city: partner.city,
                state: partner.state,
              }
            : null,
        vehicle:
          partner.vehicleType || partner.vehicleName || partner.vehicleNumber
            ? {
                type: partner.vehicleType,
                brand: partner.vehicleName,
                model: partner.vehicleName,
                number: partner.vehicleNumber,
              }
            : null,
      };
      break;
    }
    default:
      throw new AuthError("Unknown role");
  }
  } // End of else block

  if (!profile) {
    throw new AuthError("Profile not found");
  }
  return { user: profile };
};

const ADMIN_SERVICES_ALLOWED = ["food", "quickCommerce", "taxi"];

/** Update admin profile (name, email, phone, profileImage). Only for ADMIN role. */
export const updateAdminProfile = async (userId, body) => {
  if (!userId) {
    throw new AuthError("Invalid token payload");
  }
  const admin = await User.findById(userId);
  if (!admin) {
    throw new AuthError("Profile not found");
  }
  if (body.name !== undefined) admin.name = String(body.name || "").trim();
  if (body.email !== undefined) {
    const normalizedEmail = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      throw new ValidationError("Email is required");
    }
    if (normalizedEmail !== admin.email) {
      const duplicateAdmin = await User.findOne({
        _id: { $ne: admin._id },
        email: normalizedEmail,
      })
        .select("_id")
        .lean();
      if (duplicateAdmin) {
        throw new ValidationError("Email is already in use");
      }
    }
    admin.email = normalizedEmail;
  }
  if (body.phone !== undefined) admin.phone = String(body.phone || "").trim();
  if (body.profileImage !== undefined)
    admin.profileImage = String(body.profileImage || "").trim();
  // Normalize servicesAccess so legacy values (e.g. 'zomato') don't fail schema validation on save
  if (Array.isArray(admin.servicesAccess)) {
    const valid = admin.servicesAccess.filter((s) =>
      ADMIN_SERVICES_ALLOWED.includes(s),
    );
    admin.servicesAccess = valid.length ? valid : ["food"];
  } else {
    admin.servicesAccess = ["food"];
  }

  // Upsert Profile fields
  const profileUpdates = {};
  const profileKeys = ['alternatePhone', 'addressLine1', 'addressLine2', 'city', 'state', 'country', 'pincode', 'language', 'timezone', 'preferences'];
  for (const key of profileKeys) {
      if (body[key] !== undefined) {
          profileUpdates[key] = body[key];
      }
  }
  if (body.gender !== undefined) profileUpdates.gender = String(body.gender || '').trim().toUpperCase();
  if (body.dateOfBirth !== undefined) {
    const d = new Date(`${String(body.dateOfBirth)}T00:00:00.000Z`);
    profileUpdates.dob = Number.isNaN(d.getTime()) ? null : d;
  }
  if (body.name !== undefined) {
      const parts = String(body.name || '').trim().split(' ');
      profileUpdates.firstName = parts[0] || '';
      profileUpdates.lastName = parts.slice(1).join(' ') || '';
  }

  let userProfile = await Profile.findOne({ userId });
  if (!userProfile) {
      userProfile = new Profile({ userId, ...profileUpdates });
  } else {
      Object.assign(userProfile, profileUpdates);
  }
  await userProfile.save();

  // If the user has a franchise, update its address fields so superadmin sees it
  const franchiseUpdates = {};
  if (body.addressLine1 !== undefined) franchiseUpdates.address = body.addressLine1;
  if (body.city !== undefined) franchiseUpdates.city = body.city;
  if (body.state !== undefined) franchiseUpdates.state = body.state;
  if (body.pincode !== undefined) franchiseUpdates.pincode = body.pincode;
  if (body.alternatePhone !== undefined) franchiseUpdates.alternatePhone = body.alternatePhone;
  if (body.gender !== undefined) franchiseUpdates.gender = body.gender;
  if (body.dateOfBirth !== undefined) {
    const d = new Date(`${String(body.dateOfBirth)}T00:00:00.000Z`);
    franchiseUpdates.dob = Number.isNaN(d.getTime()) ? null : d;
  }
  
  if (Object.keys(franchiseUpdates).length > 0) {
      await FoodFranchise.updateOne({ ownerUserId: userId }, { $set: franchiseUpdates });
  }

  await admin.save();
  const profile = admin.toObject();
  delete profile.password;
  return { user: { ...profile, ...userProfile.toObject() } };
};

/** Change admin password. Only for ADMIN role. */
export const changeAdminPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  if (!userId) {
    throw new AuthError("Invalid token payload");
  }
  const admin = await User.findById(userId);
  if (!admin) {
    throw new AuthError("Profile not found");
  }
  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AuthError("Current password is incorrect");
  }
  if (!newPassword || String(newPassword).length < 6) {
    throw new ValidationError("New password must be at least 6 characters");
  }
  admin.password = newPassword;
  await admin.save();

  try {
    const { notifyAdminsSafely } = await import("../../core/notifications/firebase.service.js");
    void notifyAdminsSafely({
      title: "Security Alert: Password Changed 🔐",
      body: `The password for admin account ${admin.email} has been changed. If this was not you, please contact support immediately.`,
      data: {
        type: "security_alert",
        subType: "password_change",
        email: admin.email
      }
    });
  } catch (e) {
    console.error("Failed to notify admins of password change:", e);
  }

  return { success: true };
};

/** Admin forgot password: request OTP. Only accepts email that is registered as admin. */
export const requestAdminForgotPasswordOtp = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) {
    throw new ValidationError("Email is required");
  }

  const admin = await FoodAdmin.findOne({ email: normalizedEmail });
  if (!admin) {
    throw new AuthError("This email is not registered as an admin account.");
  }

  const otp = config.useDefaultOtp
    ? "123456"
    : String(crypto.randomInt(100000, 999999));
  const ttlMs = (config.otpExpiryMinutes || 10) * 60 * 1000;
  const expiresAt = new Date(Date.now() + ttlMs);

  await AdminResetOtp.findOneAndUpdate(
    { email: normalizedEmail },
    { otp, expiresAt, attempts: 0 },
    { upsert: true, new: true },
  );

  if (config.useDefaultOtp) {
    logger.info(`Admin reset OTP for ${normalizedEmail}: ${otp}`);
  }

  const sent = await sendAdminResetOtpEmail(normalizedEmail, otp);
  if (!sent && !config.useDefaultOtp) {
    logger.warn(
      `Admin OTP not sent by email to ${normalizedEmail}; check SMTP config.`,
    );
  }

  return {
    success: true,
    message: "If this email is registered, you will receive an OTP shortly.",
  };
};

/** Admin forgot password: verify OTP and set new password in one call. */
export const resetAdminPasswordWithOtp = async (email, otp, newPassword) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const otpStr = String(otp || "").replace(/\D/g, "");
  if (!normalizedEmail || !otpStr) {
    throw new ValidationError("Email and OTP are required");
  }
  if (!newPassword || String(newPassword).length < 6) {
    throw new ValidationError("New password must be at least 6 characters");
  }

  const record = await AdminResetOtp.findOne({ email: normalizedEmail });
  if (!record) {
    throw new AuthError("OTP not found or expired. Please request a new code.");
  }
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    throw new AuthError("OTP has expired. Please request a new code.");
  }
  if (record.attempts >= (config.otpMaxAttempts || 5)) {
    throw new AuthError("Too many attempts. Please request a new code.");
  }
  record.attempts += 1;
  if (record.otp !== otpStr) {
    await record.save();
    throw new AuthError("Invalid OTP.");
  }

  const admin = await FoodAdmin.findOne({ email: normalizedEmail });
  if (!admin) {
    await record.deleteOne();
    throw new AuthError("Account not found.");
  }

  admin.password = newPassword;
  await admin.save();
  await record.deleteOne();

  try {
    const { notifyAdminsSafely } = await import("../../core/notifications/firebase.service.js");
    void notifyAdminsSafely({
      title: "Security Alert: Password Reset Successful 🔐",
      body: `The password for admin account ${admin.email} has been reset via OTP.`,
      data: {
        type: "security_alert",
        subType: "password_reset",
        email: admin.email
      }
    });
  } catch (e) {
    console.error("Failed to notify admins of password reset:", e);
  }

  return { success: true, message: "Password reset successfully." };
};

export const refreshAccessToken = async (token) => {
  if (!token) {
    throw new ValidationError("Refresh token is required");
  }

  // Look up by hash — DB never stores raw tokens
  const stored = await RefreshToken.findByRawToken(token);
  if (!stored) {
    throw new AuthError("Invalid or expired refresh token");
  }

  const jwt = await import("jsonwebtoken");
  let payload;
  try {
    payload = jwt.default.verify(token, config.jwtRefreshSecret);
  } catch {
    // Token is invalid or expired — remove stale record
    await RefreshToken.deleteOne({ _id: stored._id });
    throw new AuthError("Refresh token has expired. Please log in again.");
  }

  // Enforce active status check on every token refresh
  const u = await User.findById(payload.userId).select("isActive isBlocked isDeleted").lean();
  if (!u || u.isActive === false || u.isBlocked === true || u.isDeleted === true) {
    await RefreshToken.deleteOne({ _id: stored._id });
    throw new AuthError("Account is deactivated. Please contact support.");
  }

  // Issue new access token with same payload (including franchiseId + storeId)
  const newAccessToken = signAccessToken({
    userId:      payload.userId,
    role:        payload.role,
    franchiseId: payload.franchiseId || null,
    storeId:     payload.storeId     || null,
  });

  return { accessToken: newAccessToken, refreshToken: token };
};
