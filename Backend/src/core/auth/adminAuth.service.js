import crypto from "crypto";
import { FoodAdmin } from "../admin/admin.model.js";
import { AdminResetOtp } from "../admin/adminResetOtp.model.js";
import { signAccessToken, signRefreshToken } from "./token.util.js";
import { RefreshToken } from "./models/refreshToken.model.js";
import { ValidationError, AuthError } from "./errors.js";
import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { sendAdminResetOtpEmail } from "../../utils/email.js";
import ms from "ms";

const ADMIN_PANEL_ROLES = new Set([
  'superadmin',
  'franchise-admin',
  'store-manager',
  'kitchen-supervisor',
  'kitchen-staff'
]);

const normalizeAdminRole = (role) => {
  return String(role || '').trim().replace(/_/g, '-').toLowerCase();
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

export const adminLogin = async ({ email, mobile, password } = {}, allowedRoles = null) => {
  if ((!email && !mobile) || !password) {
    throw new ValidationError("Email/Mobile and password are required");
  }

  const query = email ? { email: email.toLowerCase() } : { mobile };
  
  // Find admin and include password for verification
  const admin = await FoodAdmin.findOne(query).select("+password");

  if (!admin) {
    throw new AuthError("Invalid credentials");
  }

  // Check if admin is active
  if (admin.status !== "active") {
    throw new AuthError(`Account is ${admin.status}. Please contact system administrator.`);
  }

  // Verify password
  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    throw new AuthError("Invalid credentials");
  }

  const adminRole = normalizeAdminRole(admin.role);

  // Validate role if specific roles are allowed
  if (allowedRoles) {
    const normalizedAllowedRoles = allowedRoles.map(r => normalizeAdminRole(r));
    
    // For store login endpoint, check if role matches any store-level role
    if (normalizedAllowedRoles.includes('store-manager')) {
      const storeRoles = ['store-manager', 'kitchen-supervisor', 'kitchen-staff'];
      if (!storeRoles.includes(adminRole)) {
        throw new AuthError("Access denied: Invalid role for store portal");
      }
    } 
    // For other endpoints (superadmin, franchise)
    else if (!normalizedAllowedRoles.includes(adminRole)) {
      throw new AuthError(`Access denied: Required role ${allowedRoles.join(' or ')}`);
    }
  }

  const payload = {
    userId: admin._id.toString(),
    role: admin.role,
    storeId: admin.storeId || null,
    franchiseId: admin.franchiseId || null,
  };

  const accessToken = signAccessToken(payload);
  const rawRefreshToken = signRefreshToken(payload);
  const tokenHash = RefreshToken.hashToken(rawRefreshToken);
  const ttlMs = ms(config.jwtRefreshExpiresIn || "7d");
  const expiresAt = new Date(Date.now() + ttlMs);

  await RefreshToken.create({
    userId: admin._id,
    tokenHash: tokenHash,
    expiresAt,
  });

  // Limit active sessions
  const tokens = await RefreshToken.find({ userId: admin._id }).sort({ createdAt: -1 });
  if (tokens.length > 3) {
    const tokensToDelete = tokens.slice(3).map(t => t._id);
    await RefreshToken.deleteMany({ _id: { $in: tokensToDelete } });
  }

  admin.lastLogin = new Date();
  await admin.save({ validateModifiedOnly: true });

  const sanitizedAdmin = sanitizeAdminForAuthResponse(admin.toObject());

  return {
    token: accessToken,
    accessToken,
    refreshToken: rawRefreshToken,
    user: sanitizedAdmin,
    role: admin.role,
  };
};

export const updateAdminProfile = async (userId, body) => {
  const admin = await FoodAdmin.findById(userId);
  if (!admin) {
    throw new AuthError("Admin not found");
  }

  const allowedUpdates = ["name", "mobile", "profileImage"];
  
  // Apply updates dynamically
  allowedUpdates.forEach(field => {
    if (body[field] !== undefined) {
      admin[field] = body[field];
    }
  });

  // Since we're partially updating, validate modified fields
  await admin.save({ validateModifiedOnly: true });

  return sanitizeAdminForAuthResponse(admin.toObject());
};

export const changeAdminPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const admin = await FoodAdmin.findById(userId).select("+password");
  if (!admin) {
    throw new AuthError("Admin not found");
  }

  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ValidationError("Invalid current password");
  }

  admin.password = newPassword;
  await admin.save(); // pre-save hook handles hashing

  // Force re-login on other devices by invalidating all refresh tokens
  await RefreshToken.deleteMany({ userId });

  return true;
};

export const requestAdminForgotPasswordOtp = async (email) => {
  if (!email) {
    throw new ValidationError("Email is required");
  }

  const admin = await FoodAdmin.findOne({ email: email.toLowerCase() });
  
  if (!admin) {
    // Return success to prevent email enumeration, but don't send OTP
    logger.warn({ email }, "Forgot password attempt for non-existent admin email");
    return { success: true, message: "If your email is registered, an OTP will be sent." };
  }

  if (admin.status !== "active") {
    throw new AuthError("Account is inactive. Please contact system administrator.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await AdminResetOtp.findOneAndUpdate(
    { email: email.toLowerCase() },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  await sendAdminResetOtpEmail(admin.email, admin.name, otp);

  return { success: true, message: "OTP sent successfully to your email" };
};

export const resetAdminPasswordWithOtp = async (email, otp, newPassword) => {
  if (!email || !otp || !newPassword) {
    throw new ValidationError("Email, OTP and new password are required");
  }

  const normalizedEmail = email.toLowerCase();
  
  const resetRecord = await AdminResetOtp.findOne({ email: normalizedEmail });
  if (!resetRecord) {
    throw new ValidationError("Invalid or expired OTP");
  }

  if (resetRecord.expiresAt < new Date()) {
    await AdminResetOtp.deleteOne({ _id: resetRecord._id });
    throw new ValidationError("OTP has expired");
  }

  if (resetRecord.otp !== otp) {
    throw new ValidationError("Invalid OTP");
  }

  const admin = await FoodAdmin.findOne({ email: normalizedEmail });
  if (!admin) {
    throw new AuthError("Admin not found");
  }

  admin.password = newPassword;
  await admin.save(); 

  // Cleanup OTP
  await AdminResetOtp.deleteOne({ _id: resetRecord._id });

  // Force re-login globally
  await RefreshToken.deleteMany({ userId: admin._id });

  return true;
};

