// Store delivery (/v1/store/riders, /rider/:id, /orders/ready, /tracking, /delivery/*, /orders/:id/refund),
// zones for the delivery app, and the delivery order-by-id scope. Role and scope from the token.
//
// Store A orders: ready (ready_for_pickup, no rider), prep (preparing), road (picked_up, rider R1), done (delivered, rider R1),
// gone (cancelled). Store B: bready (ready_for_pickup).
// Riders: R1 shared + online near store A, R2 belongs to store B, R3 shared but pending approval (no location),
// R4 belongs to store A + offline. Who is near whom is covered in nearby-people.test.js.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let sup; let staff; let zoneId;
const O = {};
const R = { 1: new mongoose.Types.ObjectId(), 2: new mongoose.Types.ObjectId(), 3: new mongoose.Types.ObjectId(), 4: new mongoose.Types.ObjectId() };
const oid = (v) => new mongoose.Types.ObjectId(v);
const minsAgo = (m) => new Date(Date.now() - m * 60000);
let seq = 0;

async function seed(f, { status, total = 300, dispatch, history = [], extra = {} }) {
    const ref = `DL${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: oid(f.customerId), storeId: oid(f.storeId), franchiseId: oid(f.franchiseId),
        orderStatus: status, payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: total, total },
        deliveryAddress: { street: '1 Test Rd', city: 'Indore', state: 'MP', name: 'Asha', phone: '9000000001', location: { type: 'Point', coordinates: [75.9, 22.75] } },
        customerName: 'Asha Customer', customerPhone: '9000000001', items: [{ itemId: 'x', name: 'Margherita', quantity: 2, size: 'Medium', price: total / 2 }],
        statusHistory: [{ at: minsAgo(60), byRole: 'SYSTEM', from: '', to: 'created' }, ...history],
        kitchen: { stage: 'ready', readyAt: minsAgo(20) }, dispatch: dispatch || { status: 'unassigned' },
        createdAt: minsAgo(60), updatedAt: new Date(), deliveryOtp: '4321', ...extra,
    });
    return { id: String(r.insertedId), ref };
}
const partner = (id, over) => ({ _id: id, name: `Rider ${over.n}`, phone: `91000000${over.n}0`, vehicleType: 'Bike', vehicleNumber: `MP09-${over.n}`, status: 'approved', availabilityStatus: 'online', rating: 4.5, createdAt: new Date(), updatedAt: new Date(), ...over.set });

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = fx.claim('KITCHEN_SUPERVISOR', { franchiseId: A.franchiseId, storeId: A.storeId });
    staff = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: 22.74, longitude: 75.89 } });
    await mongoose.connection.collection('food_delivery_partners').insertMany([
        partner(R[1], { n: 1, set: { lastLat: 22.75, lastLng: 75.9, lastLocation: { type: 'Point', coordinates: [75.9, 22.75] } } }),
        partner(R[2], { n: 2, set: { storeId: oid(B.storeId), franchiseId: oid(B.franchiseId) } }),
        partner(R[3], { n: 3, set: { status: 'pending' } }),
        partner(R[4], { n: 4, set: { storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), availabilityStatus: 'offline' } }),
    ]);
    await fx.models.FoodOrder.deleteMany({});
    O.ready = await seed(A, { status: 'ready_for_pickup' });
    O.prep = await seed(A, { status: 'preparing' });
    O.road = await seed(A, {
        status: 'picked_up', dispatch: { status: 'accepted', deliveryPartnerId: R[1], assignedAt: minsAgo(25), acceptedAt: minsAgo(24) },
        history: [{ at: minsAgo(25), byRole: 'ADMIN', from: 'unassigned', to: 'rider_assigned' }, { at: minsAgo(10), byRole: 'DELIVERY_PARTNER', from: 'ready_for_pickup', to: 'picked_up' }],
        extra: { lastRiderLocation: { type: 'Point', coordinates: [75.895, 22.745] } },
    });
    O.done = await seed(A, {
        status: 'delivered', total: 500, dispatch: { status: 'accepted', deliveryPartnerId: R[1] },
        history: [{ at: minsAgo(40), byRole: 'DELIVERY_PARTNER', from: 'x', to: 'picked_up' }, { at: minsAgo(10), byRole: 'DELIVERY_PARTNER', from: 'picked_up', to: 'delivered' }],
    });
    O.gone = await seed(A, { status: 'cancelled_by_store', total: 200 });
    O.bready = await seed(B, { status: 'ready_for_pickup' });
    const ZONE = [{ latitude: 22.7, longitude: 75.8 }, { latitude: 22.7, longitude: 76 }, { latitude: 22.8, longitude: 76 }, { latitude: 22.8, longitude: 75.8 }];
    zoneId = (await mongoose.connection.collection('food_zones').insertOne({ name: 'Indore Central', zoneName: 'Indore Central', regionId: new mongoose.Types.ObjectId(), country: 'India', coordinates: ZONE, isActive: true })).insertedId;
});
after(async () => { await fx?.teardown(); });

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const S = '/v1/store';
const GETS = ['/riders', `/rider/${R[1]}`, '/orders/ready', '/delivery/live', '/delivery/available-riders', '/delivery/issues'];

describe('who sees what', () => {
    test('anonymous 401; kitchen staff and customers 403 on every call', async () => {
        for (const p of [...GETS, `/tracking/${O.road.id}`, `/delivery/timeline/${O.road.id}`]) {
            assert.equal((await fx.call('GET', `${S}${p}`)).status, 401, p);
            for (const token of [staff, A.customerToken]) assert.equal((await fx.call('GET', `${S}${p}`, token)).status, 403, p);
        }
        for (const [m, p] of [['POST', '/delivery/assign'], ['POST', '/delivery/issues'], ['POST', `/orders/${O.done.id}/refund`], ['PATCH', `/delivery/issues/${new mongoose.Types.ObjectId()}`]]) {
            for (const token of [staff, A.customerToken]) assert.equal((await fx.call(m, `${S}${p}`, token, {})).status, 403, `${m} ${p}`);
        }
    });
    test('store manager and kitchen supervisor read their own store; franchise and super admin need a store of their own scope', async () => {
        for (const p of GETS) {
            ok(await fx.call('GET', `${S}${p}`, A.managerToken));
            ok(await fx.call('GET', `${S}${p}`, sup));
            assert.equal((await fx.call('GET', `${S}${p}`, A.adminToken)).status, 400, `${p} needs a storeId`);
            const sep = p.includes('?') ? '&' : '?';
            ok(await fx.call('GET', `${S}${p}${sep}storeId=${A.storeId}`, A.adminToken));
            ok(await fx.call('GET', `${S}${p}${sep}storeId=${A.storeId}`, fx.SA));
            assert.equal((await fx.call('GET', `${S}${p}${sep}storeId=${A.storeId}`, B.adminToken)).status, 404, p);
        }
        // a store role cannot look at another store by naming it
        assert.deepEqual(ok(await fx.call('GET', `${S}/orders/ready?storeId=${B.storeId}`, A.managerToken)).map((o) => o._id), [O.ready.id], 'the token decides the store');
    });
    test('writes: only the store manager; supervisor, franchise admin and super admin are read-only', async () => {
        const body = { orderId: O.ready.id, riderId: String(R[1]) };
        for (const token of [sup, A.adminToken, fx.SA]) {
            const q = token === sup ? '' : `?storeId=${A.storeId}`;
            assert.equal((await fx.call('POST', `${S}/delivery/assign${q}`, token, body)).status, 403);
            assert.equal((await fx.call('POST', `${S}/delivery/issues${q}`, token, { orderId: O.road.ref, riderId: String(R[1]), issueType: 'Late', description: 'x' })).status, 403);
            assert.equal((await fx.call('POST', `${S}/orders/${O.done.id}/refund${q}`, token, { reason: 'x' })).status, 403);
        }
        assert.equal(await fx.models.FoodOrder.countDocuments({ _id: O.ready.id, 'dispatch.deliveryPartnerId': { $ne: null } }), 0, 'nothing was assigned');
    });
    test('another store\'s order and rider are 404', async () => {
        assert.equal((await fx.call('GET', `${S}/tracking/${O.bready.id}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `${S}/delivery/timeline/${O.bready.ref}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `${S}/rider/${R[2]}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `${S}/rider/not-an-id`, A.managerToken)).status, 404);
        assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.bready.id, riderId: String(R[1]) })).status, 404);
        assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.ready.id, riderId: String(R[2]) })).status, 404, 'a rider of another store');
        assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.ready.id, riderId: String(R[3]) })).status, 404, 'a rider not approved');
        assert.equal((await fx.call('POST', `${S}/orders/${O.bready.id}/refund`, A.managerToken, {})).status, 404);
        assert.equal((await fx.call('GET', `${S}/tracking/${O.road.id}`, B.managerToken)).status, 404);
    });
});

