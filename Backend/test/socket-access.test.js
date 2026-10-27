// H2 / H3: live tracking over Socket.IO.
// - join-tracking is allowed only for the order's customer, its assigned rider, its store, its franchise admin
//   or a super admin (checked against the order in the DB).
// - update-location is accepted only from the rider assigned to an active order, and goes only to rooms taken
//   from the order record (payload userId / storeId are ignored).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as connect } from 'socket.io-client';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let server; let url; let startOrderEventStream; let stopOrderEventStream;
const sockets = [];
const RIDER = String(new mongoose.Types.ObjectId());
const OTHER_RIDER = String(new mongoose.Types.ObjectId());

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { initSocket } = await import('../src/config/socket.js');
    server = http.createServer();
    await initSocket(server);
    ({ startOrderEventStream, stopOrderEventStream } = await import('../src/modules/food/orders/services/order-events.service.js'));
    startOrderEventStream();
    await new Promise((resolve) => setTimeout(resolve, 1200)); // let the change stream attach
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    sockets.forEach((s) => s.disconnect());
    await stopOrderEventStream?.();
    const { getIO } = await import('../src/config/socket.js');
    await new Promise((resolve) => getIO()?.close(() => resolve()) ?? resolve());
    await fx?.teardown();
});

let seq = 0;
/** An order of franchise A / store A / customer A, assigned to RIDER. */
async function makeOrder(over = {}) {
    seq += 1;
    const ref = `TRK${fx.ts}${seq}`;
    const { insertedId } = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref,
        userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId),
        franchiseId: new mongoose.Types.ObjectId(A.franchiseId), orderStatus: 'picked_up',
        dispatch: { status: 'assigned', deliveryPartnerId: new mongoose.Types.ObjectId(RIDER) },
        items: [], createdAt: new Date(), updatedAt: new Date(), ...over,
    });
    return { id: String(insertedId), ref };
}

async function client(token) {
    const s = connect(url, { auth: { token }, transports: ['websocket'], forceNew: true, reconnection: false });
    sockets.push(s);
    await new Promise((resolve, reject) => { s.once('connect', resolve); s.once('connect_error', reject); });
    return s;
}
/** First `event` payload within `ms`, or null. */
const next = (s, event, ms = 1500) => new Promise((resolve) => {
    const timer = setTimeout(() => { s.off(event, on); resolve(null); }, ms);
    const on = (data) => { clearTimeout(timer); resolve(data); };
    s.once(event, on);
});
/** 'joined' | 'denied' | 'no-answer' */
async function join(s, orderId) {
    const joined = next(s, 'tracking-room-joined');
    const denied = next(s, 'tracking-denied');
    s.emit('join-tracking', orderId);
    const [ok, no] = await Promise.all([joined, denied]);
    return ok ? 'joined' : no ? 'denied' : 'no-answer';
}

const as = {
    customerA: () => fx.tokenFor(A.customerId, 'CUSTOMER'),
    customerB: () => fx.tokenFor(B.customerId, 'CUSTOMER'),
    rider: () => fx.tokenFor(RIDER, 'DELIVERY_PARTNER'),
    otherRider: () => fx.tokenFor(OTHER_RIDER, 'DELIVERY_PARTNER'),
    managerA: () => fx.tokenFor(A.managerUserId, 'STORE_MANAGER', { franchiseId: A.franchiseId, storeId: A.storeId }),
    managerB: () => fx.tokenFor(B.managerUserId, 'STORE_MANAGER', { franchiseId: B.franchiseId, storeId: B.storeId }),
    adminA: () => fx.tokenFor(A.adminUserId, 'FRANCHISE_ADMIN', { franchiseId: A.franchiseId }),
    adminB: () => fx.tokenFor(B.adminUserId, 'FRANCHISE_ADMIN', { franchiseId: B.franchiseId }),
    superAdmin: () => fx.SA,
};

