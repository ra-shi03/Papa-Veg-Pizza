import { ValidationError } from '../../../../core/auth/errors.js';
import { FoodOfferClaim } from '../models/offerClaim.model.js';

// Spends limited-time-offer claims on an order: a token can be used by one order only (unique jti),
// and the row records which order took it.
export async function spendOfferClaims(userId, claims, orderId) {
  const spent = [];
  try {
    for (const claim of claims) {
      await FoodOfferClaim.create({ jti: claim.jti, userId, orderId, expiresAt: claim.expiresAt });
      spent.push(claim.jti);
    }
  } catch (err) {
    await releaseOfferClaims(spent);
    if (err?.code === 11000) throw new ValidationError('This limited time offer has already been used.');
    throw err;
  }
  return spent;
}

// Gives claims back when the order they were spent on could not be saved.
export async function releaseOfferClaims(jtis) {
  if (jtis?.length) await FoodOfferClaim.deleteMany({ jti: { $in: jtis } }).catch(() => {});
}
