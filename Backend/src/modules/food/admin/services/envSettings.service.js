import { EnvSetting } from '../models/envSetting.model.js';
import { refreshConfig } from '../../../../config/env.js';
import { canEncrypt, open, seal } from '../../../../utils/secretBox.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { logger } from '../../../../utils/logger.js';

// Developer > Env Managements (safe version of the Jharkhand Rasoi page).
// - Only the low-risk keys below can be changed from the admin; they are stored encrypted and override the .env.
// - Secret values (API keys, passwords) are write-only: the page only learns whether one is set and its last 4
//   characters, and a blank field keeps the current value.
// - The database URL, JWT secrets, payment / storage / push credentials and USE_DEFAULT_OTP stay in the server's .env:
//   the page shows only whether each is configured.

const num = (min, max) => ({ type: 'number', min, max });
const EDITABLE = [
  // SMS gateway (OTP texts)
  { key: 'SMS_INDIA_HUB_USERNAME', group: 'SMS gateway', label: 'SMS India Hub username', type: 'text' },
  { key: 'SMS_INDIA_HUB_API_KEY', group: 'SMS gateway', label: 'SMS India Hub API key', type: 'secret' },
  { key: 'SMS_INDIA_HUB_SENDER_ID', group: 'SMS gateway', label: 'Sender ID', type: 'text' },
  { key: 'SMS_INDIA_HUB_DLT_TEMPLATE_ID', group: 'SMS gateway', label: 'DLT template ID', type: 'text' },
  // Email (SMTP)
  { key: 'EMAIL_HOST', group: 'Email (SMTP)', label: 'SMTP host', type: 'text' },
  { key: 'EMAIL_PORT', group: 'Email (SMTP)', label: 'SMTP port', ...num(1, 65535) },
  { key: 'EMAIL_USER', group: 'Email (SMTP)', label: 'SMTP user', type: 'text' },
  { key: 'EMAIL_PASS', group: 'Email (SMTP)', label: 'SMTP password', type: 'secret' },
  { key: 'EMAIL_FROM', group: 'Email (SMTP)', label: 'From address', type: 'email' },
  // OTP
  { key: 'OTP_EXPIRY_MINUTES', group: 'OTP', label: 'OTP expiry (minutes)', ...num(1, 60) },
  { key: 'OTP_EXPIRY_SECONDS', group: 'OTP', label: 'OTP expiry (seconds)', ...num(30, 3600) },
  { key: 'OTP_MAX_ATTEMPTS', group: 'OTP', label: 'OTP max attempts', ...num(1, 20) },
  { key: 'OTP_RATE_LIMIT', group: 'OTP', label: 'OTPs per window', ...num(1, 50) },
  { key: 'OTP_RATE_WINDOW', group: 'OTP', label: 'OTP window (seconds)', ...num(60, 86400) },
  // Rate limits
  { key: 'RATE_LIMIT_WINDOW', group: 'Rate limits', label: 'API window (minutes)', ...num(1, 1440) },
  { key: 'RATE_LIMIT_MAX', group: 'Rate limits', label: 'API requests per window', ...num(10, 100000) },
  { key: 'AUTH_RATE_LIMIT_WINDOW', group: 'Rate limits', label: 'Login window (minutes)', ...num(1, 1440) },
  { key: 'AUTH_RATE_LIMIT_MAX', group: 'Rate limits', label: 'Login requests per window', ...num(1, 10000) },
  { key: 'LOGIN_FAIL_MAX', group: 'Rate limits', label: 'Failed logins before lock', ...num(1, 100) },
  { key: 'OTP_VERIFY_FAIL_MAX', group: 'Rate limits', label: 'Failed OTP checks before lock', ...num(1, 100) },
  { key: 'FORGOT_OTP_MAX', group: 'Rate limits', label: 'Password-reset OTPs', ...num(1, 100) },
  // Public URL (Pet Pooja callbacks, locally stored images)
  { key: 'PUBLIC_API_URL', group: 'Server', label: 'Public API URL', type: 'url' },
];
const EDITABLE_BY_KEY = new Map(EDITABLE.map((e) => [e.key, e]));

// The .env values as the server started (before any database override), so "Reset" can put them back at once
const ORIGINAL = new Map(EDITABLE.map((e) => [e.key, process.env[e.key]]));

/** Shown as "configured / not configured" only: changing these from a web page is too dangerous. */
const READ_ONLY = [
  ['NODE_ENV', 'Environment'],
  ['MONGODB_URI', 'Database URL', ['MONGO_URI', 'MONGODB_URI']],
  ['JWT_ACCESS_SECRET', 'JWT access secret', ['JWT_ACCESS_SECRET', 'JWT_SECRET']],
  ['JWT_REFRESH_SECRET', 'JWT refresh secret'],
  ['RAZORPAY_KEY_ID', 'Razorpay key ID'],
  ['RAZORPAY_KEY_SECRET', 'Razorpay key secret'],
  ['RAZORPAY_WEBHOOK_SECRET', 'Razorpay webhook secret'],
  ['CLOUDINARY_CLOUD_NAME', 'Cloudinary cloud name'],
  ['CLOUDINARY_API_KEY', 'Cloudinary API key'],
  ['CLOUDINARY_API_SECRET', 'Cloudinary API secret'],
  ['FIREBASE_SERVICE_ACCOUNT', 'Firebase service account', ['FIREBASE_SERVICE_ACCOUNT', 'FIREBASE_SERVICE_ACCOUNT_PATH']],
  ['REDIS_URL', 'Redis URL'],
  ['FRONTEND_URL', 'Frontend URLs (CORS)'],
  ['USE_DEFAULT_OTP', 'Fixed test OTP'],
];

