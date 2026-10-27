import express from 'express';
import { safeUpload } from '../../../../middleware/safeUpload.js';
import {
    listAddressesController,
    addAddressController,
    updateAddressController,
    deleteAddressController,
    setDefaultAddressController
} from '../controllers/userAddress.controller.js';
import {
    getCurrentUserProfileController,
    updateCurrentUserProfileController,
    uploadCurrentUserProfileImageController
} from '../controllers/userProfile.controller.js';
import {
    getUserWalletController,
    createWalletTopupOrderController,
    verifyWalletTopupPaymentController,
    enrollUserInRewardsController,
    quitUserRewardsController,
    getMyWalletController,
    listMyWalletTransactionsController,
    getMyWalletTransactionController,
    reserveWalletPaymentController,
    confirmWalletPaymentController,
    releaseWalletPaymentController,
    getMyRewardsController,
    listMyRewardTransactionsController,
    enrollRewardsController,
    quitRewardsController,
    requestRefundController,
    listMyRefundsController,
    getMyRefundController
} from '../controllers/userWallet.controller.js';
import {
    getUserReferralDetailsController,
    getUserReferralStatsController
} from '../controllers/userReferral.controller.js';
import {
    createSafetyEmergencyReportController,
    listMySafetyEmergencyReportsController
} from '../controllers/userSafetyEmergency.controller.js';
import {
    createSupportTicketController,
    listMySupportTicketsController
} from '../controllers/supportTicket.controller.js';
import { deleteUserAccountController } from '../controllers/deleteAccount.controller.js';

const router = express.Router();

router.get('/profile', getCurrentUserProfileController);
router.patch('/profile', updateCurrentUserProfileController);
// Customers can reach this: images only (5 MB, type checked against the file signature)
router.post('/profile/profile-image', safeUpload('image', 'file'), uploadCurrentUserProfileImageController);

// Wallet (Bearer USER)
router.get('/wallet', getUserWalletController);
router.post('/wallet/enroll', enrollUserInRewardsController);
router.post('/wallet/quit', quitUserRewardsController);
router.post('/wallet/topup/order', createWalletTopupOrderController);
router.post('/wallet/topup/verify', verifyWalletTopupPaymentController);

// Refund wallet (money) — scoped to the authenticated user only
router.get('/wallet/me', getMyWalletController);
router.get('/wallet/transactions', listMyWalletTransactionsController);
router.get('/wallet/transactions/:id', getMyWalletTransactionController);
router.post('/wallet/payments/reserve', reserveWalletPaymentController);
router.post('/wallet/payments/:id/confirm', confirmWalletPaymentController);
router.post('/wallet/payments/:id/release', releaseWalletPaymentController);

// Cheesy Rewards (points) — separate from the wallet
router.get('/rewards/me', getMyRewardsController);
router.get('/rewards/transactions', listMyRewardTransactionsController);
router.post('/rewards/enroll', enrollRewardsController);
router.post('/rewards/quit', quitRewardsController);

// Refund requests (approval + crediting happen only in the admin workflow)
router.post('/refunds', requestRefundController);
router.get('/refunds', listMyRefundsController);
router.get('/refunds/:id', getMyRefundController);

// Referral stats (Bearer USER)
router.get('/referrals/stats', getUserReferralStatsController);
router.get('/referrals/details', getUserReferralDetailsController);

// Safety / Emergency reports (Bearer USER)
router.post('/safety-emergency-reports', createSafetyEmergencyReportController);
router.get('/safety-emergency-reports', listMySafetyEmergencyReportsController);

// Support tickets (Bearer USER)
router.post('/support/ticket', createSupportTicketController);
router.get('/support/my-tickets', listMySupportTicketsController);

router.get('/addresses', listAddressesController);
router.post('/addresses', addAddressController);
router.patch('/addresses/:addressId', updateAddressController);
router.delete('/addresses/:addressId', deleteAddressController);
router.patch('/addresses/:addressId/default', setDefaultAddressController);

// Delete account (Bearer USER)
router.delete('/account', deleteUserAccountController);

export default router;
