import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

const windowMs = config.rateLimitWindowMinutes * 60 * 1000;

export const apiRateLimiter = rateLimit({
    windowMs,
    // Dev UX: local UI can generate lots of background API calls (location, polling, etc).
    // Keep production strict, but avoid blocking local development.
    max: config.nodeEnv === 'development' ? Math.max(config.rateLimitMaxRequests, 2000) : config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    }
});

const authWindowMs = config.authRateLimitWindowMinutes * 60 * 1000;

/** Stricter rate limit for auth routes (OTP, login, refresh, logout). Applied in addition to global limiter. */
export const authRateLimiter = rateLimit({
    windowMs: authWindowMs,
    // Dev UX: login/otp testing can be frequent. Keep production strict (e.g. 30), 
    // but relax local development to avoid 429 when testing flows.
    max: config.nodeEnv === 'development' ? Math.max(config.authRateLimitMax, 100) : config.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    }
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

