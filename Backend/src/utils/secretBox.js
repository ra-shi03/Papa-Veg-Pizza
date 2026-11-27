import crypto from 'crypto';

// Encrypts values stored in the database (Developer > Env Managements). AES-256-GCM: the stored text cannot be read or
// altered without the key. The key comes from the server's own environment, never from the code: ENV_ENCRYPTION_KEY,
// else the JWT refresh / access secret (they are set on every working server and are not editable from the admin).

const keyMaterial = () => process.env.ENV_ENCRYPTION_KEY || process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || '';

/** True when the server has a key to encrypt with. */
export const canEncrypt = () => Boolean(keyMaterial());

const key = () => {
  const material = keyMaterial();
  if (!material) throw new Error('No encryption key on the server (set ENV_ENCRYPTION_KEY)');
  return crypto.createHash('sha256').update(String(material)).digest();
};

/** "gcm:<iv>:<tag>:<ciphertext>" (hex) */
export function seal(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  return `gcm:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${data.toString('hex')}`;
}

/** The original text, or null when it cannot be decrypted (wrong key, altered value). */
export function open(sealed) {
  try {
    const [scheme, ivHex, tagHex, dataHex] = String(sealed || '').split(':');
    if (scheme !== 'gcm') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
