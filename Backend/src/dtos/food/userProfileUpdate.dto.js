import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const genderEnum = z.enum(['male', 'female', 'other', 'prefer-not-to-say']);

const isoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)');

const schema = z.object({
    name: z.string().max(200).nullable().optional(),
    email: z.string().email().max(200).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    profileImage: z.string().max(2000).nullable().optional(),
    dateOfBirth: isoDate.nullable().optional(),
    anniversary: isoDate.nullable().optional(),
    gender: genderEnum.nullable().optional(),
    alternatePhone: z.string().max(30).nullable().optional(),
    addressLine1: z.string().max(300).nullable().optional(),
    addressLine2: z.string().max(300).nullable().optional(),
    city: z.string().max(100).nullable().optional(),
    state: z.string().max(100).nullable().optional(),
    country: z.string().max(100).nullable().optional(),
    pincode: z.string().max(20).nullable().optional(),
    language: z.string().max(50).nullable().optional(),
    timezone: z.string().max(100).nullable().optional(),
    preferences: z.object({
        theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).nullable().optional(),
        notifications: z.object({
            email: z.boolean().nullable().optional(),
            sms: z.boolean().nullable().optional(),
            push: z.boolean().nullable().optional()
        }).nullable().optional(),
        currency: z.string().max(10).nullable().optional()
    }).nullable().optional()
});

export const validateUserProfileUpdateDto = (body) => {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        const msg = result.error.errors[0]?.message || 'Invalid profile data';
        throw new ValidationError(msg);
    }
    return result.data;
};

