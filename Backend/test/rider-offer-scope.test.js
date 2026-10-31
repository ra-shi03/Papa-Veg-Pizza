// Which orders a rider sees and can accept, and what they see before accepting.
//   rule (same as auto-dispatch, riderScope): approved, and the store's own rider, or a rider of its franchise or of the
//   shared fleet who is near it; or the order was offered to this rider.
//   before accept: store, area, total, distance and item count. Never the customer's name, phone, email, street or location.
//   after accept: the details, only for that rider, never the email.
// Redis and BullMQ are off in tests, so all of this also proves the poll works as the fallback.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFixture, mongoose } from './helpers/fixture.js';

const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const INDORE = { lat: 22.7196, lng: 75.8577 };
const CUSTOMER = { name: 'Secret Customer', phone: '9812340000', email: 'secret.customer@example.invalid', street: '7 Hidden Lane', landmark: 'Behind the blue gate', zip: '452010', lat: 22.7311, lng: 75.8822 };
const AVAILABLE = '/v1/food/delivery/orders/available';
const Rd = (id) => `/v1/food/delivery/orders/${id}`;

let fx; let A; let B;
const riders = {};
let seq = 0;

const ok = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const partners = () => mongoose.connection.collection('food_delivery_partners');

async function rider(key, set = {}) {
    const r = await fx.partner();
    await partners().updateOne({ _id: oid(r.id) }, { $set: { name: `Rider ${key}`, storeId: null, franchiseId: null, ...set } });
    riders[key] = r;
}
const near = { lastLocation: point(INDORE.lat + 0.005, INDORE.lng), lastLat: INDORE.lat + 0.005, lastLng: INDORE.lng, lastLocationAt: new Date() };
const far = { lastLocation: point(19.076, 72.8777), lastLat: 19.076, lastLng: 72.8777, lastLocationAt: new Date(), city: 'Mumbai' };

