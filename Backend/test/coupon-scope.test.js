// One place rule for coupons: the public list (/food/offers/public) and checkout (/food/orders/calculate) both use
// couponAppliesAtPlace. A coupon limited to a store, a franchise, a zone, a region or a territory shows for a store inside
// that scope and not for one outside, and the list agrees with checkout in every case. The list carries no scope ids.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let pizza;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const oid = () => new mongoose.Types.ObjectId();
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const ZONE = oid(); const OTHER_ZONE = oid(); const REGION = oid(); const TERRITORY = oid();

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    const { StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js');
    const { FoodCoupon } = await import('../src/modules/food/settings/models/foodCoupon.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: oid(), status: 'Active', price: 250 });
    await FoodFeeSettings.create({ platformFee: 0, packagingFee: 0, handlingFee: 0, deliveryFee: 0, gstRate: 0, isActive: true });
    const week = Object.fromEntries(DAYS.map((d) => [d, { open: '00:00', close: '23:59', isClosed: false }]));
    for (const s of [A, B]) await StoreHours.findOneAndUpdate({ storeId: s.storeId }, { $set: { week, holidays: [] } }, { upsert: true });
    // store A sits in ZONE / REGION / TERRITORY; store B in another zone
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { zoneId: ZONE, regionId: REGION, territoryId: TERRITORY } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { zoneId: OTHER_ZONE } });
    const day = 86400000;
    const base = { couponType: 'Flat Amount', value: 20, usagePerCustomer: 0, status: 'active', isActive: true, startDate: new Date(Date.now() - day), endDate: new Date(Date.now() + 30 * day) };
    await FoodCoupon.insertMany([
        { code: 'GLOBAL', title: 'Everyone', ...base },
        { code: 'STOREA', title: 'Store A only', ...base, storeIds: [A.storeId] },
        { code: 'FRANA', title: 'Franchise A only', ...base, franchiseIds: [A.franchiseId] },
        { code: 'ZONEA', title: 'Zone of store A', ...base, zoneIds: [String(ZONE)] },
        { code: 'REGIONA', title: 'Region of store A', ...base, regionIds: [String(REGION)] },
        { code: 'TERRA', title: 'Territory of store A', ...base, territoryIds: [String(TERRITORY)] },
        { code: 'BOTH', title: 'Franchise A and zone A', ...base, franchiseIds: [A.franchiseId], zoneIds: [String(ZONE)] },
        { code: 'MIXED', title: 'Franchise A but the other zone', ...base, franchiseIds: [A.franchiseId], zoneIds: [String(OTHER_ZONE)] },
        { code: 'STOREB', title: 'Store B only', ...base, storeIds: [B.storeId] },
        { code: 'ZONEB', title: 'Other zone', ...base, zoneIds: [String(OTHER_ZONE)] },
    ]);
});
after(async () => { await fx?.teardown(); });

const listed = async (storeId) => ok(await fx.call('GET', `/v1/food/offers/public${storeId ? `?storeId=${storeId}` : ''}`)).allOffers.map((o) => o.couponCode).sort();
/** Does checkout take the coupon off for this store? */
const checkoutAccepts = async (f, code) => {
    const q = ok(await fx.call('POST', '/v1/food/orders/calculate', f.customerToken, {
        storeId: f.storeId, couponCode: code, items: [{ itemId: String(pizza._id), name: 'Margherita', price: 250, quantity: 2, kind: 'product' }],
    })).pricing;
    return q.discount > 0;
};

describe('the public list follows the place rule', () => {
    test('without a store: global coupons only', async () => {
        assert.deepEqual(await listed(), ['GLOBAL']);
    });
    test('store A: global, its own store, its franchise, zone, region and territory; not the other store\'s', async () => {
        assert.deepEqual(await listed(A.storeId), ['BOTH', 'FRANA', 'GLOBAL', 'REGIONA', 'STOREA', 'TERRA', 'ZONEA']);
    });
    test('store B (another franchise, another zone): global, its own store and its zone only', async () => {
        assert.deepEqual(await listed(B.storeId), ['GLOBAL', 'STOREB', 'ZONEB']);
    });
    test('a coupon that needs two places needs both: franchise A in zone A shows, franchise A in another zone does not', async () => {
        assert.ok((await listed(A.storeId)).includes('BOTH'));
        assert.ok(!(await listed(A.storeId)).includes('MIXED'));
        assert.ok(!(await listed(B.storeId)).includes('MIXED'));
    });
    test('an unknown store id shows global coupons only', async () => {
        assert.deepEqual(await listed(String(oid())), ['GLOBAL']);
    });
});

describe('the list and checkout agree', () => {
    const CODES = ['GLOBAL', 'STOREA', 'FRANA', 'ZONEA', 'REGIONA', 'TERRA', 'BOTH', 'MIXED', 'STOREB', 'ZONEB'];
    for (const [name, key] of [['store A', 'A'], ['store B', 'B']]) {
        test(`${name}: a coupon is listed exactly when checkout takes it off`, async () => {
            const f = fx.F[key];
            const shown = await listed(f.storeId);
            for (const code of CODES) assert.equal(await checkoutAccepts(f, code), shown.includes(code), `${code} at ${name}`);
        });
    }
});

describe('no scope ids in the response', () => {
    test('display fields only', async () => {
        const body = ok(await fx.call('GET', `/v1/food/offers/public?storeId=${A.storeId}`));
        const keys = new Set(body.allOffers.flatMap((o) => Object.keys(o)));
        assert.deepEqual([...keys].sort(), ['_id', 'couponCode', 'customerScope', 'description', 'discountType', 'discountValue', 'endDate', 'id', 'maxDiscount', 'minOrderValue', 'startDate', 'status', 'title']);
        const text = JSON.stringify(body);
        for (const leak of [A.storeId, B.storeId, A.franchiseId, String(ZONE), String(REGION), String(TERRITORY), 'storeIds', 'franchiseIds', 'zoneIds', 'regionIds', 'territoryIds', 'createdBy', 'usageCount']) assert.ok(!text.includes(leak), `leaked ${leak}`);
    });
});
