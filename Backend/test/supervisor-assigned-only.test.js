// CLAUDE.md: a kitchen supervisor sees only the store orders the store manager assigned to them. Every read that returns
// order data follows that rule: order by id, delivery, customers, complaints, reviews, dashboard widgets, shortages.
// Kitchen staff open only an order they are on. The store manager still sees the whole store.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let mine; let other; let sup; let otherSup; let chef;
let phoneSeq = 0; let seq = 0;

const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', A.managerToken, {
        fullName: `Name ${tag}`, email, phone: `6${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role,
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { id: res.body.data.userId, token: await login(email) };
};
const makeOrder = async (status, supervisorId, set = {}) => {
    const ref = `SA${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId),
        franchiseId: new mongoose.Types.ObjectId(A.franchiseId), orderStatus: status, payment: { method: 'cash', status: 'cod_pending' },
        pricing: { subtotal: 400, total: 400 }, deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' },
        customerName: `Customer of ${ref}`, customerPhone: '9000000000', items: [{ itemId: 'x', name: 'Margherita', quantity: 1, size: 'Medium', price: 400 }],
        statusHistory: [{ at: new Date(), byRole: 'SYSTEM', from: '', to: 'created', note: 'Order placed' }],
        kitchen: { stage: 'pending', priority: 'normal', supervisor: { userId: new mongoose.Types.ObjectId(supervisorId), name: 'Supervisor' }, staff: {} },
        createdAt: new Date(), updatedAt: new Date(), ...set,
    });
    return { id: String(r.insertedId), ref };
};
const data = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const get = (token, path) => fx.call('GET', path, token);

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    sup = await makeStaff('Kitchen Supervisor', 'sao');
    otherSup = await makeStaff('Kitchen Supervisor', 'sat');
    chef = await makeStaff('Pizza Chef', 'sac');
    mine = {
        active: await makeOrder('preparing', sup.id, { kitchen: { stage: 'preparing', supervisor: { userId: new mongoose.Types.ObjectId(sup.id), name: 'S' }, staff: { pizza_chef: { userId: new mongoose.Types.ObjectId(chef.id), name: 'C' } } } }),
        ready: await makeOrder('ready_for_pickup', sup.id),
    };
    other = {
        active: await makeOrder('preparing', otherSup.id),
        ready: await makeOrder('ready_for_pickup', otherSup.id),
    };
});
after(async () => { await fx?.teardown(); });

describe('order lists and order by id', () => {
    test('the list shows a supervisor only their orders; the manager sees all', async () => {
        const ids = (d) => d.map((o) => o._id);
        assert.deepEqual(ids(data(await get(sup.token, '/v1/food/store/orders?view=active'))), [mine.active.id]);
        const all = ids(data(await get(A.managerToken, '/v1/food/store/orders?view=active')));
        assert.ok(all.includes(mine.active.id) && all.includes(other.active.id));
    });
    test('GET /food/store/orders/:id: another supervisor\'s order is 404, also by order number', async () => {
        assert.equal(data(await get(sup.token, `/v1/food/store/orders/${mine.active.id}`))._id, mine.active.id);
        assert.equal((await get(sup.token, `/v1/food/store/orders/${other.active.id}`)).status, 404);
        assert.equal((await get(sup.token, `/v1/food/store/orders/${other.active.ref}`)).status, 404);
        assert.equal(data(await get(A.managerToken, `/v1/food/store/orders/${other.active.id}`))._id, other.active.id);
    });
    test('GET /food/store/orders/:id: kitchen staff open only an order they are on', async () => {
        assert.equal(data(await get(chef.token, `/v1/food/store/orders/${mine.active.id}`))._id, mine.active.id);
        assert.equal((await get(chef.token, `/v1/food/store/orders/${other.active.id}`)).status, 404);
    });
    test('priority: only the manager or that order\'s supervisor', async () => {
        const set = (token, id) => fx.call('PATCH', `/v1/food/store/orders/${id}/priority`, token, { priority: 'urgent' });
        assert.equal((await set(sup.token, mine.active.id)).status, 200);
        assert.equal((await set(sup.token, other.active.id)).status, 403);
        assert.equal((await set(chef.token, mine.active.id)).status, 403);
        assert.equal((await set(A.managerToken, other.active.id)).status, 200);
    });
});

