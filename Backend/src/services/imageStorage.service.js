import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { UploadSetting } from '../modules/food/admin/models/uploadSetting.model.js';

// Developer > Image Setting: images go to Cloudinary (default) or to this server's disk, served at /uploads.
// Only images are affected; videos and documents always go to Cloudinary (their download links rely on it).
// Local files live on one server: with several servers, or a host that replaces its disk on deploy, they can go missing.

export const isCloudinaryConfigured = () =>
  Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret);

/** The folder images are saved in, and the public base URL they are served from. */
export const localUploadRoot = () => path.resolve(config.uploadPath || 'uploads');
const publicBase = () => String(config.publicApiUrl || '').replace(/\/+$/, '');

/** Local storage needs a public API URL: the apps load the images from another domain. */
export const canStoreLocally = () => Boolean(publicBase());

let cache = { value: null, at: 0 };

/** The provider in use: the admin's choice, falling back to whatever can actually work. */
export async function getImageProvider() {
  if (cache.value && Date.now() - cache.at < 15000) return cache.value;
  let chosen = 'cloudinary';
  try {
    chosen = (await UploadSetting.findOne({ key: 'singleton' }).select('imageUploadProvider').lean())?.imageUploadProvider || 'cloudinary';
  } catch {
    // database unavailable: keep the default
  }
  const value = chosen === 'local' && canStoreLocally() ? 'local' : isCloudinaryConfigured() ? 'cloudinary' : canStoreLocally() ? 'local' : 'cloudinary';
  cache = { value, at: Date.now() };
  return value;
}

export async function setImageProvider(provider, adminName = '') {
  const doc = await UploadSetting.findOneAndUpdate(
    { key: 'singleton' },
    { imageUploadProvider: provider, updatedBy: adminName },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  cache = { value: null, at: 0 };
  return doc.imageUploadProvider;
}

/** The image type from the file's first bytes (not its name), or null for anything that is not a plain raster image. */
function sniffImage(buffer) {
  const b = buffer.subarray(0, 12);
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.toString('ascii', 0, 4) === 'GIF8') return 'gif';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null; // SVG and others: not stored locally (an SVG served from the API domain could run script)
}

/** Deletes a locally stored image by the public_id saveImageLocally gave it ("local:<folder>/<file>"). */
export async function deleteLocalImage(publicId) {
  const relative = String(publicId || '').replace(/^local:/, '');
  const file = path.resolve(localUploadRoot(), relative);
  if (!String(publicId).startsWith('local:') || !file.startsWith(localUploadRoot() + path.sep)) return false;
  await fs.unlink(file).catch(() => {});
  return true;
}

/**
 * Saves an image on this server when local storage is chosen and possible. Returns
 * { secure_url, public_id } (the shape of a Cloudinary result), or null to let the caller use Cloudinary.
 */
export async function saveImageLocally(buffer, folder = 'uploads') {
  if ((await getImageProvider()) !== 'local') return null;
  const ext = sniffImage(buffer);
  if (!ext) return null;
  const safeFolder = String(folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\.\./g, '').replace(/^\/+|\/+$/g, '') || 'uploads';
  const dir = path.join(localUploadRoot(), safeFolder);
  if (!dir.startsWith(localUploadRoot())) return null;
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(dir, name), buffer);
  const relative = `${safeFolder}/${name}`;
  return { secure_url: `${publicBase()}/uploads/${relative}`, public_id: `local:${relative}` };
}
