import mongoose from 'mongoose';
import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';
import { COMBO_TYPES, COMBO_STATUSES, COMBO_WEEKDAYS } from '../models/combo.model.js';

const objectId = z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid id');
const optionalObjectId = z.union([objectId, z.literal(''), z.null()]).optional().transform((v) => v || null);
const optionalDate = z.union([z.string(), z.null()]).optional().transform((v, ctx) => {
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date' });
        return z.NEVER;
    }
    return d;
});
const timeOfDay = z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm'), z.literal('')]).optional();

const choiceSchema = z.object({
    productId: optionalObjectId,
    addonId: optionalObjectId,
    name: z.string().trim().min(1, 'Choice name is required').max(200),
    size: z.string().trim().max(50).optional().default('')
});

const itemSchema = z.object({
    productId: optionalObjectId,
    addonId: optionalObjectId,
    name: z.string().trim().min(1, 'Item name is required').max(200),
    size: z.string().trim().max(50).optional().default(''),
    quantity: z.coerce.number().int().min(1).max(50).optional().default(1),
    unitPrice: z.coerce.number().min(0).optional().default(0),
    choices: z.array(choiceSchema).max(20).optional().default([])
});

const baseSchema = z.object({
    name: z.string().trim().min(1, 'Combo name is required').max(200),
    description: z.string().trim().max(2000).optional().default(''),
    image: z.string().trim().max(2000).optional().default(''),
    badge: z.string().trim().max(50).optional().default(''),
    comboType: z.enum(COMBO_TYPES).optional().default('meal'),
    categoryId: optionalObjectId,
    items: z.array(itemSchema).min(1, 'At least one item is required').max(30),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    originalPrice: z.coerce.number().min(0).optional().default(0),
    discountType: z.enum(['fixed', 'percentage', 'flat']).optional().default('fixed'),
    discountValue: z.coerce.number().min(0).optional().default(0),
    validFrom: optionalDate,
    validTo: optionalDate,
    weeklyRestrictions: z.array(z.enum(COMBO_WEEKDAYS)).optional().default([]),
    timeWindowStart: timeOfDay.default(''),
    timeWindowEnd: timeOfDay.default(''),
    applicabilityType: z.enum(['all', 'franchises', 'stores']).optional().default('all'),
    applicableFranchises: z.array(objectId).optional().default([]),
    applicableStores: z.array(objectId).optional().default([]),
    status: z.enum(COMBO_STATUSES).optional().default('active'),
    sortOrder: z.coerce.number().int().optional().default(0)
});

const upsertSchema = baseSchema.superRefine((data, ctx) => {
    if (data.validFrom && data.validTo && data.validTo <= data.validFrom) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['validTo'], message: 'Valid To must be later than Valid From' });
    }
    if (Boolean(data.timeWindowStart) !== Boolean(data.timeWindowEnd)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timeWindowEnd'], message: 'Provide both daily window start and end' });
    }
    if (data.applicabilityType === 'franchises' && data.applicableFranchises.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['applicableFranchises'], message: 'Select at least one franchise' });
    }
    if (data.applicabilityType === 'stores' && data.applicableStores.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['applicableStores'], message: 'Select at least one store' });
    }
});

const statusSchema = z.object({ status: z.enum(COMBO_STATUSES) });

const bulkSchema = z.object({
    ids: z.array(objectId).min(1, 'Select at least one combo'),
    action: z.enum(['activate', 'deactivate', 'archive', 'delete'])
});

const parse = (schema, body) => {
    const result = schema.safeParse(body || {});
    if (!result.success) {
        throw new ValidationError(result.error.errors?.[0]?.message || 'Invalid combo payload');
    }
    return result.data;
};

export const validateComboUpsert = (body) => parse(upsertSchema, body);
export const validateComboStatus = (body) => parse(statusSchema, body);
export const validateComboBulk = (body) => parse(bulkSchema, body);