describe('delivery reads', () => {
    test('ready orders', async () => {
        assert.deepEqual(data(await get(sup.token, '/v1/store/orders/ready')).map((o) => o._id), [mine.ready.id]);
        assert.equal(data(await get(A.managerToken, '/v1/store/orders/ready')).length, 2);
    });
    test('tracking, timeline and refunds of another supervisor\'s order are 404', async () => {
        for (const path of [`/v1/store/tracking/${other.ready.id}`, `/v1/store/delivery/timeline/${other.ready.id}`, `/v1/store/orders/${other.ready.id}/refunds`]) {
            assert.equal((await get(sup.token, path)).status, 404, path);
            assert.equal((await get(A.managerToken, path)).status, 200, path);
        }
        assert.equal((await get(sup.token, `/v1/store/tracking/${mine.ready.id}`)).status, 200);
    });
});

describe('dashboard widgets', () => {
    const W = '/v1/store/dashboard';
    test('counts only their orders', async () => {
        assert.equal(data(await get(sup.token, `${W}/today-orders`)).totalOrders, 2);
        assert.equal(data(await get(sup.token, `${W}/active-orders`)).activeOrders, 2);
        assert.ok(data(await get(A.managerToken, `${W}/today-orders`)).totalOrders >= 4, 'the manager counts the whole store');
    });
    test('order-list and live-orders name no other supervisor\'s customer', async () => {
        for (const widget of ['order-list', 'live-orders']) {
            const text = JSON.stringify(data(await get(sup.token, `${W}/${widget}`)));
            assert.ok(text.includes(mine.active.ref), widget);
            assert.ok(!text.includes(other.active.ref) && !text.includes(other.ready.ref), widget);
        }
    });
});

describe('customers, complaints and reviews', () => {
    let ticket; let otherTicket;
    before(async () => {
        const raise = async (orderId) => (await fx.call('POST', '/v1/food/user/support/ticket', A.customerToken, { type: 'order', orderId, issueType: 'Other', description: 'x' })).body.data.ticket._id;
        ticket = await raise(mine.active.id);
        otherTicket = await raise(other.active.id);
    });
    test('customer order lists and order details follow the assignment', async () => {
        assert.equal((await get(sup.token, `/v1/food/store/customers/orders/${other.active.id}`)).status, 404);
        assert.equal((await get(sup.token, `/v1/food/store/customers/orders/${mine.active.id}`)).status, 200);
        const profile = data(await get(sup.token, `/v1/food/store/customers/${A.customerId}`));
        assert.ok(profile.recentOrders.every((o) => o.orderNumber !== other.active.ref));
        assert.equal(profile.customerProfile.totalOrders, 2);
    });
    test('people near the store who never ordered are not listed for a supervisor', async () => {
        const list = data(await get(sup.token, '/v1/food/store/customers/orders')).customers;
        assert.deepEqual(list.map((c) => c.totalOrders), [2]);
    });
    test('complaints only about their orders; the other one is 404', async () => {
        assert.deepEqual(data(await get(sup.token, '/v1/food/store/complaints')).complaints.map((c) => c._id), [ticket]);
        assert.equal((await get(sup.token, `/v1/food/store/complaints/${otherTicket}`)).status, 404);
        assert.equal(data(await get(A.managerToken, '/v1/food/store/complaints')).complaints.length, 2);
    });
    test('reviews only of their orders', async () => {
        const rate = (id) => fx.models.FoodOrder.collection.updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { ratings: { store: { rating: 4, comment: 'ok', ratedAt: new Date() } } } });
        await rate(mine.ready.id); await rate(other.ready.id);
        assert.deepEqual(data(await get(sup.token, '/v1/food/store/reviews')).reviews.map((r) => r.orderNumber), [mine.ready.ref]);
        assert.equal((await get(sup.token, `/v1/food/store/reviews/${other.ready.id}`)).status, 404);
        assert.equal(data(await get(A.managerToken, '/v1/food/store/reviews')).reviews.length, 2);
    });
});