describe('H2: join-tracking needs a link to the order', () => {
    const cases = [
        ['the customer who placed it', 'customerA', 'joined'],
        ['another customer', 'customerB', 'denied'],
        ['the assigned rider', 'rider', 'joined'],
        ['a rider not assigned to it', 'otherRider', 'denied'],
        ['the manager of its store', 'managerA', 'joined'],
        ['a manager of another store', 'managerB', 'denied'],
        ['its franchise admin', 'adminA', 'joined'],
        ['another franchise admin', 'adminB', 'denied'],
        ['a super admin', 'superAdmin', 'joined'],
    ];
    for (const [who, key, expected] of cases) {
        test(`${who} -> ${expected}`, async () => {
            const { id } = await makeOrder();
            assert.equal(await join(await client(as[key]()), id), expected);
        });
    }
    test('joining by the public order number works for the owner and not for others', async () => {
        const { ref } = await makeOrder();
        assert.equal(await join(await client(as.customerA()), ref), 'joined');
        assert.equal(await join(await client(as.customerB()), ref), 'denied');
    });
    test('an unknown or malformed order id is refused', async () => {
        const s = await client(as.customerA());
        assert.equal(await join(s, String(new mongoose.Types.ObjectId())), 'denied');
        assert.equal(await join(s, { $ne: null }), 'no-answer'); // not even looked up
    });
});

describe('customer room: role CUSTOMER and role USER both get their personal room', () => {
    for (const role of ['CUSTOMER', 'USER']) {
        test(`${role}: receives its own order's location without joining tracking, and not another customer's`, async () => {
            const { id } = await makeOrder();
            const mine = await client(fx.tokenFor(A.customerId, role));
            const theirs = await client(fx.tokenFor(B.customerId, role));
            const [a, b] = [next(mine, 'location-update'), next(theirs, 'location-update', 1200)];
            (await client(as.rider())).emit('update-location', { orderId: id, lat: 22.7, lng: 75.8 });
            assert.ok(await a, 'the order\'s customer gets it');
            assert.equal(await b, null);
        });
    }
});

describe('H3: update-location only from the assigned rider, rooms from the order', () => {
    const point = (orderId, extra = {}) => ({ orderId, lat: 22.7, lng: 75.8, ...extra });

    test('the assigned rider reaches everyone watching the order', async () => {
        const { id } = await makeOrder();
        const watcher = await client(as.customerA());
        assert.equal(await join(watcher, id), 'joined');
        const got = next(watcher, 'location-update');
        (await client(as.rider())).emit('update-location', point(id));
        const data = await got;
        assert.ok(data, 'watcher should get the location');
        assert.equal(data.deliveryPartnerId, RIDER);
    });

    test('a rider not assigned to the order is ignored', async () => {
        const { id } = await makeOrder();
        const watcher = await client(as.customerA());
        assert.equal(await join(watcher, id), 'joined');
        const got = next(watcher, 'location-update', 1200);
        (await client(as.otherRider())).emit('update-location', point(id));
        assert.equal(await got, null);
    });

    test('a non-rider cannot push a location', async () => {
        const { id } = await makeOrder();
        const watcher = await client(as.managerA());
        assert.equal(await join(watcher, id), 'joined');
        const got = next(watcher, 'location-update', 1200);
        (await client(as.customerA())).emit('update-location', point(id));
        assert.equal(await got, null);
    });

    test('a finished order no longer accepts locations', async () => {
        const { id } = await makeOrder({ orderStatus: 'delivered' });
        const watcher = await client(as.customerA());
        assert.equal(await join(watcher, id), 'joined');
        const got = next(watcher, 'location-update', 1200);
        (await client(as.rider())).emit('update-location', point(id));
        assert.equal(await got, null);
    });

    test('payload userId / storeId are ignored; the customer and store rooms come from the order', async () => {
        const { id } = await makeOrder();
        // Role USER and legacy STORE logins auto-join user:<id> / store:<id> rooms on connect.
        const victimUser = await client(fx.tokenFor(B.customerId, 'USER'));
        const victimStore = await client(fx.tokenFor(B.storeId, 'STORE'));
        const ownerUser = await client(fx.tokenFor(A.customerId, 'USER'));
        const ownerStore = await client(fx.tokenFor(A.storeId, 'STORE'));
        const [vu, vs, ou, os] = [victimUser, victimStore, ownerUser, ownerStore].map((s) => next(s, 'location-update', 1500));
        (await client(as.rider())).emit('update-location', point(id, { userId: B.customerId, storeId: B.storeId }));
        const [gotVu, gotVs, gotOu, gotOs] = await Promise.all([vu, vs, ou, os]);
        assert.equal(gotVu, null, 'another customer must not get the location');
        assert.equal(gotVs, null, 'another store must not get the location');
        assert.ok(gotOu, "the order's own customer gets it");
        assert.ok(gotOs, "the order's own store gets it");
    });
});


