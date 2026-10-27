import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

// Request bodies of the Operating Hours and Store Pricing screens. Times and dates are checked again (and
// normalised) in the services; this only guards the shape.

const parse = (schema, body) => {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        const issue = result.error.issues[0];
        throw new ValidationError(`${issue.path.join('.') || 'body'}: ${issue.message}`);
    }
    return result.data;
};

const time = z.union([z.string().max(12), z.number()]).transform(String);
const id = z.string().trim().min(1).max(64);
const ids = z.array(id).max(500);
const day = z.object({ open: time.optional(), close: time.optional(), isClosed: z.boolean().optional() });

const weekSchema = z.object({
    monday: day.optional(), tuesday: day.optional(), wednesday: day.optional(), thursday: day.optional(),
    friday: day.optional(), saturday: day.optional(), sunday: day.optional()
});

const holidaySchema = z.object({
    date: z.string().min(1).max(40),
    reason: z.string().max(200).optional().default(''),
    isClosed: z.boolean().optional().default(true),
    open: time.optional(),
    close: time.optional()
});

const storeDaySchema = z.object({
    day: z.string().min(1).max(20),
    openTime: time.optional(),
    closeTime: time.optional(),
    isHoliday: z.boolean().optional()
});

const money = z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(0).max(1000000).optional());
const dateText = z.string().max(40).optional();

export const validateWeekDto = (body) => parse(weekSchema, body);
export const validateHolidaysDto = (body) => parse(z.object({ holidaySchedule: z.array(holidaySchema).max(200) }), body);
export const validateCopyHoursDto = (body) => parse(z.object({ sourceStoreId: id, destStoreId: id.optional(), destStoreIds: ids.optional() }), body);
export const validateBulkHoursDto = (body) => parse(z.object({
    storeIds: ids.min(1),
    weekdays: z.array(z.string().min(1).max(20)).min(1).max(7),
    open: time.optional(),
    close: time.optional(),
    isClosed: z.boolean().optional().default(false)
}), body);
export const validateStoreHoursDto = (body) => parse(z.object({ hours: z.union([z.array(storeDaySchema).max(7), z.object({}).passthrough()]).optional() }), body);
export const validateStoreStatusDto = (body) => parse(z.object({
    status: z.enum(['Active', 'Inactive', 'Closed']),
    isOpen: z.boolean().optional(),
    reason: z.string().max(300).optional(),
    startDate: dateText,
    endDate: dateText,
    comments: z.string().max(1000).optional()
}), body);

export const validatePricingDto = (body) => parse(z.object({
    smallPrice: money, mediumPrice: money, largePrice: money, deliveryPrice: money, takeawayPrice: money, dineInPrice: money, specialPrice: money,
    startDate: dateText.or(z.literal('')),
    endDate: dateText.or(z.literal('')),
    availability: z.enum(['AVAILABLE', 'UNAVAILABLE', 'PROMOTION ACTIVE']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    reason: z.string().max(300).optional()
}), body);
export const validateBulkPriceDto = (body) => parse(z.object({
    categoryId: z.string().max(64).optional(),
    increaseType: z.enum(['PERCENTAGE', 'FIXED', 'FLAT', 'AMOUNT']).optional().default('PERCENTAGE'),
    value: z.preprocess(Number, z.number().min(-100000).max(100000)),
    applyTo: z.string().max(40).optional(),
    selectedStoreIds: ids.optional(),
    selectedProductIds: ids.optional()
}), body);
export const validateCopyPricingDto = (body) => parse(z.object({
    sourceStoreId: id,
    destinationStoreIds: ids.min(1),
    copyAllProducts: z.boolean().optional().default(false),
    selectedProductIds: ids.optional()
}), body);
export const validateBulkActionDto = (body) => parse(z.object({
    pricingIds: z.array(z.string().max(80)).min(1).max(500),
    action: z.enum(['ENABLE', 'DISABLE', 'MARK_UNAVAILABLE', 'ACTIVATE_PROMOTION', 'DELETE_RULES']),
    payload: z.object({ startDate: dateText, endDate: dateText }).partial().optional().default({})
}), body);
