// Store manager: a customer's wallet and rewards, handing over a reward claimed with a code, and wallet refunds that
// the franchise admin approves. The reward items and their points come from the super admin's rewards settings.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let RewardConfig; let RewardMembership; let RewardRedemption; let FoodOrder; let Refund; let credit;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const ITEM = 'pizza-1';

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ RewardConfig } = await import('../src/modules/food/admin/models/rewardConfig.model.js'));
    ({ RewardMembership } = await import('../src/modules/food/user/models/rewardMembership.model.js'));
    ({ RewardRedemption } = await import('../src/modules/food/user/models/rewardRedemption.model.js'));
    ({ FoodOrder } = await import('../src/modules/food/orders/models/order.model.js'));
    ({ Refund } = await import('../src/core/payments/models/refund.model.js'));
    ({ creditWallet: credit } = await import('../src/modules/food/user/services/walletLedger.service.js'));
    await RewardConfig.create({ defaultPointsRequired: 600, rewardProducts: [{ productId: ITEM, name: 'Margherita', size: 'Regular', requiredPoints: 500, originalPrice: 199 }, { productId: 'pizza-2', name: 'Farmhouse', size: 'Large' }] });
    await RewardMembership.create({ userId: A.customerId, status: 'ACTIVE', pointsBalance: 1300, lifetimeEarned: 1300, enrolledAt: new Date(Date.now() - 86400000) });
});
after(async () => { await fx?.teardown(); });

const points = async () => (await RewardMembership.findOne({ userId: A.customerId }).lean()).pointsBalance;
const redeem = (productId = ITEM, token = A.customerToken) => fx.call('POST', '/v1/food/user/rewards/redeem', token, { productId });

