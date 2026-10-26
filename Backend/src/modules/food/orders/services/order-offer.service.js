import { ValidationError } from '../../../../core/auth/errors.js';
import { verifyOfferClaim } from '../../settings/controllers/cartConfig.controller.js';

// Items carrying an offerToken get their price from the signed claim, never from the client.
export function applyLimitedOffer(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (!item?.offerToken) return item;
    const trustedPrice = verifyOfferClaim(item.offerToken, item.itemId);
    if (trustedPrice === null) {
      throw new ValidationError('The limited time offer has expired. Please remove it from your cart.');
    }
    const { offerToken, ...rest } = item;
    return { ...rest, price: trustedPrice, quantity: 1, isLimitedOffer: true };
  });
}
