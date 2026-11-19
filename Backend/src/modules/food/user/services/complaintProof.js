import { config } from '../../../../config/env.js';

// Proof photos a customer attaches to a complaint. Only images that went through our own upload endpoint
// (Cloudinary, the customers' upload folder) are kept: a link to any other site is dropped, so a complaint can
// never be used to show an arbitrary page or tracking image to store staff.
export const MAX_PROOF_PHOTOS = 3;

export function ourProofImage(value) {
    try {
        const url = new URL(String(value || ''));
        const cloud = config.cloudinaryCloudName;
        return url.protocol === 'https:' &&
            url.hostname === 'res.cloudinary.com' &&
            cloud &&
            url.pathname.startsWith(`/${cloud}/image/upload/`) &&
            url.pathname.includes('/customers/uploads/')
            ? url.toString()
            : '';
    } catch {
        return '';
    }
}

/** The usable photos out of whatever the client sent: our images only, no repeats, at most MAX_PROOF_PHOTOS. */
export function cleanProofImages(list) {
    if (!Array.isArray(list)) return [];
    return [...new Set(list.map(ourProofImage).filter(Boolean))].slice(0, MAX_PROOF_PHOTOS);
}