async function makeOrder(dispatch = { status: 'unassigned' }) {
    const ref = `OS${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: oid(A.customerId), storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderStatus: 'confirmed',
        payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: 700, deliveryFee: 40, total: 740 },
        customerName: CUSTOMER.name, customerPhone: CUSTOMER.phone,
        deliveryAddress: {
            name: CUSTOMER.name, fullName: CUSTOMER.name, phone: CUSTOMER.phone, street: CUSTOMER.street, additionalDetails: CUSTOMER.landmark,
            city: 'Indore', state: 'MP', zipCode: CUSTOMER.zip, location: point(CUSTOMER.lat, CUSTOMER.lng),
        },
        items: [{ itemId: 'x', name: 'Margherita', quantity: 2, price: 200 }, { itemId: 'y', name: 'Farmhouse', quantity: 1, price: 300 }],
        statusHistory: [], kitchen: { stage: 'pending' }, dispatch, createdAt: new Date(), updatedAt: new Date(),
    });
    return { id: String(r.insertedId), ref };
}
const seen = async (who) => ok(await fx.call('GET', AVAILABLE, riders[who].token)).data.map((d) => d._id);
const accept = (id, who) => fx.call('PATCH', Rd(`${id}/accept`), riders[who].token, {});
const dbOrder = (id) => fx.models.FoodOrder.findById(id).lean();

const leaks = (body) => {
    const text = JSON.stringify(body);
    const secrets = [CUSTOMER.name, CUSTOMER.phone, CUSTOMER.email, CUSTOMER.street, CUSTOMER.landmark, CUSTOMER.zip, String(CUSTOMER.lat), String(CUSTOMER.lng)];
    return [
        ...secrets.filter((s) => text.includes(s)),
        ...['customerName', 'customerPhone', 'userName', 'userPhone', 'userId', 'deliveryAddress', 'offeredTo', 'statusHistory'].filter((k) => text.includes(`"${k}"`)),
    ];
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: INDORE.lat, longitude: INDORE.lng, city: 'Indore', zoneId: null, storeName: 'Palasia Test Store' } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 28.6139, longitude: 77.209, city: 'Delhi', zoneId: null } });
    await fx.models.User.updateOne({ _id: A.customerId }, { $set: { email: CUSTOMER.email, phone: CUSTOMER.phone, name: CUSTOMER.name } });
    await rider('shared', near);
    await rider('shared2', near);
    await rider('shared3', near);
    await rider('claimed', { ...near, franchiseId: oid(A.franchiseId) });
    await rider('own', { ...far, storeId: oid(A.storeId), franchiseId: oid(A.franchiseId) });
    await rider('far', far);
    await rider('otherFranchise', { ...near, franchiseId: oid(B.franchiseId) });
    await rider('otherStore', { ...near, storeId: oid(B.storeId), franchiseId: oid(B.franchiseId) });
    await rider('offeredFar', far);
    await rider('declinedFar', far);
});
after(async () => { await fx?.teardown(); });

describe('who sees and can accept an open order', () => {
    let order;
    before(async () => {
        order = await makeOrder({
            status: 'unassigned',
            offeredTo: [
                { partnerId: oid(riders.offeredFar.id), at: new Date(), action: 'offered' },
                { partnerId: oid(riders.declinedFar.id), at: new Date(), action: 'rejected' },
            ],
        });
    });

    for (const who of ['shared', 'claimed', 'own', 'offeredFar']) {
        test(`${who} sees it`, async () => assert.ok((await seen(who)).includes(order.id)));
    }
    for (const who of ['far', 'otherFranchise', 'otherStore', 'declinedFar']) {
        test(`${who} does not see it, and cannot accept it`, async () => {
            assert.ok(!(await seen(who)).includes(order.id));
            assert.equal((await accept(order.id, who)).status, 403);
            const db = await dbOrder(order.id);
            assert.deepEqual([db.dispatch.status, db.dispatch.deliveryPartnerId ?? null], ['unassigned', null]);
        });
    }
    test('a rider far from the store but offered the order can accept it', async () => {
        const o = await makeOrder({ status: 'unassigned', offeredTo: [{ partnerId: oid(riders.offeredFar.id), at: new Date(), action: 'offered' }] });
        assert.equal((await accept(o.id, 'offeredFar')).status, 200);
    });
    test('an order assigned to one rider is not open to others', async () => {
        const o = await makeOrder({ status: 'assigned', deliveryPartnerId: oid(riders.shared2.id) });
        assert.ok(!(await seen('shared')).includes(o.id));
        assert.equal((await accept(o.id, 'shared')).status, 409);
        assert.ok((await seen('shared2')).includes(o.id), 'the assigned rider still gets it');
        assert.deepEqual(leaks(ok(await fx.call('GET', AVAILABLE, riders.shared2.token)).data.find((d) => d._id === o.id)), [], 'assigned is not accepted yet');
        assert.equal((await accept(o.id, 'shared2')).status, 200);
    });
    test('rider signup that is not approved cannot use it', async () => {
        const pending = await fx.partner('pending');
        assert.equal((await fx.call('GET', AVAILABLE, pending.token)).status, 401);
        assert.equal((await fx.call('PATCH', Rd(`${order.id}/accept`), pending.token, {})).status, 401);
    });
    test('customers and store staff cannot use the rider routes', async () => {
        for (const token of [A.customerToken, A.managerToken]) assert.equal((await fx.call('GET', AVAILABLE, token)).status, 403);
    });
});

describe('what a rider sees before accepting', () => {
    let order; let offer;
    before(async () => {
        order = await makeOrder();
        offer = ok(await fx.call('GET', AVAILABLE, riders.shared.token)).data.find((d) => d._id === order.id);
    });

    test('no customer name, phone, email, street, location or other riders', () => assert.deepEqual(leaks(offer), []));
    test('store name, area, order total, distance and item count', () => {
        assert.equal(offer.storeName, 'Palasia Test Store');
        assert.equal(offer.area, 'Indore');
        assert.equal(offer.total, 740);
        assert.equal(offer.itemCount, 3);
        assert.ok(offer.pickupDistanceKm > 0 && offer.pickupDistanceKm < 2, String(offer.pickupDistanceKm));
    });
    test('the fields the delivery app reads are still there', async () => {
        const data = ok(await fx.call('GET', AVAILABLE, riders.shared.token));
        assert.ok(Array.isArray(data.data), 'the list');
        // The poll is the fallback when the socket misses an offer: the app must read the list from where the API puts it
        const home = readFileSync(new URL('../../Frontend/src/modules/DeliveryV2/pages/DeliveryHomeV2.jsx', import.meta.url), 'utf8');
        assert.ok(home.includes('Array.isArray(availablePayload?.data)'), 'DeliveryHomeV2 reads the list from data.data');
        assert.equal(typeof data.cashLimit.blocked, 'boolean');
        // DeliveryHomeV2 picks the offer by these
        assert.deepEqual([offer.dispatch.status, offer.orderStatus], ['unassigned', 'confirmed']);
        // useOrderManager and NewOrderModal
        assert.deepEqual([offer._id, offer.orderMongoId, offer.orderId], [order.id, order.id, order.ref]);
        assert.deepEqual([offer.storeLocation.latitude, offer.storeLocation.longitude], [INDORE.lat, INDORE.lng]);
        assert.equal(offer.customerAddress, 'Indore');
        assert.equal(offer.earnings, 40);
        assert.equal(offer.paymentMethod, 'cash');
    });
    test('a rider with no GPS: no distance, and the app falls back to its own calculation', async () => {
        await rider('noGps', { city: 'Indore' });
        const row = ok(await fx.call('GET', AVAILABLE, riders.noGps.token)).data.find((d) => d._id === order.id);
        assert.ok(row, 'near by city');
        assert.equal(row.pickupDistanceKm, undefined);
    });
    test('order by id: nothing unless it is theirs; an assigned order is still only the offer', async () => {
        assert.equal((await fx.call('GET', Rd(order.id), riders.shared.token)).status, 403);
        const assigned = await makeOrder({ status: 'assigned', deliveryPartnerId: oid(riders.shared3.id) });
        const body = await fx.call('GET', Rd(assigned.id), riders.shared3.token);
        assert.equal(body.status, 200, JSON.stringify(body.body));
        assert.deepEqual(leaks(body.body), []);
    });
    test('the socket offer has the same limits', async () => {
        const { buildDeliveryOfferPayload } = await import('../src/modules/food/orders/services/order.helpers.js');
        const doc = await fx.models.FoodOrder.findById(order.id).lean();
        const payload = buildDeliveryOfferPayload(doc, { storeName: 'S', location: { latitude: 1, longitude: 2 } });
        assert.deepEqual(leaks(payload), []);
        assert.deepEqual([payload.storeLocation.latitude, payload.orderMongoId, payload.dispatch.status], [1, order.id, 'unassigned']);
    });
});

describe('accepting', () => {
    let order; let accepted;
    before(async () => { order = await makeOrder(); });

    test('the rider gets the customer details, with no email and no other account data', async () => {
        const res = await accept(order.id, 'shared');
        accepted = ok(res).order;
        assert.deepEqual([accepted.customerName, accepted.customerPhone, accepted.deliveryAddress.street], [CUSTOMER.name, CUSTOMER.phone, CUSTOMER.street]);
        // the app reads these to open the map
        assert.deepEqual(accepted.deliveryAddress.location.coordinates, [CUSTOMER.lng, CUSTOMER.lat]);
        assert.deepEqual([accepted.storeId.latitude, accepted.storeId.longitude], [INDORE.lat, INDORE.lng]);
        const text = JSON.stringify(res.body);
        assert.ok(!text.includes(CUSTOMER.email), 'no email');
        for (const key of ['"password"', '"addresses"', '"fcmTokens"', '"documents"']) assert.ok(!text.includes(key), key);
    });
    test('accepting twice is 409 and changes nothing', async () => {
        const before = await dbOrder(order.id);
        const res = await accept(order.id, 'shared');
        assert.equal(res.status, 409);
        assert.match(res.body.error, /already accepted/);
        const after = await dbOrder(order.id);
        assert.equal(after.statusHistory.length, before.statusHistory.length);
        assert.equal(String(after.dispatch.deliveryPartnerId), riders.shared.id);
    });
    test('another rider accepting it is 409 too', async () => {
        const res = await accept(order.id, 'claimed');
        assert.equal(res.status, 409);
        assert.match(res.body.error, /already accepted/);
        assert.equal(String((await dbOrder(order.id)).dispatch.deliveryPartnerId), riders.shared.id);
    });
    test('two riders at once: one wins, the other gets 409', async () => {
        const o = await makeOrder();
        const results = await Promise.all([accept(o.id, 'shared2'), accept(o.id, 'shared3')]);
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    });
    test('afterwards it leaves the others\' list; the rider sees it with details, without the email', async () => {
        assert.ok(!(await seen('claimed')).includes(order.id));
        const own = ok(await fx.call('GET', AVAILABLE, riders.shared.token)).data.find((d) => d._id === order.id);
        assert.equal(own.customerName, CUSTOMER.name);
        assert.ok(!JSON.stringify(own).includes(CUSTOMER.email));
    });
    test('order by id and current trip: details for the accepted rider, no email; refused for anyone else', async () => {
        const mine = await fx.call('GET', Rd(order.id), riders.shared.token);
        assert.equal(mine.status, 200, JSON.stringify(mine.body));
        assert.ok(JSON.stringify(mine.body).includes(CUSTOMER.street));
        assert.ok(!JSON.stringify(mine.body).includes(CUSTOMER.email), 'audit3 M8');
        assert.equal((await fx.call('GET', Rd(order.id), riders.claimed.token)).status, 403);
        const current = await fx.call('GET', '/v1/food/delivery/orders/current', riders.shared.token);
        assert.ok(!JSON.stringify(current.body).includes(CUSTOMER.email));
    });
});