describe('riders and orders', () => {
    test('riders: approved ones this store may use, with the screen\'s fields', async () => {
        const list = ok(await fx.call('GET', `${S}/riders`, A.managerToken));
        assert.deepEqual(list.map((r) => r.name).sort(), ['Rider 1', 'Rider 4']);
        const r1 = list.find((r) => r.name === 'Rider 1');
        assert.deepEqual(
            [r1.mobile, r1.vehicleType, r1.availability, r1.currentStatus, r1.currentOrderId, r1.activeOrders, r1.todayDeliveries, r1.averageDeliveryTime, r1.cancellationRate],
            ['91******10', 'Bike', 'online', 'busy', O.road.ref, 1, 1, 30, 0],
        );
        assert.equal(list.find((r) => r.name === 'Rider 4').currentStatus, 'idle');
        assert.ok(!JSON.stringify(list).includes('password'));
        // Store B is far from R1 (another city), so only its own rider
        assert.deepEqual(ok(await fx.call('GET', `${S}/riders`, B.managerToken)).map((r) => r.name).sort(), ['Rider 2']);
        assert.equal(ok(await fx.call('GET', `${S}/rider/${R[1]}`, A.managerToken)).name, 'Rider 1');
    });
    test('available riders: online ones only, with distance from the store', async () => {
        const list = ok(await fx.call('GET', `${S}/delivery/available-riders`, A.managerToken));
        assert.deepEqual(list.map((r) => [r.name, r.currentStatus, r.availability, r.activeOrders]), [['Rider 1', 'online', 'busy', 1]]);
        assert.ok(list[0].distanceFromStore > 0 && list[0].distanceFromStore < 5);
    });
    test('orders ready for a rider, with search and status filters', async () => {
        const list = ok(await fx.call('GET', `${S}/orders/ready`, A.managerToken));
        assert.deepEqual(list.map((o) => o._id), [O.ready.id]);
        assert.deepEqual(
            [list[0].orderNumber, list[0].customerName, list[0].totalAmount, list[0].deliveryStatus, list[0].assignedRiderId, list[0].deliveryAddress, list[0].items],
            [O.ready.ref, 'Asha Customer', 300, 'waiting', null, '1 Test Rd, Indore, MP', [{ name: 'Margherita', quantity: 2, size: 'Medium' }]],
        );
        assert.equal(ok(await fx.call('GET', `${S}/orders/ready?search=asha`, A.managerToken)).length, 1);
        assert.equal(ok(await fx.call('GET', `${S}/orders/ready?search=nobody`, A.managerToken)).length, 0);
        assert.equal(ok(await fx.call('GET', `${S}/orders/ready?status=assigned`, A.managerToken)).length, 0);
    });
    test('live deliveries: on the road and delivered today', async () => {
        const list = ok(await fx.call('GET', `${S}/delivery/live`, A.managerToken));
        assert.deepEqual(list.map((d) => [d.orderId, d.riderName, d.deliveryStatus]).sort(), [[O.done.ref, 'Rider 1', 'delivered'], [O.road.ref, 'Rider 1', 'picked_up']].sort());
        assert.equal(list.find((d) => d.orderId === O.done.ref).eta, 'Delivered');
        assert.match(list.find((d) => d.orderId === O.road.ref).eta, /^\d+ mins$/);
        assert.deepEqual(ok(await fx.call('GET', `${S}/delivery/live`, B.managerToken)), []);
    });
    test('tracking and timeline', async () => {
        const t = ok(await fx.call('GET', `${S}/tracking/${O.road.ref}`, A.managerToken));
        assert.deepEqual(t.customer, { name: 'Asha Customer', phone: '9000000001', address: '1 Test Rd, Indore, MP', latitude: 22.75, longitude: 75.9 });
        assert.deepEqual([t.rider.name, t.rider.vehicleNumber, t.rider.latitude, t.rider.longitude], ['Rider 1', 'MP09-1', 22.745, 75.895]);
        assert.deepEqual([t.order.orderId, t.order.amount, t.order.status], [O.road.ref, 300, 'picked_up']);
        assert.deepEqual(t.store, { latitude: 22.74, longitude: 75.89 });
        assert.ok(t.timeline.assignedAt && t.timeline.pickupAt && !t.timeline.deliveredAt);
        assert.ok(!JSON.stringify(t).includes('4321'), 'no drop OTP');
        const line = ok(await fx.call('GET', `${S}/delivery/timeline/${O.road.id}`, A.managerToken));
        assert.deepEqual(line.map((x) => x.status), ['created', 'rider_assigned', 'picked_up']);
        assert.equal(ok(await fx.call('GET', `${S}/tracking/${O.ready.id}`, A.managerToken)).rider, null);
    });
});

