import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

// Shapes of the request bodies. The rules on the values (limits, formats, who may do what) are in payout.service.js.
const text = (max) => z.string().max(max).optional();
const amount = z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a number')]).optional().nullable();

const schemas = {
  riderRequest: z.object({ storeId: z.string().max(24).optional() }),
  request: z.object({ amount, note: text(500) }),
  pay: z.object({ method: z.string().max(20), reference: z.string().max(60), proofUrl: text(500), amount, note: text(500) }),
  reject: z.object({ reason: z.string().max(300) }),
  notReceived: z.object({ note: z.string().max(500) }),
  resolve: z.object({ outcome: z.string().max(20), resolution: z.string().max(500) }),
  account: z.object({
    accountHolderName: text(100), accountNumber: text(30), ifscCode: text(20), bankName: text(100), upiId: text(260),
  }),
  salary: z.object({
    staffId: z.string().max(24), period: z.string().max(7), amount, method: z.string().max(20), reference: z.string().max(60), proofUrl: text(500), note: text(500),
  }),
  staffRequest: z.object({ period: z.string().max(7), note: text(500) }),
};

export function validatePayoutBody(name, body) {
  const result = schemas[name].safeParse(body || {});
  if (!result.success) {
    const issue = result.error.errors[0];
    throw new ValidationError(issue.path?.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message);
  }
  return result.data;
}
