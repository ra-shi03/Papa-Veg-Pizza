// Removing fake data from the store screens: the endpoints the screens were repointed to.
//   - dashboard lists behind the cards: /store/dashboard/order-list, rider-roster, staff-roster
//   - Ready Orders "confirm pickup": PATCH /store/orders/:id/pickup
//   - Cancelled Orders "reopen": PATCH /food/store/orders/:id/reopen; refund history: GET /store/orders/:id/refunds
//   - profile store hours from Operating Hours
// Role and scope come from the token; another store's order is 404.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B; let sup; let chef; let riderWaiting; let riderLate; let riderFree;
let phoneSeq = 0; let seq = 0;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const minsAgo = (m) => new Date(Date.now() - m * 60000);
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: `Name ${tag}`, email, phone: `8${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return { id: res.body.data.userId, token: await login(email) };
};
/** an order of store `f`, inserted as the customer app would leave it */
async function order(f, { status, rider, history = [], payment = { method: 'cash', status: 'cod_pending' }, stage, at = minsAgo(1), customerName = 'Asha' }) {
    const ref = `SW${fx.ts}${seq++}`;
    const doc = {
        order_id: ref, orderId: ref, userId: oid(f.customerId), storeId: oid(f.storeId), franchiseId: oid(f.franchiseId), customerName,
        orderStatus: status, payment, pricing: { subtotal: 400, total: 400 }, deliveryAddress: { street: '1 Test Rd', city: 'Indore', state: 'MP' },
        customerPhone: f.phone, items: [{ itemId: 'item-1', name: 'Margherita', quantity: 1, size: 'Medium', price: 400 }],
        statusHistory: [{ at, byRole: 'SYSTEM', from: '', to: 'created', note: 'Order placed' }, ...history], createdAt: at, updatedAt: at,
    };
    if (rider) doc.dispatch = { deliveryPartnerId: oid(rider), status: 'accepted' };
    if (stage) doc.kitchen = { stage };
    const r = await fx.models.FoodOrder.collection.insertOne(doc);
    return { id: String(r.insertedId), ref };
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = await makeStaff('Kitchen Supervisor', 'swsup');
    chef = await makeStaff('Pizza Maker', 'swchef');
    riderWaiting = await fx.partner('approved');
    riderLate = await fx.partner('approved');
    riderFree = await fx.partner('approved');
});
after(async () => { await fx?.teardown(); });

describe('dashboard lists behind the cards', () => {
    const get = (token, widget, qs = '') => fx.call('GET', `/v1/store/dashboard/${widget}${qs}`, token);
    let O;
    before(async () => {
        O = {
            incoming: await order(A, { status: 'created' }),
            baking: await order(A, { status: 'preparing', stage: 'baking' }),
            ready: await order(A, { status: 'ready_for_pickup', rider: riderWaiting.id }),
            late: await order(A, { status: 'picked_up', rider: riderLate.id, at: minsAgo(70), history: [{ at: minsAgo(60), byRole: 'DELIVERY_PARTNER', from: 'ready_for_pickup', to: 'picked_up' }] }),
            delivered: await order(A, { status: 'delivered' }),
            cancelled: await order(A, { status: 'cancelled_by_user' }),
            other: await order(B, { status: 'created' }),
        };
    });
    test('order-list: today\'s orders in the donut\'s own slices, the same numbers as the donut', async () => {
        const rows = ok(await get(A.managerToken, 'order-list'));
        assert.deepEqual(Object.keys(rows[0]).sort(), ['createdTime', 'customer', 'orderNumber', 'status']);
        const by = Object.fromEntries(rows.map((r) => [r.orderNumber, r.status]));
        assert.equal(by[O.incoming.ref], 'incoming');
        assert.equal(by[O.baking.ref], 'baking');
        assert.equal(by[O.ready.ref], 'ready');
        assert.equal(by[O.delivered.ref], 'delivered');
        assert.equal(by[O.cancelled.ref], 'cancelled');
        assert.equal(by[O.other.ref], undefined, 'store B\'s order is not listed');
        assert.match(rows[0].createdTime, /^\d{2}:\d{2} (AM|PM)$/);
        const donut = ok(await get(A.managerToken, 'order-status'));
        for (const [slice, n] of Object.entries(donut)) assert.equal(rows.filter((r) => r.status === slice).length, n, slice);
    });
    test('rider-roster: who is waiting at the store, who is late on the road, who is free', async () => {
        const rows = ok(await get(A.managerToken, 'rider-roster'));
        assert.deepEqual(Object.keys(rows[0]).sort(), ['location', 'name', 'ordersAssigned', 'status']);
        const statuses = rows.map((r) => r.status);
        assert.ok(statuses.includes('Delivering (awaiting pickup)'));
        assert.ok(statuses.includes('Delivering (Delayed)'));
        assert.ok(statuses.includes('Idle'));
        assert.equal(rows.find((r) => r.status === 'Delivering (Delayed)').ordersAssigned, O.late.ref);
        // the card counts and the list agree
        const card = ok(await get(A.managerToken, 'delivery-overview'));
        assert.equal(rows.filter((r) => r.status.startsWith('Delivering')).length, card.assignedRiders);
        assert.equal(rows.filter((r) => r.status.includes('Delayed')).length, card.delayedDeliveries);
        assert.equal(rows.filter((r) => r.status === 'Idle').length, card.availableRiders);
    });
    test('staff-roster: the kitchen team with today\'s real attendance', async () => {
        ok(await fx.call('POST', '/v1/store/attendance/clock-in', sup.token), 201);
        const rows = ok(await get(A.managerToken, 'staff-roster'));
        assert.deepEqual(Object.keys(rows[0]).sort(), ['employee', 'role', 'shift', 'status']);
        assert.equal(rows.find((r) => r.employee === 'Name swsup').status, 'Present');
        assert.equal(rows.find((r) => r.employee === 'Name swchef').status, 'Not clocked in');
        assert.ok(!rows.some((r) => r.employee === 'Manager A'), 'the manager is not in the kitchen roster');
    });
    test('who may see them: supervisor the order and rider lists, not the staff roster; kitchen staff none; other stores 404', async () => {
        assert.equal((await get(sup.token, 'order-list')).status, 200);
        assert.equal((await get(sup.token, 'rider-roster')).status, 200);
        assert.equal((await get(sup.token, 'staff-roster')).status, 403);
        for (const w of ['order-list', 'rider-roster', 'staff-roster']) {
            assert.equal((await get(chef.token, w)).status, 403, w);
            assert.equal((await get(B.managerToken, w, `?storeId=${A.storeId}`)).status, 404, w);
            assert.equal((await get(A.customerToken, w)).status, 403, w);
        }
        assert.ok(!ok(await get(B.managerToken, 'order-list')).some((r) => r.orderNumber === O.incoming.ref));
        assert.equal(ok(await get(A.adminToken, 'order-list', `?storeId=${A.storeId}`)).length >= 6, true);
    });
});

describe('Ready Orders: the store confirms the pickup', () => {
    const pickup = (token, id, body = {}) => fx.call('PATCH', `/v1/store/orders/${id}/pickup`, token, body);
    test('manager: a ready order with its rider goes out for delivery; the history names the store', async () => {
        const o = await order(A, { status: 'ready_for_pickup', rider: riderWaiting.id });
        const r = ok(await pickup(A.managerToken, o.id, { notes: 'Handed over at the counter', orderStatus: 'delivered' }));
        assert.equal(r.orderStatus, 'picked_up');
        const saved = await fx.models.FoodOrder.findById(o.id).lean();
        assert.equal(saved.orderStatus, 'picked_up');
        assert.equal(saved.deliveryState.status, 'picked_up');
        const last = saved.statusHistory.at(-1);
        assert.equal(last.to, 'picked_up');
        assert.equal(last.byRole, 'STORE_MANAGER');
        assert.match(last.note, /Handed over at the counter/);
        assert.equal((await pickup(A.managerToken, o.id)).status, 400, 'already picked up');
    });
    test('refused: no rider, not ready yet, supervisor or kitchen staff, another store', async () => {
        const noRider = await order(A, { status: 'ready_for_pickup' });
        assert.equal((await pickup(A.managerToken, noRider.id)).status, 400);
        const cooking = await order(A, { status: 'preparing', rider: riderWaiting.id });
        assert.equal((await pickup(A.managerToken, cooking.id)).status, 400);
        const ready = await order(A, { status: 'ready_for_pickup', rider: riderWaiting.id });
        assert.equal((await pickup(sup.token, ready.id)).status, 403);
        assert.equal((await pickup(chef.token, ready.id)).status, 403);
        assert.equal((await pickup(B.managerToken, ready.id)).status, 404);
        assert.equal((await pickup(A.customerToken, ready.id)).status, 403);
        assert.equal((await pickup(null, ready.id)).status, 401);
        assert.equal((await fx.models.FoodOrder.findById(ready.id).lean()).orderStatus, 'ready_for_pickup');
    });
});

describe('Cancelled Orders: reopen and refund history', () => {
    const reopen = (token, id, body = {}) => fx.call('PATCH', `/v1/food/store/orders/${id}/reopen`, token, body);
    const cancelledByStore = (minutes, extra = {}) => order(A, {
        status: 'cancelled_by_store', ...extra,
        history: [{ at: minsAgo(minutes), byRole: 'STORE', from: 'created', to: 'cancelled_by_store', note: 'Out of dough' }],
    });
    test('manager: within 5 minutes of the store\'s own cancellation the order goes back to Incoming', async () => {
        const o = await cancelledByStore(2);
        const r = ok(await reopen(A.managerToken, o.id, { customerMessage: 'Dough arrived, we are making it now' }));
        assert.equal(r.orderStatus, 'created');
        const saved = await fx.models.FoodOrder.findById(o.id).lean();
        assert.equal(saved.orderStatus, 'created');
        assert.equal(saved.statusHistory.at(-1).to, 'created');
        assert.match(saved.statusHistory.at(-1).note, /Dough arrived/);
        assert.equal((await reopen(A.managerToken, o.id)).status, 400, 'not cancelled any more');
    });
    test('refused: too late, cancelled by the customer, paid online, with a refund, wrong role, another store', async () => {
        assert.equal((await reopen(A.managerToken, (await cancelledByStore(10)).id)).status, 400, 'after 5 minutes');
        assert.equal((await reopen(A.managerToken, (await order(A, { status: 'cancelled_by_user' })).id)).status, 400, 'the customer cancelled');
        assert.equal((await reopen(A.managerToken, (await cancelledByStore(1, { payment: { method: 'razorpay', status: 'paid' } })).id)).status, 400, 'paid online');
        const refunded = await cancelledByStore(1);
        await mongoose.connection.collection('refunds').insertOne({ orderId: oid(refunded.id), userId: oid(A.customerId), amount: 100, status: 'pending', reason: 'x', createdAt: new Date() });
        assert.equal((await reopen(A.managerToken, refunded.id)).status, 400, 'a refund started');
        const refundOnOrder = await cancelledByStore(1, { payment: { method: 'cash', status: 'cod_pending', refund: { status: 'pending', amount: 100 } } });
        assert.equal((await reopen(A.managerToken, refundOnOrder.id)).status, 400, 'a refund recorded on the order itself');
        const fresh = await cancelledByStore(1);
        assert.equal((await reopen(sup.token, fresh.id)).status, 403);
        assert.equal((await reopen(B.managerToken, fresh.id)).status, 404);
        assert.equal((await fx.models.FoodOrder.findById(fresh.id).lean()).orderStatus, 'cancelled_by_store');
    });
    test('refund history: the refund requests of one order, in the table\'s shape; other stores 404', async () => {
        const o = await order(A, { status: 'delivered' });
        ok(await fx.call('POST', `/v1/store/orders/${o.id}/refund`, A.managerToken, { amount: 150, reason: 'Cold pizza' }), 201);
        const rows = ok(await fx.call('GET', `/v1/store/orders/${o.id}/refunds`, A.managerToken));
        assert.equal(rows.length, 1);
        assert.deepEqual(Object.keys(rows[0]).sort(), ['_id', 'amount', 'createdAt', 'orderId', 'processedBy', 'reason', 'referenceNumber', 'refundMethod', 'status']);
        assert.equal(rows[0].amount, 150);
        assert.equal(rows[0].status, 'pending');
        assert.equal(rows[0].processedBy, 'Store');
        assert.match(rows[0].referenceNumber, /^REF-/);
        assert.equal((await fx.call('GET', `/v1/store/orders/${o.id}/refunds`, B.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/store/orders/${o.id}/refunds`, chef.token)).status, 403);
    });
});

describe('profile: the store\'s real hours (never a made-up "11 AM - 11 PM")', () => {
    test('no Operating Hours record: open all day', async () => {
        const s = ok(await fx.call('GET', '/v1/profile', A.managerToken)).store;
        assert.deepEqual([s.openingTime, s.closingTime], ['Open', '24 hours']);
    });
    test('with Operating Hours: today\'s window; a closed day says so', async () => {
        const { StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js');
        const day = { open: '10:00', close: '22:00', isClosed: false };
        const week = Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d, day]));
        await StoreHours.create({ storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), week });
        const s = ok(await fx.call('GET', '/v1/profile', A.managerToken)).store;
        assert.deepEqual([s.openingTime, s.closingTime], ['10:00 AM', '10:00 PM']);
        const closed = Object.fromEntries(Object.keys(week).map((d) => [d, { ...day, isClosed: true }]));
        await StoreHours.updateOne({ storeId: oid(A.storeId) }, { $set: { week: closed } });
        assert.deepEqual(Object.values((({ openingTime, closingTime }) => ({ openingTime, closingTime }))(ok(await fx.call('GET', '/v1/profile', sup.token)).store)), ['Closed', 'today']);
    });
});