describe('assign and reassign', () => {
    test('assign a rider: the order is assigned in the DB and shows as assigned', async () => {
        const res = ok(await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.ready.id, riderId: String(R[1]) }));
        assert.equal(res.riderId, String(R[1]));
        const o = await fx.models.FoodOrder.findById(O.ready.id).lean();
        assert.equal(o.dispatch.status, 'assigned');
        assert.equal(String(o.dispatch.deliveryPartnerId), String(R[1]));
        assert.equal(o.statusHistory.at(-1).to, 'rider_assigned');
        assert.equal(o.statusHistory.at(-1).byRole, 'STORE_MANAGER');
        const [row] = ok(await fx.call('GET', `${S}/orders/ready`, A.managerToken));
        assert.deepEqual([row.deliveryStatus, row.assignedRiderId], ['assigned', String(R[1])]);
    });
    test('the same rider again is refused; another rider replaces the first', async () => {
        assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.ready.id, riderId: String(R[1]) })).status, 400);
        ok(await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.ready.id, riderId: String(R[4]) }));
        assert.equal(String((await fx.models.FoodOrder.findById(O.ready.id).lean()).dispatch.deliveryPartnerId), String(R[4]));
    });
    test('an order already picked up, still cooking-free, delivered or cancelled cannot be assigned', async () => {
        for (const o of [O.road, O.done, O.gone]) assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: o.id, riderId: String(R[4]) })).status, 400, o.ref);
        ok(await fx.call('POST', `${S}/delivery/assign`, A.managerToken, { orderId: O.prep.ref, riderId: String(R[4]) }));
        assert.equal((await fx.call('POST', `${S}/delivery/assign`, A.managerToken, {})).status, 400);
    });
});

