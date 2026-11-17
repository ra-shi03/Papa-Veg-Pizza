// Nearby stores: every approved, active store of every franchise within the radius the super admin set, nearest first.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

const ADMIN = '/v1/settings/order-methods';
const NEAR = '/v1/food/search/nearby-stores';
let fx; let A; let B; let FoodStore;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const near = async (qs) => ok(await fx.call('GET', `${NEAR}?${qs}`, null));
const methods = [{ id: 'delivery', enabled: true, scope: 'all' }];

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ FoodStore } = await import('../src/modules/food/store/models/store.model.js'));
    // store A at the customer's door, store B (another franchise) ~3 km away, a third far away in another city
    await FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: 22.7196, longitude: 75.8577, isActive: true } });
    await FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 22.7466, longitude: 75.8577, isActive: true } });
});
after(async () => { await fx?.teardown(); });

describe('nearby stores', () => {
    test('needs a position', async () => {
        assert.equal((await fx.call('GET', NEAR, null)).status, 400);
        assert.equal((await fx.call('GET', `${NEAR}?lat=abc&lng=1`, null)).status, 400);
    });

    test('stores of different franchises both show, nearest first, display fields only', async () => {
        const d = await near('lat=22.7196&lng=75.8577');
        assert.equal(d.radiusKm, 10);
        assert.deepEqual(d.stores.map((s) => String(s._id)), [A.storeId, B.storeId]);
        assert.ok(d.stores[0].distanceKm <= d.stores[1].distanceKm);
        for (const s of d.stores) assert.ok(!('email' in s) && !('franchiseId' in s) && !('approvalStatus' in s));
    });

    test('a store outside the radius is left out; another city never shows', async () => {
        const far = await near('lat=28.6&lng=77.2');
        assert.deepEqual(far.stores, []);
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods, nearbyStoreRadiusKm: 2 }));
        const d = await near('lat=22.7196&lng=75.8577');
        assert.deepEqual(d.stores.map((s) => String(s._id)), [A.storeId]);
        assert.equal(d.radiusKm, 2);
    });

    test('the radius reads back, is validated and survives a methods-only save', async () => {
        assert.equal(ok(await fx.call('GET', ADMIN, fx.SA)).nearbyStoreRadiusKm, 2);
        for (const bad of [0, 201, 'x', null, true]) {
            assert.equal((await fx.call('PUT', ADMIN, fx.SA, { methods, nearbyStoreRadiusKm: bad })).status, 400, String(bad));
        }
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods }));
        assert.equal(ok(await fx.call('GET', ADMIN, fx.SA)).nearbyStoreRadiusKm, 2);
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods, nearbyStoreRadiusKm: 10 }));
    });

    test('inactive, unapproved and position-less stores never show', async () => {
        await FoodStore.updateOne({ _id: B.storeId }, { $set: { isActive: false } });
        assert.deepEqual((await near('lat=22.7196&lng=75.8577')).stores.map((s) => String(s._id)), [A.storeId]);
        await FoodStore.updateOne({ _id: B.storeId }, { $set: { isActive: true } });
        await FoodStore.updateOne({ _id: A.storeId }, { $unset: { latitude: 1, longitude: 1 } });
        assert.deepEqual((await near('lat=22.7196&lng=75.8577')).stores.map((s) => String(s._id)), [B.storeId]);
        await FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: 22.7196, longitude: 75.8577 } });
    });

    test('method keeps only stores where that method is offered; text search narrows', async () => {
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods: [{ id: 'takeaway', enabled: true, scope: 'stores', storeIds: [B.storeId] }] }));
        assert.deepEqual((await near('lat=22.7196&lng=75.8577&method=takeaway')).stores.map((s) => String(s._id)), [B.storeId]);
        assert.equal((await near('lat=22.7196&lng=75.8577')).stores.length, 2, 'no method: all nearby');
        assert.deepEqual((await near('lat=22.7196&lng=75.8577&q=zzzz-nothing')).stores, []);
    });
});

describe('order methods follow the stores around the customer', () => {
    const PUBLIC = '/v1/food/orders/methods';
    const on = async (qs) => Object.fromEntries(ok(await fx.call('GET', `${PUBLIC}?${qs}`, null)).methods.map((m) => [m.id, m.enabled]));
    test('a method collected at a store shows when any store in the radius offers it, even if the nearest store does not', async () => {
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods: [{ id: 'takeaway', enabled: true, scope: 'stores', storeIds: [B.storeId] }, { id: 'delivery', enabled: true, scope: 'all' }], nearbyStoreRadiusKm: 10 }));
        const m = await on('lat=22.7196&lng=75.8577'); // the nearest store is A; B (another franchise, 3 km) offers takeaway
        assert.equal(m.takeaway, true);
        assert.equal(m.delivery, true);
    });
    test('and hides it when no such store is within the radius', async () => {
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods: [{ id: 'takeaway', enabled: true, scope: 'stores', storeIds: [B.storeId] }], nearbyStoreRadiusKm: 2 }));
        assert.equal((await on('lat=22.7196&lng=75.8577')).takeaway, false);
        ok(await fx.call('PUT', ADMIN, fx.SA, { methods: [{ id: 'takeaway', enabled: true, scope: 'all' }], nearbyStoreRadiusKm: 10 }));
    });
});
