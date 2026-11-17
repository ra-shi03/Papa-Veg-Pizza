// Order methods: the super admin switches delivery / takeaway / in-car / delivery on train on or off and says where each
// is offered (every store, chosen franchises, chosen stores). The customer app gets the answer for its own store, the
// server refuses an order for a method not offered at the store, and the train station list follows the train rules.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

const ADMIN = '/v1/settings/order-methods';
const PUBLIC = '/v1/food/orders/methods';
let fx; let A; let B; let pizza;

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const save = (methods, token = fx.SA) => fx.call('PUT', ADMIN, token, { methods });
const forStore = async (storeId) => Object.fromEntries(ok(await fx.call('GET', `${PUBLIC}?storeId=${storeId}`, null)).methods.map((m) => [m.id, m.enabled]));
const place = (storeId, extra = {}) => fx.call('POST', '/v1/food/orders', A.customerToken, {
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
    storeId, address: { label: 'Home', name: 'Asha', phone: '9812345678', street: '1 Test Street', city: 'Indore', state: 'MP' },
    customerName: 'Asha', customerPhone: '9812345678', paymentMethod: 'cash', ...extra,
});

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], basePrice: 200, price: 200 });
});
after(async () => { await fx?.teardown(); });

describe('who may read and write the rules', () => {
    test('only the super admin', async () => {
        const rules = [{ id: 'delivery', enabled: true, scope: 'all' }];
        assert.equal((await save(rules, null)).status, 401);
        const rider = await fx.partner();
        for (const token of [A.customerToken, A.adminToken, A.managerToken, rider.token]) {
            assert.equal((await save(rules, token)).status, 403);
            assert.equal((await fx.call('GET', ADMIN, token)).status, 403);
        }
    });

    test('the default: four methods on and dine-in off, for every store', async () => {
        const { methods } = ok(await fx.call('GET', ADMIN, fx.SA));
        assert.deepEqual(methods.map((m) => [m.id, m.enabled, m.scope]), [['delivery', true, 'all'], ['takeaway', true, 'all'], ['incar', true, 'all'], ['train', true, 'all'], ['dinein', false, 'all']]);
    });
});

describe('validation', () => {
    const bad = async (rules, text) => {
        const res = await save(rules);
        assert.equal(res.status, 400, JSON.stringify(rules));
        if (text) assert.match(res.body.message || res.body.error, text);
    };
    test('malformed method id, unknown scope, limited scope without a list, invented or malformed ids, duplicates', async () => {
        await bad([{ id: 'Dine In!', enabled: true, scope: 'all' }], /Unknown order method/);
        await bad([{ id: 'rooftop', scope: 'all' }], /give the method a name/);
        await bad([{ id: 'delivery', scope: 'everyone' }], /scope/);
        await bad([{ id: 'delivery', scope: 'franchises', franchiseIds: [] }], /at least one franchise/);
        await bad([{ id: 'delivery', scope: 'stores', storeIds: [] }], /at least one store/);
        await bad([{ id: 'delivery', scope: 'stores', storeIds: [String(new mongoose.Types.ObjectId())] }], /does not exist/);
        await bad([{ id: 'delivery', scope: 'franchises', franchiseIds: ['not-an-id'] }], /invalid/);
        await bad([{ id: 'delivery' }, { id: 'delivery' }], /twice/);
        await bad([], null);
        await bad('delivery', null);
    });
    test('nothing was saved by the refused writes', async () => {
        const { methods } = ok(await fx.call('GET', ADMIN, fx.SA));
        assert.ok(methods.every((m) => m.scope === 'all') && methods.length === 5);
    });
});

describe('where each method is offered', () => {
    before(async () => {
        ok(await save([
            { id: 'delivery', enabled: true, scope: 'franchises', franchiseIds: [B.franchiseId] },
            { id: 'takeaway', enabled: false, scope: 'all' },
            { id: 'incar', enabled: true, scope: 'all' },
            { id: 'train', enabled: true, scope: 'stores', storeIds: [A.storeId] },
        ]));
    });

    test('the customer app gets the rules applied to its own store', async () => {
        assert.deepEqual(await forStore(A.storeId), { delivery: false, takeaway: false, incar: true, train: true, dinein: false });
        assert.deepEqual(await forStore(B.storeId), { delivery: true, takeaway: false, incar: true, train: false, dinein: false });
    });

    test('with no store known, only methods open to every store are on; nothing about the rules leaks', async () => {
        const data = ok(await fx.call('GET', PUBLIC, null));
        assert.deepEqual(Object.fromEntries(data.methods.map((m) => [m.id, m.enabled])), { delivery: false, takeaway: false, incar: true, train: false, dinein: false });
        const text = JSON.stringify(data);
        assert.ok(!text.includes(B.franchiseId) && !text.includes('franchiseIds') && !text.includes('scope'), 'no store or franchise ids, no scope');
        assert.deepEqual(Object.keys(data.methods[0]).sort(), ['enabled', 'icon', 'id', 'label']);
    });

    test('the saved rules read back', async () => {
        const { methods } = ok(await fx.call('GET', ADMIN, fx.SA));
        const by = Object.fromEntries(methods.map((m) => [m.id, m]));
        assert.deepEqual(by.delivery.franchiseIds, [B.franchiseId]);
        assert.deepEqual(by.train.storeIds, [A.storeId]);
        assert.equal(by.takeaway.enabled, false);
    });

    test('the public home-page read has no order methods, and a write through it is ignored', async () => {
        const pub = ok(await fx.call('GET', '/v1/settings/home-page', null));
        assert.ok(!('orderMethods' in pub));
        await fx.call('PUT', '/v1/settings/home-page', fx.SA, { orderMethods: [{ id: 'delivery', label: 'x', enabled: false }] });
        assert.deepEqual(await forStore(B.storeId), { delivery: true, takeaway: false, incar: true, train: false, dinein: false });
    });

    test('an order for a method not offered at the store is refused; one that is offered goes through', async () => {
        const noDelivery = await place(A.storeId);
        assert.equal(noDelivery.status, 400, JSON.stringify(noDelivery.body));
        assert.match(noDelivery.body.message || noDelivery.body.error, /Delivery is not available at this store/);
        const noTakeaway = await place(A.storeId, { orderMethod: 'takeaway' });
        assert.equal(noTakeaway.status, 400);
        const inCar = await place(A.storeId, { orderMethod: 'incar' });
        assert.equal(inCar.status, 201, JSON.stringify(inCar.body));
        assert.equal(inCar.body.data.order.orderMethod, 'incar');
    });

    test('delivery at the franchise it is limited to works and is recorded', async () => {
        const res = await fx.call('POST', '/v1/food/orders', B.customerToken, {
            items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
            storeId: B.storeId, address: { label: 'Home', name: 'Ravi', phone: '9812345679', street: '2 Test Street', city: 'Pune', state: 'MH' },
            customerName: 'Ravi', customerPhone: '9812345679', paymentMethod: 'cash',
        });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.order.orderMethod, 'delivery');
    });
});

