import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const genderEnum = z.enum(['male', 'female', 'other', 'prefer-not-to-say']);

const isoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)');

const schema = z.object({
    name: z.string().max(200).optional(),
    email: z.string().email().max(200).optional(),
    phone: z.string().max(30).optional(),
    profileImage: z.string().max(2000).optional(),
    dateOfBirth: isoDate.optional(),
    anniversary: isoDate.optional(),
    gender: genderEnum.optional(),
    alternatePhone: z.string().max(30).optional(),
    addressLine1: z.string().max(300).optional(),
    addressLine2: z.string().max(300).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    pincode: z.string().max(20).optional(),
    language: z.string().max(50).optional(),
    timezone: z.string().max(100).optional(),
    preferences: z.object({
        theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
        notifications: z.object({
            email: z.boolean().optional(),
            sms: z.boolean().optional(),
            push: z.boolean().optional()
        }).optional(),
        currency: z.string().max(10).optional()
    }).optional()
});

export const validateUserProfileUpdateDto = (body) => {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        const msg = result.error.errors[0]?.message || 'Invalid profile data';
        throw new ValidationError(msg);
    }
    return result.data;
};

