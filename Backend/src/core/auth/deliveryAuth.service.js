import ms from "ms";
import { FoodDeliveryPartner } from "../../modules/food/delivery/models/deliveryPartner.model.js";
import { createOrUpdateOtp, verifyOtp } from "../otp/otp.service.js";
import { signAccessToken, signRefreshToken } from "./token.util.js";
import { RefreshToken } from "./models/refreshToken.model.js";
import { AuthError } from "./errors.js";
import { config } from "../../config/env.js";
import mongoose from "mongoose";

const ROLES = {
  DELIVERY_PARTNER: "DELIVERY_PARTNER",
};

const toSafeImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.url || value.secure_url || "";
  return "";
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

export const requestDeliveryOtp = async (phone) => {
  const deliveryPartner = await FoodDeliveryPartner.findOne({ phone });
  const isExisting = !!deliveryPartner;
  
  if (isExisting && deliveryPartner.status === "rejected") {
    throw new AuthError(`Your account was rejected: ${deliveryPartner.rejectionReason || "Please contact support"}`);
  }

  const { otp, expiresAt } = await createOrUpdateOtp(phone);
  return {
    isExistingUser: isExisting,
    isRegistered: isExisting,
    otp,
    expiresAt,
  };
};

export const verifyDeliveryOtpAndLogin = async (phone, otp, fcmToken, platform) => {
  const isValid = await verifyOtp(phone, otp);
  if (!isValid) {
    throw new AuthError("Invalid or expired OTP");
  }

  let deliveryPartner = await FoodDeliveryPartner.findOne({ phone });

  if (!deliveryPartner) {
    deliveryPartner = new FoodDeliveryPartner({
      phone,
      status: "pending", // require admin approval
    });
    
    if (fcmToken) {
      if (platform === "mobile") {
        deliveryPartner.fcmTokenMobile = fcmToken;
      } else {
        if (!deliveryPartner.fcmTokens) deliveryPartner.fcmTokens = [];
        if (!deliveryPartner.fcmTokens.includes(fcmToken)) {
          deliveryPartner.fcmTokens.push(fcmToken);
        }
      }
    }
    
    await deliveryPartner.save();
    
    return {
      token: null,
      accessToken: null,
      refreshToken: null,
      user: sanitizeDeliveryForAuthResponse(deliveryPartner.toObject()),
      needsRegistration: true,
      pendingApproval: true,
      message: "Phone number verified. Please complete registration.",
    };
  } else {
    // Existing user login - update FCM tokens
    let fcmUpdated = false;
    
    if (fcmToken) {
      if (platform === "mobile" && deliveryPartner.fcmTokenMobile !== fcmToken) {
        deliveryPartner.fcmTokenMobile = fcmToken;
        fcmUpdated = true;
      } else if (platform === "web") {
        if (!deliveryPartner.fcmTokens) deliveryPartner.fcmTokens = [];
        if (!deliveryPartner.fcmTokens.includes(fcmToken)) {
          deliveryPartner.fcmTokens.push(fcmToken);
          fcmUpdated = true;
        }
      }
    }
    
    if (fcmUpdated) {
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
  const rawRefreshToken = signRefreshToken(payload);
  const tokenHash = RefreshToken.hashToken(rawRefreshToken);
  const ttlMs = ms(config.jwtRefreshExpiresIn || "7d");
  const expiresAt = new Date(Date.now() + ttlMs);
  await RefreshToken.create({
    userId: deliveryPartner._id,
    tokenHash: tokenHash,
    expiresAt,
  });

  // Limit active sessions (max 3 per user)
  const tokens = await RefreshToken.find({ userId: deliveryPartner._id }).sort({ createdAt: -1 });
  if (tokens.length > 3) {
    const tokensToDelete = tokens.slice(3).map(t => t._id);
    await RefreshToken.deleteMany({ _id: { $in: tokensToDelete } });
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken: rawRefreshToken,
    user: sanitizeDeliveryForAuthResponse(
      deliveryPartner?.toObject?.() || deliveryPartner,
    ),
    needsRegistration: false,
  };
};
