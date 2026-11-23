import { sendResponse } from '../../../../utils/response.js';
import { couponHistoryFor, couponStoreFromQuery } from '../../settings/services/couponOffer.service.js';

/**
 * GET /food/user/coupons/history[?storeId= | ?lat=&lng=] : the signed-in customer's Expired and Redeemed coupon tabs.
 * Coupons come only from Marketing > Coupons; "expired" uses the same store rule as the live list.
 */
export const getMyCouponHistoryController = async (req, res, next) => {
    try {
        const storeId = await couponStoreFromQuery(req.query);
        const data = await couponHistoryFor(req.user?.userId, storeId);
        res.set('Cache-Control', 'no-store');
        return sendResponse(res, 200, 'Coupon history fetched successfully', data);
    } catch (error) {
        next(error);
    }
};