describe('delivery on train follows the rules', () => {
    const ADMIN_BS = '/v1/food/admin/business-settings';
    const journey = { stationCode: 'BPL', trainNo: '12301', coach: 'B2', seat: '14' };
    const trainOrder = () => place(B.storeId, { train: journey });
    const stations = async () => ok(await fx.call('GET', '/v1/food/train/stations', null));

    before(async () => {
        const res = await fx.call('PATCH', ADMIN_BS, fx.SA, { trainDelivery: { stations: [{ name: 'Bhopal Jn', code: 'BPL', storeId: A.storeId }, { name: 'Itarsi', code: 'ET', storeId: B.storeId }] } });
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });

    test('train is offered only at the store it is limited to: its station is listed, the other store\'s is not', async () => {
        // train is limited to store A (see above)
        const s = await stations();
        assert.deepEqual(s.stations.map((x) => x.code), ['BPL']);
        assert.equal(s.available, true);
    });

    test('a train order for a station whose store is not allowed is refused; for an allowed one it is placed', async () => {
        const refused = await place(B.storeId, { train: { ...journey, stationCode: 'ET' } });
        assert.equal(refused.status, 400, JSON.stringify(refused.body));
        assert.match(refused.body.message || refused.body.error, /Delivery on Train is not available at this store/);
        const placed = await place(B.storeId, { train: journey });
        assert.equal(placed.status, 201, JSON.stringify(placed.body));
        assert.equal(placed.body.data.order.orderMethod, 'train');
        assert.equal(String(placed.body.data.order.storeId?._id || placed.body.data.order.storeId), A.storeId, 'the station decides the store');
    });

    test('train switched off means no stations and no train orders; switching it on again brings both back', async () => {
        ok(await save([{ id: 'train', enabled: false, scope: 'all' }]));
        const off = await stations();
        assert.deepEqual([off.available, off.stations.length], [false, 0], 'the list updates at once');
        assert.equal((await trainOrder()).status, 400);
        ok(await save([{ id: 'train', enabled: true, scope: 'all' }]));
        assert.deepEqual((await stations()).stations.map((x) => x.code).sort(), ['BPL', 'ET']);
        assert.equal((await trainOrder()).status, 201);
    });

    test('a train order cannot be placed as another method by naming it in the body', async () => {
        ok(await save([{ id: 'train', enabled: false, scope: 'all' }]));
        const res = await place(A.storeId, { orderMethod: 'train' });
        assert.equal(res.status, 400, 'a plain order that claims to be train is treated as delivery, which is limited to the other franchise');
        ok(await save([{ id: 'train', enabled: true, scope: 'all' }]));
    });
});

describe('creating and deleting order methods', () => {
    test('a created method gets an id from its name, works per store, and is removed by leaving it out', async () => {
        const base = ok(await fx.call('GET', ADMIN, fx.SA)).methods;
        const keep = base.filter((m) => !m.custom);
        const saved = ok(await save([...keep, { label: 'Rooftop Dining', enabled: true, scope: 'stores', storeIds: [A.storeId] }, { label: 'Rooftop Dining', enabled: true, scope: 'all' }])).methods;
        const made = saved.filter((m) => m.custom);
        assert.deepEqual(made.map((m) => m.id), ['rooftop_dining', 'rooftop_dining_2']);
        assert.equal((await forStore(A.storeId)).rooftop_dining, true);
        assert.equal((await forStore(B.storeId)).rooftop_dining, false);
        const kept = ok(await save([...keep, made[0]])).methods;
        assert.deepEqual(kept.filter((m) => m.custom).map((m) => m.id), ['rooftop_dining']);
        assert.deepEqual(ok(await save(keep)).methods.filter((m) => m.custom), [], 'deleted');
        assert.equal(ok(await fx.call('GET', ADMIN, fx.SA)).methods.length, 5, 'built-in ones cannot be deleted');
    });
    test('dine-in can be switched on and an order for it is accepted at an allowed store', async () => {
        ok(await save([{ id: 'dinein', enabled: true, scope: 'all' }]));
        const res = await place(A.storeId, { orderMethod: 'dinein' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        assert.equal(res.body.data.order.orderMethod, 'dinein');
    });
});
