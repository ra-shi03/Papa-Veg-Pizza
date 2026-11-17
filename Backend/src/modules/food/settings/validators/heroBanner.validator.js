import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';
import { HERO_BANNER_KEYS } from '../models/heroBanner.model.js';

const text = (max) => z.string().trim().max(max).optional().default('');
// The image comes from the existing upload route (an https URL); the link is a screen of the app or an https URL.
const imageUrl = z.string().trim().max(1000).refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), 'Image must be an https URL (upload it first)').optional().default('');
const link = z.string().trim().max(300).refine((v) => v === '' || /^\/(?!\/)[A-Za-z0-9/_\-?=&%.#]*$/.test(v) || /^https:\/\/\S+$/i.test(v), 'Link must be an app path like /user/offers or an https URL').optional().default('');

const bannerSchema = z.object({ imageUrl, title: text(80), link, isActive: z.boolean().optional().default(true) });

export function validateHeroBannerKey(key) {
    if (!HERO_BANNER_KEYS.includes(String(key))) throw new ValidationError('Unknown banner');
    return String(key);
}

/** Only these four fields are read from the body; anything else (id, key, timestamps) is ignored. */
export function validateHeroBannerDto(body) {
    const result = bannerSchema.safeParse(body || {});
    if (!result.success) throw new ValidationError(result.error.errors?.[0]?.message || 'Validation failed');
    const dto = result.data;
    if (dto.isActive && !dto.imageUrl) throw new ValidationError('An active banner needs an image');
    return dto;
}