const lastFour = (value) => {
  const v = String(value || '');
  return v.length > 4 ? `••••${v.slice(-4)}` : '••••';
};

function validate(entry, raw) {
  const value = String(raw).trim();
  if (value.length > 500) throw new ValidationError(`${entry.label} is too long`);
  if (/[\r\n]/.test(value)) throw new ValidationError(`${entry.label} cannot contain line breaks`);
  if (entry.type === 'number') {
    const n = Number(value);
    if (!Number.isInteger(n) || n < entry.min || n > entry.max) throw new ValidationError(`${entry.label} must be a whole number from ${entry.min} to ${entry.max}`);
  }
  if (entry.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new ValidationError(`${entry.label} must be an email address`);
  if (entry.type === 'url' && !/^https?:\/\/[^\s]+$/i.test(value)) throw new ValidationError(`${entry.label} must start with http:// or https://`);
  return value;
}

/** Puts the stored overrides into process.env and the config. Called at startup and after a save. */
export async function loadEnvOverrides() {
  if (!canEncrypt()) return 0;
  const rows = await EnvSetting.find({ key: { $in: EDITABLE.map((e) => e.key) } }).lean();
  let applied = 0;
  for (const row of rows) {
    const value = open(row.value);
    if (value === null) {
      logger.warn(`Env Managements: could not decrypt ${row.key} (the encryption key changed?); using the .env value`);
      continue;
    }
    process.env[row.key] = value;
    applied += 1;
  }
  if (applied) refreshConfig();
  return applied;
}

/** What the page shows: editable keys (secrets masked), and the read-only keys' status. Never a secret's value. */
export async function getEnvSettings() {
  const overridden = new Set((await EnvSetting.find({}).select('key').lean()).map((r) => r.key));
  return {
    canEncrypt: canEncrypt(),
    editable: EDITABLE.map((e) => {
      const current = process.env[e.key];
      const isSet = current !== undefined && current !== '';
      return {
        key: e.key,
        group: e.group,
        label: e.label,
        type: e.type,
        ...(e.type === 'number' ? { min: e.min, max: e.max } : {}),
        // a secret's value never leaves the server
        value: e.type === 'secret' ? '' : (current || ''),
        isSet,
        preview: e.type === 'secret' && isSet ? lastFour(current) : '',
        isOverridden: overridden.has(e.key),
      };
    }),
    readOnly: READ_ONLY.map(([key, label, aliases]) => ({
      key,
      label: key === 'USE_DEFAULT_OTP' ? 'Fixed test OTP (on)' : label,
      // a switch is "configured" when it is on; everything else when it has a value
      configured: key === 'USE_DEFAULT_OTP'
        ? process.env.USE_DEFAULT_OTP === 'true'
        : (aliases || [key]).some((k) => process.env[k] !== undefined && process.env[k] !== ''),
    })),
  };
}

/**
 * Saves changes: { KEY: value } sets an override, { KEY: null } removes it (back to the .env value). An empty value
 * for a secret means "keep the current one". Unknown or read-only keys are refused.
 */
export async function updateEnvSettings(changes = {}, adminName = '') {
  if (!changes || typeof changes !== 'object') throw new ValidationError('Nothing to update');
  if (!canEncrypt()) throw new ValidationError('The server has no encryption key, so settings cannot be stored. Set ENV_ENCRYPTION_KEY in the .env.');
  const entries = Object.entries(changes);
  for (const [key] of entries) {
    if (!EDITABLE_BY_KEY.has(key)) throw new ValidationError(`${key} cannot be changed from the admin`);
  }
  const resetKeys = [];
  for (const [key, raw] of entries) {
    const entry = EDITABLE_BY_KEY.get(key);
    if (raw === null) {
      await EnvSetting.deleteOne({ key });
      if (ORIGINAL.get(key) === undefined) delete process.env[key];
      else process.env[key] = ORIGINAL.get(key);
      resetKeys.push(key);
      continue;
    }
    if (entry.type === 'secret' && String(raw).trim() === '') continue; // keep the current secret
    const value = validate(entry, raw);
    if (value === '') throw new ValidationError(`${entry.label} cannot be empty (use "Reset" to go back to the .env value)`);
    await EnvSetting.findOneAndUpdate({ key }, { value: seal(value), updatedBy: adminName }, { upsert: true, new: true });
    process.env[key] = value;
  }
  refreshConfig();
  return { ...(await getEnvSettings()), resetKeys };
}
