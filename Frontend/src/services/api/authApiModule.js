import apiClient, { userClient, restaurantClient, deliveryClient, adminClient } from "./axios.js";
import { API_ENDPOINTS } from "./config.js";
import * as authService from "./auth.js";
import { createStubAPI, emptyDataStub, stub } from "./core.js";


/** Single in-flight + short cache for user /auth/me - avoids duplicate calls. */
let userMeInFlight = null;
let userMeCached = null;
let userMeCacheTime = 0;
const USER_ME_CACHE_MS = 3000;

const getUserMeOnce = () => {
  const now = Date.now();
  if (userMeCached && now - userMeCacheTime < USER_ME_CACHE_MS) {
    return Promise.resolve(userMeCached);
  }
  if (!userMeInFlight) {
    userMeInFlight = authService
      .getMe("user")
      .then((res) => {
        userMeCached = res;
        userMeCacheTime = Date.now();
        return res;
      })
      .finally(() => {
        userMeInFlight = null;
      });
  }
  return userMeInFlight;
};

/** Auth API - user OTP + admin login via new backend */
export const authAPI = {
  sendOTP: (phone, _purpose = "login", _email = null) => {
    if (!phone) return Promise.reject(new Error("Phone is required"));
    return authService.requestUserOtp(phone);
  },
  verifyOTP: (
    phone,
    otp,
    _purpose,
    _name,
    _email,
    _role,
    _password,
    _referralCode,
    fcmToken = null,
    platform = "web",
  ) => {
    if (!phone || !otp)
      return Promise.reject(new Error("Phone and OTP are required"));
    return authService.verifyUserOtp(
      phone,
      otp,
      _referralCode,
      _name,
      fcmToken,
      platform,
    );
  },
  getCurrentUser: () => getUserMeOnce(),
  refreshToken: (token) => authService.refreshToken(token),
  logout: (refreshToken, fcmToken = null, platform = "web") => {
    const token =
      refreshToken ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("user_refreshToken")
        : null);
    return authService.logout(token, fcmToken, platform);
  },
};