describe('refund request (record only)', () => {
    test('a delivered order: a pending request is recorded; no money moves', async () => {
        const wallets = await mongoose.connection.collection('wallettransactions').countDocuments({}).catch(() => 0);
        const r = ok(await fx.call('POST', `${S}/orders/${O.done.id}/refund`, A.managerToken, { reason: 'Cold pizza' }), 201);
        assert.deepEqual([r.orderNumber, r.reason, r.amount, r.status, r.approvedBy], [O.done.ref, 'Cold pizza', 500, 'pending', '--']);
        const doc = await mongoose.connection.collection('refunds').findOne({ orderId: oid(O.done.id) });
        assert.equal(doc.status, 'pending');
        assert.equal(doc.processedAt, null);
        assert.equal(doc.gatewayRefundId, '');
        assert.equal(await mongoose.connection.collection('wallettransactions').countDocuments({}).catch(() => 0), wallets);
    });
    test('a second request, a running order and a too-large amount are refused', async () => {
        assert.equal((await fx.call('POST', `${S}/orders/${O.done.id}/refund`, A.managerToken, { reason: 'again' })).status, 400);
        assert.equal((await fx.call('POST', `${S}/orders/${O.road.id}/refund`, A.managerToken, {})).status, 400);
        assert.equal((await fx.call('POST', `${S}/orders/${O.gone.id}/refund`, A.managerToken, { amount: 999 })).status, 400);
        ok(await fx.call('POST', `${S}/orders/${O.gone.id}/refund`, A.managerToken, { amount: 150 }), 201);
        assert.equal((await mongoose.connection.collection('refunds').findOne({ orderId: oid(O.gone.id) })).amount, 150);
    });
});

