import { z } from 'zod';
import { ValidationError } from '../../core/auth/errors.js';

const schema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

export const validateAdminChangePasswordDto = (body) => {
    const result = schema.safeParse(body);
    if (!result.success) {
        const msg = result.error.errors[0]?.message || 'Invalid password data';
        throw new ValidationError(msg);
    }
    return result.data;
};
