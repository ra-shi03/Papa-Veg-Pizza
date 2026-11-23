// One coupon system (Marketing > Coupons, FoodCoupon) and one customer list rule:
// - /food/offers/public and /settings/coupons/public return the same coupons for the same store, display fields only;
// - the app-wide coupon switch empties both;
// - /food/user/coupons/history gives the Expired tab (this store's coupons that ended in the last 30 days) and the
//   Redeemed tab (coupons this customer used, `usedUp` at the per-customer limit), never another customer's.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let FoodCoupon; let FoodOfferUsage; let FoodAppConfig;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const day = 86400000;
const codes = (list) => list.map((o) => o.couponCode).sort();

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ FoodCoupon } = await import('../src/modules/food/settings/models/foodCoupon.model.js'));
    ({ FoodOfferUsage } = await import('../src/modules/food/admin/models/offerUsage.model.js'));
    ({ FoodAppConfig } = await import('../src/modules/food/settings/models/appConfig.model.js'));
    const base = { couponType: 'Flat Amount', value: 20, usagePerCustomer: 0, status: 'active', isActive: true, startDate: new Date(Date.now() - 60 * day) };
    await FoodCoupon.insertMany([
        { code: 'LIVEALL', title: 'Everyone', ...base, endDate: new Date(Date.now() + 30 * day) },
        { code: 'LIVEA', title: 'Store A', ...base, storeIds: [A.storeId], endDate: new Date(Date.now() + 30 * day) },
        { code: 'LIVEFRB', title: 'Franchise B', ...base, franchiseIds: [B.franchiseId], endDate: new Date(Date.now() + 30 * day) },
        { code: 'ONCEA', title: 'Once per customer', ...base, storeIds: [A.storeId], usagePerCustomer: 1, endDate: new Date(Date.now() + 30 * day) },
        { code: 'ENDEDA', title: 'Ended at A', ...base, storeIds: [A.storeId], endDate: new Date(Date.now() - 2 * day) },
        { code: 'ENDEDALL', title: 'Ended everywhere', ...base, endDate: new Date(Date.now() - 5 * day) },
        { code: 'ENDEDB', title: 'Ended at B', ...base, storeIds: [B.storeId], endDate: new Date(Date.now() - 2 * day) },
        { code: 'LONGAGO', title: 'Ended long ago', ...base, endDate: new Date(Date.now() - 45 * day) },
        { code: 'OFFLIVE', title: 'Switched off', ...base, isActive: false, endDate: new Date(Date.now() + 30 * day) },
    ]);
});
after(async () => { await fx?.teardown(); });

const offersList = async (q = '') => ok(await fx.call('GET', `/v1/food/offers/public${q}`)).allOffers;
const settingsList = async (q = '') => ok(await fx.call('GET', `/v1/settings/coupons/public${q}`));

describe('one live list for every customer screen', () => {
    test('both public endpoints list the same coupons for a store, by the checkout place rule', async () => {
        for (const f of [A, B]) {
            const q = `?storeId=${f.storeId}`;
            assert.deepEqual(codes(await settingsList(q)), codes(await offersList(q)));
        }
        assert.deepEqual(codes(await offersList(`?storeId=${A.storeId}`)), ['LIVEA', 'LIVEALL', 'ONCEA']);
        assert.deepEqual(codes(await offersList(`?storeId=${B.storeId}`)), ['LIVEALL', 'LIVEFRB']);
    });
    test('without a store (or with a location nothing resolves): coupons that apply everywhere only', async () => {
        assert.deepEqual(codes(await settingsList()), ['LIVEALL']);
        assert.deepEqual(codes(await offersList()), ['LIVEALL']);
        assert.deepEqual(codes(await offersList('?lat=abc&lng=')), ['LIVEALL']);
    });
    test('the settings list carries display fields only (no store / franchise ids or usage counts)', async () => {
        const list = await settingsList(`?storeId=${A.storeId}`);
        const text = JSON.stringify(list);
        for (const leak of ['storeIds', 'franchiseIds', 'usageCount', 'createdBy', A.storeId]) assert.ok(!text.includes(leak), `leaked ${leak}`);
    });
    test('the app-wide coupon switch empties both lists', async () => {
        await FoodAppConfig.updateOne({}, { $set: { couponEnabled: false } }, { upsert: true });
        try {
            assert.deepEqual(await offersList(`?storeId=${A.storeId}`), []);
            assert.deepEqual(await settingsList(`?storeId=${A.storeId}`), []);
        } finally {
            await FoodAppConfig.updateOne({}, { $set: { couponEnabled: true } });
        }
    });
});

describe('coupon history (Expired / Redeemed tabs)', () => {
    const history = async (f, token = f.customerToken) => ok(await fx.call('GET', `/v1/food/user/coupons/history?storeId=${f.storeId}`, token));

    test('expired: this store\'s coupons that ended in the last 30 days, marked expired', async () => {
        const { expired } = await history(A);
        assert.deepEqual(codes(expired), ['ENDEDA', 'ENDEDALL']);
        assert.ok(expired.every((o) => o.status === 'expired'));
        assert.deepEqual(codes((await history(B)).expired), ['ENDEDALL', 'ENDEDB']);
    });
    test('redeemed: what this customer used, usedUp at the per-customer limit; nobody else sees it', async () => {
        const live = await FoodCoupon.findOne({ code: 'LIVEALL' }).lean();
        const once = await FoodCoupon.findOne({ code: 'ONCEA' }).lean();
        const me = new mongoose.Types.ObjectId(A.customerId);
        await FoodOfferUsage.insertMany([
            { offerId: live._id, userId: me, count: 2, lastUsedAt: new Date(Date.now() - day) },
            { offerId: once._id, userId: me, count: 1, lastUsedAt: new Date() },
        ]);
        const { redeemed } = await history(A);
        assert.deepEqual(redeemed.map((o) => [o.couponCode, o.timesUsed, o.usedUp, o.status]), [['ONCEA', 1, true, 'redeemed'], ['LIVEALL', 2, false, 'redeemed']]);
        assert.deepEqual((await history(B)).redeemed, []);   // store B's customer is someone else
    });
    test('signed-in customers only', async () => {
        assert.equal((await fx.call('GET', '/v1/food/user/coupons/history')).status, 401);
        assert.equal((await fx.call('GET', '/v1/food/user/coupons/history', fx.SA)).status, 403);
    });
});
