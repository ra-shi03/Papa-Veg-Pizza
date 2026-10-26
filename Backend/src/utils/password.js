import crypto from 'crypto';
import { ValidationError } from '../core/auth/errors.js';

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt only uses the first 72 bytes; longer input would be silently truncated.
const MAX_PASSWORD_LENGTH = 72;

export const isBcryptHash = (value) =>
    typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

export const assertPasswordStrength = (password, label = 'Password') => {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw new ValidationError(`${label} must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    if (Buffer.byteLength(password) > MAX_PASSWORD_LENGTH) {
        throw new ValidationError(`${label} must be at most ${MAX_PASSWORD_LENGTH} characters`);
    }
};

// Random one-time password for accounts created by an admin. No look-alike characters (0/O, 1/l/I).
// Show it to the admin once in the API response; only the bcrypt hash is stored.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';

export const generateTempPassword = (length = 12) => {
    const all = UPPER + LOWER + DIGITS;
    const pick = (set) => set[crypto.randomInt(set.length)];
    const chars = [pick(UPPER), pick(LOWER), pick(DIGITS)];
    while (chars.length < length) chars.push(pick(all));
    for (let i = chars.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
};
