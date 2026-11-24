import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { SharedRateLimitStore } from './rateLimitStore.js';

// Every limiter counts through SharedRateLimitStore: in Redis when Redis is on (one count for all server processes behind
// the load balancer), in this process's memory otherwise. Each limiter needs its own store name so counts never mix.
let storeSeq = 0;
const sharedStore = (name) => new SharedRateLimitStore(`${name}${++storeSeq}`);

const windowMs = config.rateLimitWindowMinutes * 60 * 1000;

export const apiRateLimiter = rateLimit({
    windowMs,
    // Dev UX: local UI can generate lots of background API calls (location, polling, etc).
    // Keep production strict, but avoid blocking local development.
    max: config.nodeEnv === 'development' ? Math.max(config.rateLimitMaxRequests, 2000) : config.rateLimitMaxRequests,
    store: sharedStore('api'),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

const authWindowMs = config.authRateLimitWindowMinutes * 60 * 1000;

/**
 * Per caller (IP) limit for auth routes (OTP, login, forgot password). Applied in addition to the global limiter.
 * In development the limit is relaxed to 100 so flows can be tested, unless AUTH_RATE_LIMIT_MAX is set on purpose
 * (set it to see the real limit while developing).
 */
export const authRateLimiter = rateLimit({
    windowMs: authWindowMs,
    max: config.nodeEnv === 'development' && !process.env.AUTH_RATE_LIMIT_MAX ? Math.max(config.authRateLimitMax, 100) : config.authRateLimitMax,
    store: sharedStore('auth-ip'),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    }
});

// Per ACCOUNT limits, whichever IP the attempts come from. The per-IP limit above cannot stop one account being guessed from
// many addresses; these do. Failed attempts count (a successful sign-in does not), so a real user is never locked out by
// signing in normally, and the window is short (AUTH_RATE_LIMIT_WINDOW minutes).
const clean = (v) => String(v ?? '').trim().toLowerCase();
const emailKey = (req) => {
    const e = clean(req.body?.email);
    return e ? `email:${e.slice(0, 200)}` : '';
};
const phoneKey = (req) => {
    const p = String(req.body?.phone ?? '').replace(/\D/g, '').slice(-10);
    return p.length >= 6 ? `phone:${p}` : '';
};
const accountLimiter = ({ name, max, key, countSuccess = false, message }) => rateLimit({
    windowMs: authWindowMs,
    max,
    store: sharedStore(name),
    keyGenerator: (req) => key(req),
    skip: (req) => !key(req),                 // no email / phone in the body: the per-IP limit and validation handle it
    skipSuccessfulRequests: !countSuccess,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message }
});

/** Wrong passwords for one email (admin, franchise, store manager, kitchen staff). */
export const loginAccountLimiter = accountLimiter({
    name: 'login-acct', max: config.loginFailMax, key: emailKey,
    message: 'Too many failed sign-in attempts for this account. Please wait a few minutes and try again, or reset your password.'
});
/** Wrong OTP codes for one phone number (customer and rider sign-in). */
export const otpVerifyAccountLimiter = accountLimiter({
    name: 'otp-verify-acct', max: config.otpVerifyFailMax, key: phoneKey,
    message: 'Too many wrong codes for this number. Please wait a few minutes and request a new code.'
});
/** Password-reset codes for one email: asking for codes (all requests count) and guessing them (failures count). */
export const forgotRequestAccountLimiter = accountLimiter({
    name: 'forgot-req-acct', max: config.forgotOtpMax, key: emailKey, countSuccess: true,
    message: 'Too many password reset requests for this account. Please try again later.'
});
export const forgotResetAccountLimiter = accountLimiter({
    name: 'forgot-reset-acct', max: config.otpVerifyFailMax, key: emailKey,
    message: 'Too many wrong reset codes for this account. Please request a new code later.'
});

// Public order lookup (order id + mobile number, no sign-in). Order ids are short (FOD- and 7 digits), so failed
// lookups are limited per caller, per order id and per mobile number: guessing the orders of a known number, or the
// number of a known order, stops after a few tries. Successful lookups do not count.
const lookupField = (req, ...names) => {
    for (const n of names) {
        const v = req.body?.[n] ?? req.query?.[n];
        if (v !== undefined && v !== null && v !== '') return String(v);
    }
    return '';
};
const lookupOrderKey = (req) => lookupField(req, 'orderId', 'order_id').trim().replace(/^#/, '').toLowerCase();
const lookupPhoneKey = (req) => lookupField(req, 'phone', 'mobileNumber').replace(/\D/g, '').slice(-10);

const lookupLimiter = (max, key) => rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    store: sharedStore('lookup'),
    skipSuccessfulRequests: true,
    ...(key ? { keyGenerator: (req) => key(req), skip: (req) => !key(req) } : {}),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many order lookups. Please try again later, or sign in to see your orders.'
    }
});

export const publicOrderLookupLimiters = [
    lookupLimiter(30),
    lookupLimiter(5, (req) => lookupOrderKey(req) && `order:${lookupOrderKey(req)}`),
    lookupLimiter(10, (req) => lookupPhoneKey(req) && `phone:${lookupPhoneKey(req)}`)
];


// Public bulk order requests (no sign-in): limited per caller, per phone number and per email so the page cannot be used
// to flood a store with requests. Switched off in tests.
const bulkKey = (req, field) => {
    const v = String(req.body?.[field] ?? '').toLowerCase().replace(field === 'phone' ? /\D/g : /\s/g, '');
    return field === 'phone' ? v.slice(-10) : v;
};
const bulkLimiter = (max, windowMs, key) => rateLimit({
    windowMs,
    max,
    store: sharedStore('bulk'),
    ...(key ? { keyGenerator: (req) => key(req) || req.ip, skip: (req) => process.env.NODE_ENV === 'test' } : { skip: () => process.env.NODE_ENV === 'test' }),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many bulk order requests. Please try again later.' }
});
export const bulkOrderLimiters = [
    bulkLimiter(10, 60 * 60 * 1000),
    bulkLimiter(3, 24 * 60 * 60 * 1000, (req) => bulkKey(req, 'phone') && `phone:${bulkKey(req, 'phone')}`),
    bulkLimiter(3, 24 * 60 * 60 * 1000, (req) => bulkKey(req, 'email') && `email:${bulkKey(req, 'email')}`),
];
