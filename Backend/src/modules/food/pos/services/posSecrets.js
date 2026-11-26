import crypto from 'crypto';
import { config } from '../../../../config/env.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// Pet Pooja keys at rest: AES-256-GCM, with a key derived from PAYMENT_SECRETS_KEY (the server's secret for saved
// credentials, already required in production). Outside production the JWT secret stands in when it is unset.
// A separate derivation label keeps these keys apart from the payment gateway's.
const keyFrom = (base) => crypto.createHash('sha256').update(`pos-integration:${base}`).digest();

const encryptionKey = () => {
    const own = process.env.PAYMENT_SECRETS_KEY || '';
    if (own) return keyFrom(own);
    if (config.nodeEnv === 'production') {
        throw new ValidationError('PAYMENT_SECRETS_KEY must be set on the server before Pet Pooja keys can be saved.');
    }
    if (!config.jwtAccessSecret) throw new Error('PAYMENT_SECRETS_KEY or JWT secret is required to store Pet Pooja keys');
    return keyFrom(config.jwtAccessSecret);
};

const decryptionKeys = () => [process.env.PAYMENT_SECRETS_KEY, config.jwtAccessSecret].filter(Boolean).map(keyFrom);

/** -> { value, last4, updatedAt } for the model's secret fields; an empty input clears it. */
export function sealSecret(plain) {
    const text = String(plain || '').trim();
    if (!text) return { value: '', last4: '', updatedAt: new Date() };
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return { value: [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.'), last4: text.slice(-4), updatedAt: new Date() };
}

/** The plain key, or '' when unset or unreadable (for example after the server secret changed). */
export function openSecret(sealed) {
    const packed = sealed?.value;
    if (!packed) return '';
    const [iv, tag, data] = String(packed).split('.').map((p) => Buffer.from(p, 'base64'));
    if (!iv || !tag || !data) return '';
    for (const key of decryptionKeys()) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);
            return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
        } catch {
            // wrong key: try the next one
        }
    }
    return '';
}

/** What a screen may see of a key: whether it is set, and its last 4 characters. */
export const secretView = (sealed) => ({ set: !!sealed?.value, last4: sealed?.value ? sealed.last4 || '' : '' });

/** A new unguessable callback key (64 hex characters). */
export const newCallbackKey = () => crypto.randomBytes(32).toString('hex');