// ─── Order events: store room and franchise room, rooms from the order record and the token ───────────────────

describe('order events reach only the right rooms', () => {
    let who;
    const EVENT_KEYS = ['at', 'deliveryPartnerId', 'franchiseId', 'orderId', 'orderMongoId', 'orderStatus', 'stage', 'storeId', 'type'];
    before(async () => {
        await mongoose.connection.collection('food_delivery_partners').insertOne({ _id: new mongoose.Types.ObjectId(RIDER), name: 'Rider One', phone: '9100000001', status: 'approved', availabilityStatus: 'online', createdAt: new Date(), updatedAt: new Date() });
        const scopeA = { franchiseId: A.franchiseId, storeId: A.storeId };
        who = {
            managerA: await client(as.managerA()),
            supervisorA: await client(fx.tokenFor(new mongoose.Types.ObjectId(), 'KITCHEN_SUPERVISOR', scopeA)),
            adminA: await client(as.adminA()),
            managerB: await client(as.managerB()),
            adminB: await client(as.adminB()),
            staffA: await client(fx.tokenFor(new mongoose.Types.ObjectId(), 'KITCHEN_STAFF', scopeA)),
            customerA: await client(as.customerA()),
            rider: await client(as.rider()),
        };
    });
    /** Runs `action`, then reports which sockets got an order_event (and what). */
    async function watch(action, ms = 1800) {
        const pending = Object.entries(who).map(([name, s]) => next(s, 'order_event', ms).then((e) => [name, e]));
        await action();
        return Object.fromEntries(await Promise.all(pending));
    }
    const got = (r) => Object.keys(r).filter((k) => r[k]).sort();
    const insideA = ['adminA', 'managerA', 'supervisorA'];
    const order = async (over) => { const o = await makeOrder(over); await new Promise((r) => setTimeout(r, 400)); return o; };

    test('a new order goes to its store (manager, supervisor) and its franchise admin, nobody else', async () => {
        let created;
        const r = await watch(async () => { created = await makeOrder({ orderStatus: 'created', dispatch: { status: 'unassigned' } }); });
        assert.deepEqual(got(r), insideA);
        assert.equal(r.managerA.type, 'new_order');
        assert.equal(r.managerA.orderMongoId, created.id);
        assert.deepEqual([r.managerA.storeId, r.managerA.franchiseId], [A.storeId, A.franchiseId]);
    });
    test('the payload is ids and states only: no customer, address or OTP', async () => {
        const o = await order({ customerName: 'Asha', customerPhone: '9000000000', deliveryOtp: '4321', deliveryAddress: { street: 'x' } });
        const r = await watch(() => fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'preparing' } }));
        assert.deepEqual(Object.keys(r.managerA).sort(), EVENT_KEYS);
        const text = JSON.stringify(r.adminA);
        for (const secret of ['Asha', '9000000000', '4321']) assert.ok(!text.includes(secret), secret);
        assert.equal(r.managerA.type, 'status_changed');
        assert.equal(r.managerA.orderStatus, 'preparing');
    });
    test('a kitchen stage change, delivered and cancelled each have their own event', async () => {
        const o = await order({ orderStatus: 'preparing' });
        let r = await watch(() => fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { 'kitchen.stage': 'baking' } }));
        assert.deepEqual(got(r), insideA);
        assert.deepEqual([r.managerA.type, r.managerA.stage], ['stage_changed', 'baking']);
        r = await watch(() => fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'delivered' } }));
        assert.equal(r.adminA.type, 'delivered');
        const c = await order({ orderStatus: 'confirmed' });
        r = await watch(() => fx.models.FoodOrder.updateOne({ _id: c.id }, { $set: { orderStatus: 'cancelled_by_store' } }));
        assert.deepEqual(got(r), insideA);
        assert.equal(r.managerA.type, 'cancelled');
    });
    test('an order of franchise B reaches B\'s rooms only', async () => {
        const r = await watch(() => fx.models.FoodOrder.collection.insertOne({
            order_id: `B${fx.ts}${seq++}`, userId: new mongoose.Types.ObjectId(B.customerId), storeId: new mongoose.Types.ObjectId(B.storeId),
            franchiseId: new mongoose.Types.ObjectId(B.franchiseId), orderStatus: 'created', items: [], createdAt: new Date(), updatedAt: new Date(),
        }));
        assert.deepEqual(got(r), ['adminB', 'managerB']);
    });
    test('assigning a rider (store API): rider_assigned to the store rooms, the offer only to that rider', async () => {
        const o = await order({ orderStatus: 'ready_for_pickup', dispatch: { status: 'unassigned' } });
        const offer = next(who.rider, 'new_order_available', 2500);
        const done = next(who.managerA, 'store:assignment-success', 2500);
        const r = await watch(async () => {
            const res = await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: o.id, riderId: RIDER });
            assert.equal(res.status, 200, JSON.stringify(res.body));
        });
        assert.deepEqual(got(r), insideA);
        assert.deepEqual([r.managerA.type, r.managerA.deliveryPartnerId], ['rider_assigned', RIDER]);
        assert.equal((await offer)?.orderMongoId, o.id, 'the rider\'s own room gets the offer');
        assert.ok(await done, 'the manager gets the assignment confirmation');
    });
    test('rooms come from the token: joining attempts by name do nothing', async () => {
        for (const room of [`store:${A.storeId}`, `franchise:${A.franchiseId}`]) {
            who.customerA.emit('join-store', A.storeId);
            who.customerA.emit('join', room);
            who.managerB.emit('join-store', A.storeId);
            who.adminB.emit('join', room);
        }
        const o = await order();
        const r = await watch(() => fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'preparing' } }));
        assert.deepEqual(got(r), insideA);
    });
});