describe('delivery issues', () => {
    let issueId;
    test('the manager reports an issue by order number; it is listed for the store only', async () => {
        const i = ok(await fx.call('POST', `${S}/delivery/issues`, A.managerToken, {
            orderId: O.road.ref, riderId: String(R[1]), issueType: 'Rider Not Responding', description: 'No answer', severity: 'critical', reportedBy: 'Store Manager',
        }), 201);
        issueId = i._id;
        assert.deepEqual([i.orderId, i.riderName, i.issueType, i.severity, i.status, i.refundAmount], [O.road.ref, 'Rider 1', 'Rider Not Responding', 'critical', 'open', 0]);
        assert.deepEqual(ok(await fx.call('GET', `${S}/delivery/issues`, sup)).map((x) => x._id), [issueId]);
        assert.deepEqual(ok(await fx.call('GET', `${S}/delivery/issues`, B.managerToken)), []);
        assert.equal((await fx.call('PATCH', `${S}/delivery/issues/${issueId}`, B.managerToken, { status: 'resolved' })).status, 404);
        assert.equal((await fx.call('POST', `${S}/delivery/issues`, A.managerToken, { orderId: O.bready.ref, riderId: String(R[1]), issueType: 'Late' })).status, 404);
        assert.equal((await fx.call('POST', `${S}/delivery/issues`, A.managerToken, { orderId: O.road.ref, riderId: String(R[2]), issueType: 'Late' })).status, 404);
        assert.equal((await fx.call('POST', `${S}/delivery/issues`, A.managerToken, { orderId: O.road.ref, issueType: '' })).status, 400);
    });
    test('resolving: status and notes saved; a penalty is only a note', async () => {
        const i = ok(await fx.call('PATCH', `${S}/delivery/issues/${issueId}`, A.managerToken, { status: 'resolved', resolution: 'Spoke to the rider', penaltyAmount: 50 }));
        assert.deepEqual([i.status, i.resolution, i.penaltyAmount], ['resolved', 'Spoke to the rider', 50]);
        assert.equal((await mongoose.connection.collection('food_delivery_partners').findOne({ _id: R[1] })).walletAmount, undefined);
    });
    test('resolving with a refund records a pending refund request on the order', async () => {
        const o = await seed(A, { status: 'delivered', total: 400, dispatch: { status: 'accepted', deliveryPartnerId: R[1] } });
        const issue = ok(await fx.call('POST', `${S}/delivery/issues`, A.managerToken, { orderId: o.ref, riderId: String(R[1]), issueType: 'Damaged Food' }), 201);
        const done = ok(await fx.call('PATCH', `${S}/delivery/issues/${issue._id}`, A.managerToken, { status: 'resolved', refundAmount: 120 }));
        assert.equal(done.refundAmount, 120);
        const refund = await mongoose.connection.collection('refunds').findOne({ orderId: oid(o.id) });
        assert.deepEqual([refund.status, refund.amount], ['pending', 120]);
        assert.equal((await fx.call('PATCH', `${S}/delivery/issues/${issue._id}`, A.managerToken, { refundAmount: 50 })).status, 400, 'a refund request is already open');
    });
    test('resolving with a reassignment gives the order to the new rider', async () => {
        const issue = ok(await fx.call('POST', `${S}/delivery/issues`, A.managerToken, { orderId: O.prep.ref, riderId: String(R[4]), issueType: 'Late Delivery' }), 201);
        const bad = await fx.call('PATCH', `${S}/delivery/issues/${issue._id}`, A.managerToken, { reassignRiderId: String(R[2]) });
        assert.equal(bad.status, 404, 'a rider of another store');
        const done = ok(await fx.call('PATCH', `${S}/delivery/issues/${issue._id}`, A.managerToken, { reassignRiderId: String(R[1]), status: 'resolved' }));
        assert.equal(done.riderName, 'Rider 1');
        assert.equal(String((await fx.models.FoodOrder.findById(O.prep.id).lean()).dispatch.deliveryPartnerId), String(R[1]));
    });
});

