import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

// Shapes of the request bodies. The rules on the values (who may, what is required to switch on) are in the services.
const flag = z.boolean().optional();
const key = z.string().max(300).optional();

const schemas = {
  settings: z.object({
    enabled: flag, pushOrders: flag, acceptStatusUpdates: flag, syncMenu: flag, syncStock: flag,
    restaurantId: z.string().max(60).optional(),
    appKey: key, appSecret: key, accessToken: key,
    clear: z.array(z.enum(['appKey', 'appSecret', 'accessToken'])).max(3).optional(),
  }).strict(),
  // Pet Pooja's own callback body: kept loose (their field names), only bounded in size
  callback: z.record(z.any()).refine((b) => JSON.stringify(b).length <= 20000, 'Body too large'),
};

export function validatePosBody(name, body) {
  const result = schemas[name].safeParse(body || {});
  if (!result.success) {
    const issue = result.error.errors[0];
    throw new ValidationError(issue.path?.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message);
  }
  return result.data;
}
