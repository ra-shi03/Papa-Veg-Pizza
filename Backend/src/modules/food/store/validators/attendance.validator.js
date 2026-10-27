import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

// Request bodies for shifts, attendance and the profile screens. Unknown keys are dropped, so a body can never carry
// storeId, franchiseId, userId, markedBy or hours the server works out itself.

const parse = (schema, body) => {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        const issue = result.error.issues[0];
        throw new ValidationError(`${issue.path.join('.') || 'body'}: ${issue.message}`);
    }
    return result.data;
};

const id = z.string().trim().regex(/^[a-f0-9]{24}$/i, 'must be a valid id');
const optionalId = z.preprocess((v) => (v === '' || v === 'All' ? null : v), id.nullish());
const clock = z.string().trim().regex(/^\d{1,2}:\d{2}(\s?[AaPp][Mm])?$/, 'must be a time like 09:00 AM or 21:30');
const optionalClock = z.preprocess((v) => (v === '' || v === undefined ? null : v), clock.nullable());
const dateKey = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a date like 2026-06-25');
const num = (min, max) => z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().finite().min(min).max(max));
const STATUS = z.enum(['present', 'absent', 'half_day', 'leave']);

// ---- shifts ----
const shiftFields = {
    shiftName: z.string().trim().min(1).max(60),
    startTime: clock,
    endTime: clock,
    breakMinutes: num(0, 240),
    maxStaff: num(1, 200),
    description: z.string().trim().max(300),
    status: z.enum(['active', 'inactive']),
};
export const validateCreateShift = (body) => parse(z.object({
    shiftName: shiftFields.shiftName, startTime: shiftFields.startTime, endTime: shiftFields.endTime,
    breakMinutes: shiftFields.breakMinutes.optional().default(0), maxStaff: shiftFields.maxStaff.optional().default(5),
    description: shiftFields.description.optional().default(''),
}), body);
export const validateUpdateShift = (body) => parse(z.object({
    shiftName: shiftFields.shiftName.optional(), startTime: shiftFields.startTime.optional(), endTime: shiftFields.endTime.optional(),
    breakMinutes: shiftFields.breakMinutes.optional(), maxStaff: shiftFields.maxStaff.optional(),
    description: shiftFields.description.optional(), status: shiftFields.status.optional(),
}), body);
export const validateAssignStaff = (body) => parse(z.object({ staffIds: z.array(id).max(200) }), body);

// ---- attendance ----
export const validateMarkAttendance = (body) => parse(z.object({
    staffId: id,
    shiftId: optionalId,
    date: dateKey,
    checkIn: optionalClock.optional(),
    checkOut: optionalClock.optional(),
    status: STATUS,
    notes: z.string().trim().max(300).optional().default(''),
}), body);
export const validateBulkAttendance = (body) => parse(z.object({
    date: dateKey,
    shiftId: optionalId,
    attendances: z.array(z.object({ staffId: id, status: STATUS })).min(1).max(200),
}), body);
export const validateUpdateAttendance = (body) => parse(z.object({
    shiftId: optionalId.optional(),
    date: dateKey.optional(),
    checkIn: optionalClock.optional(),
    checkOut: optionalClock.optional(),
    status: STATUS.optional(),
    notes: z.string().trim().max(300).optional(),
}), body);
export const validateAttendanceQuery = (query) => parse(z.object({
    date: dateKey.optional(),
    from: dateKey.optional(),
    to: dateKey.optional(),
    shiftId: z.preprocess((v) => (v === '' || v === 'All' ? undefined : v), id.optional()),
    status: z.preprocess((v) => (v === '' || v === 'All' ? undefined : v), STATUS.optional()),
    search: z.string().trim().max(60).optional(),
    role: z.string().trim().max(60).optional(),
    limit: num(1, 500).optional(),
}), query);

// ---- profile ----
const phone = z.string().trim().regex(/^\+?[\d\s-]{7,16}$/, 'must be a phone number');
export const validatePersonalProfile = (body) => parse(z.object({
    fullName: z.string().trim().min(2).max(80).optional(),
    phone: phone.optional(),
    gender: z.string().trim().max(20).optional(),
    dateOfBirth: z.preprocess((v) => (v === '' ? undefined : v), dateKey.optional()),
    address: z.string().trim().max(300).optional(),
    emergencyContact: z.object({
        name: z.string().trim().max(80).optional(),
        phone: z.string().trim().max(20).optional(),
        relation: z.string().trim().max(40).optional(),
    }).optional(),
}), body);
export const validateChangePassword = (body) => parse(z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(1).max(200),
    confirmPassword: z.string().max(200).optional(),
    // the caller's own refresh token, so this session stays signed in while every other one is signed out
    refreshToken: z.string().max(4000).optional(),
}).refine((b) => b.confirmPassword === undefined || b.confirmPassword === b.newPassword, { message: 'passwords do not match', path: ['confirmPassword'] }), body);
export const validateNotifications = (body) => parse(z.object({
    orderAlerts: z.boolean().optional(),
    inventoryAlerts: z.boolean().optional(),
    shiftAlerts: z.boolean().optional(),
    complaintAlerts: z.boolean().optional(),
    dailyReports: z.boolean().optional(),
    smsAlerts: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
}), body);
