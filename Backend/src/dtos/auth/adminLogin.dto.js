import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const schema = z.object({
    email: z.string().email('Invalid email').optional(),
    mobile: z.string().trim().min(8, 'Invalid mobile number').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.email || data.mobile, {
    message: 'Email or mobile is required',
    path: ['email']
});

export const validateAdminLoginDto = (body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error.errors[0].message);
    }
    return result.data;
};