describe('zones near the rider (delivery app)', () => {
    const rider = () => fx.tokenFor(R[1], 'DELIVERY_PARTNER');
    test('delivery partners only', async () => {
        for (const token of [A.managerToken, A.adminToken, A.customerToken, staff]) assert.equal((await fx.call('GET', '/v1/food/zones/nearby?lat=22.75&lng=75.9', token)).status, 403);
        assert.equal((await fx.call('GET', '/v1/food/zones/nearby?lat=22.75&lng=75.9')).status, 401);
    });
    test('inside a zone, near one, and too far', async () => {
        const inside = ok(await fx.call('GET', '/v1/food/zones/nearby?lat=22.75&lng=75.9&radius=5', rider()));
        assert.deepEqual(inside.map((z) => [z._id, z.contains, z.distanceKm]), [[String(zoneId), true, 0]]);
        assert.equal(inside[0].coordinates.length, 4);
        const near = ok(await fx.call('GET', '/v1/food/zones/nearby?lat=22.85&lng=75.9&radius=20', rider()));
        assert.equal(near[0].contains, false);
        assert.ok(near[0].distanceKm > 5 && near[0].distanceKm < 7);
        assert.deepEqual(ok(await fx.call('GET', '/v1/food/zones/nearby?lat=22.85&lng=75.9&radius=2', rider())), []);
        assert.equal((await fx.call('GET', '/v1/food/zones/nearby?lat=abc', rider())).status, 400);
    });
});

describe('delivery app: order by id is scoped to the assigned rider', () => {
    const get = (id, token) => fx.call('GET', `/v1/food/delivery/orders/${id}`, token);
    test('the assigned rider reads it, without the drop OTP; another rider, a customer and a store manager cannot', async () => {
        const res = ok(await get(O.road.id, fx.tokenFor(R[1], 'DELIVERY_PARTNER')));
        assert.equal(res.order.orderId, O.road.ref);
        assert.ok(!JSON.stringify(res).includes('4321'), 'no drop OTP');
        assert.equal(res.order.deliveryOtp, undefined);
        assert.equal((await get(O.road.id, fx.tokenFor(R[4], 'DELIVERY_PARTNER'))).status, 403);
        assert.equal((await get(O.road.ref, fx.tokenFor(R[4], 'DELIVERY_PARTNER'))).status, 403);
        assert.equal((await get(O.road.id, A.customerToken)).status, 403);
        assert.equal((await get(O.road.id, A.managerToken)).status, 403);
        assert.equal((await get(O.bready.id, fx.tokenFor(R[1], 'DELIVERY_PARTNER'))).status, 403, 'an order not assigned to this rider');
        assert.equal((await get(String(new mongoose.Types.ObjectId()), fx.tokenFor(R[1], 'DELIVERY_PARTNER'))).status, 404);
    });
});