describe('the customer claims a reward', () => {
    test('points are taken at the price the super admin set (the item\'s own, else the programme default)', async () => {
        const first = ok(await redeem(), 201).redemption;
        assert.match(first.code, /^\d{6}$/);
        assert.equal(first.points, 500);
        assert.equal(await points(), 800);
        const second = ok(await redeem('pizza-2'), 201).redemption;
        assert.equal(second.points, 600, 'no price on the item: the programme default');
        assert.equal(await points(), 200);
    });

    test('not enough points, an item that is not on the list, and too many unused codes are refused', async () => {
        assert.equal((await redeem()).status, 400);
        assert.equal((await redeem('nope')).status, 400);
        assert.equal(await points(), 200);
    });

    test('a customer cancels an unused code and gets the points back, once', async () => {
        const list = ok(await fx.call('GET', '/v1/food/user/rewards/redemptions', A.customerToken)).redemptions;
        const second = list.find((r) => r.product.productId === 'pizza-2');
        ok(await fx.call('POST', `/v1/food/user/rewards/redemptions/${second.id}/cancel`, A.customerToken, {}));
        assert.equal(await points(), 800);
        assert.equal((await fx.call('POST', `/v1/food/user/rewards/redemptions/${second.id}/cancel`, A.customerToken, {})).status, 400);
        assert.equal(await points(), 800);
        assert.equal((await fx.call('POST', `/v1/food/user/rewards/redemptions/${second.id}/cancel`, B.customerToken, {})).status, 400, 'not another customer\'s code');
    });

    test('a code that runs out gives the points back', async () => {
        const made = ok(await redeem('pizza-2'), 201).redemption; // 600 -> 200 left
        assert.equal(await points(), 200);
        await RewardRedemption.updateOne({ _id: made.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
        const list = ok(await fx.call('GET', '/v1/food/user/rewards/redemptions', A.customerToken)).redemptions;
        assert.equal(list.find((r) => r.id === made.id).status, 'EXPIRED');
        assert.equal(await points(), 800);
    });
});

describe('the store manager hands it over', () => {
    let code;
    before(async () => { code = ok(await redeem(), 201).redemption.code; }); // 800 -> 300

    test('only a store manager can look a code up, and it shows what was claimed', async () => {
        assert.equal((await fx.call('GET', `/v1/food/store/rewards/codes/${code}`, A.customerToken)).status, 403);
        assert.equal((await fx.call('GET', `/v1/food/store/rewards/codes/${code}`, A.adminToken)).status, 403);
        const found = ok(await fx.call('GET', `/v1/food/store/rewards/codes/${code}`, A.managerToken)).redemption;
        assert.equal(found.product.name, 'Margherita');
        assert.equal(found.status, 'PENDING');
        assert.equal((await fx.call('GET', '/v1/food/store/rewards/codes/000000', A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', '/v1/food/store/rewards/codes/abc', A.managerToken)).status, 400);
    });

    test('confirming uses the code once and records the store; the points stay taken', async () => {
        const done = ok(await fx.call('POST', `/v1/food/store/rewards/codes/${code}/confirm`, A.managerToken, {})).redemption;
        assert.equal(done.status, 'REDEEMED');
        assert.equal(done.storeId, A.storeId);
        assert.equal((await fx.call('POST', `/v1/food/store/rewards/codes/${code}/confirm`, B.managerToken, {})).status, 400, 'already used, at any store');
        assert.equal(await points(), 300);
    });

    test('the store manager can cancel an unused code, with a reason; the points go back', async () => {
        await RewardMembership.updateOne({ userId: A.customerId }, { $inc: { pointsBalance: 500 } }); // 300 -> 800
        const c2 = ok(await redeem(), 201).redemption.code; // 800 -> 300
        assert.equal((await fx.call('POST', `/v1/food/store/rewards/codes/${c2}/cancel`, A.managerToken, {})).status, 400, 'a reason is required');
        ok(await fx.call('POST', `/v1/food/store/rewards/codes/${c2}/cancel`, A.managerToken, { reason: 'Item not available today' }));
        assert.equal(await points(), 800);
        await RewardMembership.updateOne({ userId: A.customerId }, { $set: { pointsBalance: 300 } });
    });
});

describe('the customer\'s wallet and rewards in the store panel', () => {
    test('a store manager sees their own store\'s customer, nobody else\'s', async () => {
        await credit({ userId: A.customerId, amountPaise: 25000, reason: 'TOPUP', idempotencyKey: 'rr:1', description: 'Seed' });
        const data = ok(await fx.call('GET', `/v1/food/store/rewards/customers/${A.customerId}`, A.managerToken));
        assert.equal(data.wallet.balance, 250);
        assert.equal(data.rewards.points, 300);
        assert.ok(data.walletTransactions.length >= 1 && data.rewardTransactions.length >= 1);
        assert.ok(data.redemptions.some((r) => r.status === 'REDEEMED'));
        assert.equal((await fx.call('GET', `/v1/food/store/rewards/customers/${A.customerId}`, B.managerToken)).status, 404, 'another store\'s manager');
        assert.equal((await fx.call('GET', `/v1/food/store/rewards/customers/${A.customerId}`, A.customerToken)).status, 403);
    });
});

describe('wallet refunds go to the franchise admin first', () => {
    let refundId;
    before(async () => {
        await FoodOrder.updateOne({ _id: A.orderId }, { $set: { orderStatus: 'delivered', 'pricing.total': 400 } });
    });

    test('the store manager asks; nothing is credited yet', async () => {
        const before = (await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance;
        const res = ok(await fx.call('POST', `/v1/store/orders/${A.orderId}/refund`, A.managerToken, { amount: 150, reason: 'Pizza arrived cold' }), 201);
        refundId = res.refund?._id || res._id || res.id;
        assert.ok(refundId, JSON.stringify(res));
        assert.equal((await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance, before);
    });

    test('it cannot go over the order total, counting what is waiting', async () => {
        assert.equal((await fx.call('POST', `/v1/store/orders/${A.orderId}/refund`, A.managerToken, { amount: 100, reason: 'again' })).status, 400, 'one is already in progress');
    });

    test('only the franchise admin of that store sees and decides it', async () => {
        const list = ok(await fx.call('GET', '/v1/food/franchise/refunds?status=pending', A.adminToken)).refunds;
        assert.equal(list.length, 1);
        assert.equal(list[0].amount, 150);
        assert.ok(list[0].orderNumber && list[0].storeName);
        assert.deepEqual(ok(await fx.call('GET', '/v1/food/franchise/refunds', B.adminToken)).refunds, [], 'another franchise sees none');
        assert.equal((await fx.call('POST', `/v1/food/franchise/refunds/${refundId}/approve`, B.adminToken, {})).status, 404);
        assert.equal((await fx.call('GET', '/v1/food/franchise/refunds', A.managerToken)).status, 403);
        assert.equal((await fx.call('GET', '/v1/food/franchise/refunds', A.customerToken)).status, 403);
    });

    test('approving credits the wallet once', async () => {
        const before = (await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance;
        ok(await fx.call('POST', `/v1/food/franchise/refunds/${refundId}/approve`, A.adminToken, {}));
        assert.equal((await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance, before + 150);
        assert.equal((await fx.call('POST', `/v1/food/franchise/refunds/${refundId}/approve`, A.adminToken, {})).status, 400, 'not twice');
        assert.equal((await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance, before + 150);
    });

    test('a rejection needs a reason and credits nothing', async () => {
        const res = ok(await fx.call('POST', `/v1/store/orders/${A.orderId}/refund`, A.managerToken, { amount: 100, reason: 'second' }), 201);
        const id = res.refund?._id || res._id || res.id;
        assert.equal((await fx.call('POST', `/v1/food/franchise/refunds/${id}/reject`, A.adminToken, {})).status, 400);
        const before = (await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance;
        ok(await fx.call('POST', `/v1/food/franchise/refunds/${id}/reject`, A.adminToken, { reason: 'Already compensated' }));
        assert.equal((await fx.call('GET', '/v1/food/user/wallet/me', A.customerToken)).body.data.wallet.balance, before);
        const refund = await Refund.findById(id).lean();
        assert.equal(refund.status, 'rejected');
    });
});
