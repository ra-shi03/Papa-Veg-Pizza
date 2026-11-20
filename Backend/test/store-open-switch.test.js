// The store manager's Open / Closed switch (/v1/food/store/open-status) and what customers see
// (GET /v1/food/stores/status, order placement). Closed = no new orders right now, whatever the hours say.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let pizza; let kitchen;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const S = '/v1/food/store/open-status';
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const put = (token, open) => fx.call('PUT', S, token, { open });
const publicStatus = async (f) => ok(await fx.call('GET', `/v1/food/stores/status?storeId=${f.storeId}`));
const order = (f) => fx.call('POST', '/v1/food/orders', f.customerToken, {
    storeId: f.storeId, paymentMethod: 'cash', address: { street: '1 Test St', city: 'Indore', state: 'MP' },
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 250, quantity: 1, kind: 'product' }],
});

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 250 });
    await FoodFeeSettings.create({ platformFee: 0, packagingFee: 0, handlingFee: 0, deliveryFee: 0, gstRate: 0, isActive: true });
    kitchen = await fx.staff('A', 'Pizza Maker', 'swkitchen');
});
after(async () => { await fx?.teardown(); });

describe('who may use the switch', () => {
    test('only the store manager: anonymous 401; kitchen staff, customers, franchise admin and super admin 403', async () => {
        assert.equal((await fx.call('GET', S)).status, 401);
        for (const token of [kitchen.token, A.customerToken, A.adminToken, fx.SA]) {
            assert.equal((await fx.call('GET', S, token)).status, 403);
            assert.equal((await put(token, false)).status, 403);
        }
    });
    test('the body must say open: true or false', async () => {
        for (const body of [{}, { open: 'no' }, { open: 1 }]) assert.equal((await fx.call('PUT', S, A.managerToken, body)).status, 400, JSON.stringify(body));
    });
});

describe('closing and reopening', () => {
    test('a store starts open, with no hours record needed', async () => {
        const s = ok(await fx.call('GET', S, A.managerToken));
        assert.deepEqual([s.storeId, s.isOpen, s.switchOn, s.manuallyClosed], [A.storeId, true, true, false]);
        assert.equal((await publicStatus(A)).isOpen, true);
    });
    test('Closed: customers see it closed and a new order is refused; the other store is untouched', async () => {
        const s = ok(await put(A.managerToken, false));
        assert.deepEqual([s.isOpen, s.switchOn, s.manuallyClosed, s.closedBy], [false, false, true, 'Manager A']);
        const pub = await publicStatus(A);
        assert.deepEqual([pub.serviceable, pub.isOpen], [true, false]);
        const refused = await order(A);
        assert.equal(refused.status, 400, JSON.stringify(refused.body));
        assert.match(refused.body.message || refused.body.error, /not accepting orders|closed/i);
        assert.equal((await publicStatus(B)).isOpen, true, 'store B is still open');
        const b = await fx.call('GET', S, B.managerToken);
        assert.equal(ok(b).switchOn, true);
    });
    test('Closed does not stop scheduled orders: tomorrow\'s slots are still offered', async () => {
        const slots = ok(await fx.call('GET', `/v1/food/stores/slots?storeId=${A.storeId}`));
        assert.equal(slots.openNow, false);
        assert.ok(Array.isArray(slots.days));
    });
    test('Open again: customers see it open and an order goes through', async () => {
        const s = ok(await put(A.managerToken, true));
        assert.deepEqual([s.isOpen, s.switchOn, s.manuallyClosed], [true, true, false]);
        assert.equal((await publicStatus(A)).isOpen, true);
        assert.equal((await order(A)).status, 201);
    });
    test('the switch only changes its own store, whichever store the body names', async () => {
        ok(await fx.call('PUT', S, B.managerToken, { open: false, storeId: A.storeId }));
        assert.equal((await publicStatus(A)).isOpen, true);
        assert.equal((await publicStatus(B)).isOpen, false);
        ok(await put(B.managerToken, true));
    });
});

describe('the switch and the operating hours', () => {
    test('outside the operating hours the store is closed even with the switch on, and the manager is told', async () => {
        const { StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js');
        const closed = Object.fromEntries(DAYS.map((d) => [d, { open: '00:00', close: '00:00', isClosed: true }]));
        await StoreHours.updateOne({ storeId: A.storeId }, { $set: { week: closed } });
        const s = ok(await fx.call('GET', S, A.managerToken));
        assert.deepEqual([s.isOpen, s.switchOn, s.withinHours], [false, true, false]);
        assert.equal((await publicStatus(A)).isOpen, false);
        ok(await put(A.managerToken, true));
        assert.equal((await publicStatus(A)).isOpen, false, 'switching on does not override the hours');
    });
});

describe('the public status', () => {
    test('a point no store serves is not serviceable and says nothing about opening hours', async () => {
        const none = ok(await fx.call('GET', '/v1/food/stores/status'));
        assert.deepEqual([none.serviceable, none.isOpen], [false, true]);
        assert.equal(ok(await fx.call('GET', `/v1/food/stores/status?storeId=${new mongoose.Types.ObjectId()}`)).serviceable, false);
    });
    test('it exposes nothing but the store name, its id and open / closed', async () => {
        assert.deepEqual(Object.keys(await publicStatus(B)).sort(), ['isOpen', 'serviceable', 'storeId', 'storeName']);
    });
});
