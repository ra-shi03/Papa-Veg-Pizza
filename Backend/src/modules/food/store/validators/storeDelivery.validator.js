import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

const parse = (schema, body) => {
    const result = schema.safeParse(body ?? {});
    if (!result.success) {
        const issue = result.error.issues[0];
        throw new ValidationError(`${issue.path.join('.') || 'body'}: ${issue.message}`);
    }
    return result.data;
};

const id = z.string().trim().min(1).max(64);
const money = z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(0).max(1000000).optional());

export const validateAssignDto = (body) => parse(z.object({ orderId: id, riderId: id }), body);
export const validateCreateIssueDto = (body) => parse(z.object({
    orderId: id,
    riderId: id.nullish(),
    issueType: z.string().trim().min(1).max(80),
    description: z.string().max(1000).optional().default(''),
    reportedBy: z.string().trim().max(60).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
}), body);
export const validateResolveIssueDto = (body) => parse(z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'escalated', 'closed']).optional(),
    resolution: z.string().max(1000).optional(),
    refundAmount: money,
    penaltyAmount: money,
    reassignRiderId: id.nullish(),
}), body);
export const validateRefundDto = (body) => parse(z.object({ reason: z.string().trim().max(500).optional(), amount: money }), body);