describe('order events: pure mapping', () => {
    test('what each change means', async () => {
        const { eventTypesOf } = await import('../src/modules/food/orders/services/order-events.service.js');
        const change = (updatedFields, doc, operationType = 'update') => ({ operationType, updateDescription: { updatedFields }, fullDocument: doc });
        assert.deepEqual(eventTypesOf(change({}, { orderStatus: 'created' }, 'insert')), ['new_order']);
        assert.deepEqual(eventTypesOf(change({ orderStatus: 'delivered', 'statusHistory.3': {} }, { orderStatus: 'delivered' })), ['delivered']);
        assert.deepEqual(eventTypesOf(change({ orderStatus: 'cancelled_by_user' }, { orderStatus: 'cancelled_by_user' })), ['cancelled']);
        assert.deepEqual(eventTypesOf(change({ 'kitchen.stage': 'baking' }, { orderStatus: 'preparing' })), ['stage_changed']);
        assert.deepEqual(eventTypesOf(change({ orderStatus: 'preparing', 'kitchen.stage': 'preparing' }, { orderStatus: 'preparing' })).sort(), ['stage_changed', 'status_changed']);
        assert.deepEqual(eventTypesOf(change({ 'dispatch.deliveryPartnerId': 'x' }, { dispatch: { deliveryPartnerId: 'x' } })), ['rider_assigned']);
        assert.deepEqual(eventTypesOf(change({ 'dispatch.deliveryPartnerId': null }, { dispatch: { deliveryPartnerId: null } })), [], 'a rider removed is not an assignment');
        assert.deepEqual(eventTypesOf(change({ note: 'x' }, { orderStatus: 'preparing' })), []);
        assert.deepEqual(eventTypesOf({ operationType: 'update', updateDescription: { updatedFields: { orderStatus: 'x' } } }), []);
    });
});
