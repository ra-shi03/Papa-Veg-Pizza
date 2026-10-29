// Gaps behind the nearby lists: a saved address keeps its coordinates (and no invented city), a rider's GPS fix is
// saved when the app opens, and auto-dispatch offers an order only to riders the store panel also lists.
// Store A is in Indore, store B in Delhi (different franchises).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
const A_AT = { lat: 22.7196, lng: 75.8577 };
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const ok = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const partners = () => mongoose.connection.collection('food_delivery_partners');
let seq = 0;
async function rider(set = {}) {
    const _id = new mongoose.Types.ObjectId();
    await partners().insertOne({
        _id, name: 'Rider', phone: `95${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, status: 'approved', availabilityStatus: 'online',
        createdAt: new Date(), updatedAt: new Date(), ...set,
    });
    return { id: String(_id), token: fx.tokenFor(_id, 'DELIVERY_PARTNER') };
}
async function newCustomer(tag) {
    const u = await fx.models.User.create({ mobile: `96${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, loginType: 'OTP', primaryRole: fx.roles.CUSTOMER._id, isActive: true });
    return { id: String(u._id), token: fx.tokenFor(u, 'CUSTOMER'), tag };
}
const nearbyIds = async (token, storeId) => {
    const qs = storeId ? `&storeId=${storeId}` : '';
    return ok(await fx.call('GET', `/v1/food/store/customers/orders?limit=100${qs}`, token)).customers.map((c) => c._id);
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: A_AT.lat, longitude: A_AT.lng, city: 'Indore' } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 28.6139, longitude: 77.209, city: 'Delhi' } });
});
after(async () => { await fx?.teardown(); });

describe('a saved address keeps its coordinates', () => {
    test('with coordinates: stored as the address location, and the customer shows at the store near it', async () => {
        const c = await newCustomer('geo');
        const res = await fx.call('POST', '/v1/food/user/addresses', c.token, { label: 'Home', street: '1 Main Rd', city: '', state: '', latitude: A_AT.lat + 0.01, longitude: A_AT.lng });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const saved = (await fx.models.User.findById(c.id).lean()).addresses[0];
        assert.deepEqual(saved.location.coordinates, [A_AT.lng, A_AT.lat + 0.01]);
        assert.equal(saved.city, '', 'no city is invented');
        assert.ok((await nearbyIds(A.managerToken)).includes(c.id));
        assert.ok(!(await nearbyIds(B.managerToken)).includes(c.id));
    });
    test('without coordinates and without a city: nothing to match, so the customer is hidden everywhere', async () => {
        const c = await newCustomer('none');
        assert.equal((await fx.call('POST', '/v1/food/user/addresses', c.token, { label: 'Home', street: '1 Main Rd' })).status, 201);
        const saved = (await fx.models.User.findById(c.id).lean()).addresses[0];
        assert.deepEqual([saved.city, saved.state], ['', '']);
        for (const [token, id] of [[A.managerToken, A.storeId], [B.managerToken, B.storeId]]) assert.ok(!(await nearbyIds(token, id)).includes(c.id));
    });
    test('[0,0] counts as "no coordinates": it never matches by distance, only by city', async () => {
        const c = await newCustomer('zero');
        await fx.models.User.updateOne({ _id: c.id }, { $set: { addresses: [{ label: 'Home', street: 'x', city: 'Bhopal', location: point(0, 0), isDefault: true }] } });
        assert.ok(!(await nearbyIds(A.managerToken)).includes(c.id));
        await fx.models.User.updateOne({ _id: c.id }, { $set: { 'addresses.0.city': 'indore' } });
        assert.ok((await nearbyIds(A.managerToken)).includes(c.id), 'same city as the store, no usable coordinates');
        // a store AT 0,0 must not pull in every address saved without coordinates
        const { nearbyAddressFilter, storeArea } = await import('../src/modules/food/store/services/nearby.js');
        await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 0, longitude: 0, city: '' } });
        try {
            const area = await storeArea(B.storeId);
            assert.equal(area.center, null);
            const found = await fx.models.User.countDocuments({ _id: c.id, ...nearbyAddressFilter(area, { list: 'addresses', point: 'location', city: 'city' }) });
            assert.equal(found, 0);
        } finally {
            await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 28.6139, longitude: 77.209, city: 'Delhi' } });
        }
    });
});

describe('the rider\'s GPS fix when the app opens', () => {
    const patch = (token, body) => fx.call('PATCH', '/v1/food/delivery/availability', token, body);
    test('saved on the rider (point, lastLat, lastLng, lastLocationAt) without changing online / offline', async () => {
        const r = await rider({ availabilityStatus: 'offline' });
        ok(await patch(r.token, { latitude: A_AT.lat, longitude: A_AT.lng }));
        const p = await partners().findOne({ _id: oid(r.id) });
        assert.deepEqual(p.lastLocation.coordinates, [A_AT.lng, A_AT.lat]);
        assert.deepEqual([p.lastLat, p.lastLng], [A_AT.lat, A_AT.lng]);
        assert.ok(Date.now() - new Date(p.lastLocationAt).getTime() < 60000);
        assert.equal(p.availabilityStatus, 'offline', 'a location-only call never flips availability');
        const online = await rider({ availabilityStatus: 'online' });
        ok(await patch(online.token, { latitude: A_AT.lat, longitude: A_AT.lng }));
        assert.equal((await partners().findOne({ _id: oid(online.id) })).availabilityStatus, 'online');
        ok(await patch(online.token, { status: 'offline' }));
        assert.equal((await partners().findOne({ _id: oid(online.id) })).availabilityStatus, 'offline');
    });
    test('the rider then shows in the nearby store\'s panel (shared fleet, no city)', async () => {
        const r = await rider({ availabilityStatus: 'offline' });
        assert.ok(!ok(await fx.call('GET', '/v1/store/riders', A.managerToken)).some((x) => x._id === r.id));
        ok(await patch(r.token, { latitude: A_AT.lat + 0.01, longitude: A_AT.lng }));
        assert.ok(ok(await fx.call('GET', '/v1/store/riders', A.managerToken)).some((x) => x._id === r.id));
    });
    test('not from an unauthenticated request, a customer token, or a nonsense fix', async () => {
        const r = await rider({});
        assert.equal((await fx.call('PATCH', '/v1/food/delivery/availability', null, { latitude: 1, longitude: 1 })).status, 401);
        assert.equal((await patch(A.customerToken, { latitude: 1, longitude: 1 })).status, 403);
        for (const fix of [{ latitude: 0, longitude: 0 }, { latitude: 123, longitude: 10 }, { latitude: 10, longitude: 500 }, { latitude: '22.7', longitude: '75.8' }]) {
            ok(await patch(r.token, fix));
        }
        assert.equal((await partners().findOne({ _id: oid(r.id) })).lastLat, undefined);
    });
});

describe('auto-dispatch offers only riders the store panel lists', () => {
    test('a far rider is not offered the order; near, pending, offline and other stores\' riders neither', async () => {
        const { listNearbyOnlineDeliveryPartners, tryAutoAssign } = await import('../src/modules/food/orders/services/order-dispatch.service.js');
        const fresh = { lastLocationAt: new Date() };
        const near = await rider({ lastLat: A_AT.lat + 0.01, lastLng: A_AT.lng, lastLocation: point(A_AT.lat + 0.01, A_AT.lng), ...fresh });
        const far = await rider({ lastLat: 28.6139, lastLng: 77.209, lastLocation: point(28.6139, 77.209), ...fresh });
        const farInCity = await rider({ city: 'Delhi' });
        const pending = await rider({ status: 'pending', lastLat: A_AT.lat, lastLng: A_AT.lng, lastLocation: point(A_AT.lat, A_AT.lng), ...fresh });
        const offline = await rider({ availabilityStatus: 'offline', lastLat: A_AT.lat, lastLng: A_AT.lng, lastLocation: point(A_AT.lat, A_AT.lng), ...fresh });
        const ofB = await rider({ storeId: oid(B.storeId), franchiseId: oid(B.franchiseId), lastLat: A_AT.lat, lastLng: A_AT.lng, lastLocation: point(A_AT.lat, A_AT.lng), ...fresh });
        const own = await rider({ storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), lastLat: A_AT.lat, lastLng: A_AT.lng, lastLocation: point(A_AT.lat, A_AT.lng), ...fresh });

        const { partners: list } = await listNearbyOnlineDeliveryPartners(A.storeId, { maxKm: 15, limit: 25, requiredAmount: 0 });
        const ids = list.map((p) => String(p.partnerId)).sort();
        assert.ok(ids.includes(near.id) && ids.includes(own.id));
        for (const x of [far, farInCity, pending, offline, ofB]) assert.ok(!ids.includes(x.id), 'must not be offered');
        // the same riders the store panel lists as available
        const panel = ok(await fx.call('GET', '/v1/store/delivery/available-riders', A.managerToken)).map((r) => r._id);
        for (const id of ids) assert.ok(panel.includes(id), `dispatch offered ${id} but the panel does not list it`);

        // and the real dispatch records the offer for those riders only
        const inserted = await fx.models.FoodOrder.collection.insertOne({
            order_id: `ND${fx.ts}`, userId: oid(A.customerId), storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderStatus: 'preparing',
            items: [{ itemId: 'x', name: 'Margherita', quantity: 1, price: 100 }], pricing: { subtotal: 100, total: 100 }, deliveryAddress: { street: '1 Test Rd', city: 'Indore', state: 'MP' },
            payment: { method: 'razorpay', status: 'paid' }, dispatch: { status: 'unassigned', offeredTo: [] },
            statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
        });
        const order = { _id: inserted.insertedId };
        assert.ok(await tryAutoAssign(order._id), 'the order was dispatchable');
        const offered = (await fx.models.FoodOrder.findById(order._id).lean()).dispatch.offeredTo.map((o) => String(o.partnerId));
        assert.ok(offered.length > 0);
        assert.ok(!offered.includes(far.id) && !offered.includes(farInCity.id) && !offered.includes(pending.id) && !offered.includes(ofB.id));
    });
    test('each store is offered its own near riders only', async () => {
        const { listNearbyOnlineDeliveryPartners } = await import('../src/modules/food/orders/services/order-dispatch.service.js');
        const idsOf = async (storeId) => (await listNearbyOnlineDeliveryPartners(storeId, { maxKm: 15, limit: 100 })).partners.map((p) => String(p.partnerId));
        const a = await idsOf(A.storeId);
        const b = await idsOf(B.storeId);
        assert.ok(b.length > 0 && a.length > 0);
        assert.deepEqual(a.filter((id) => b.includes(id)), [], 'no rider is offered orders of both Indore and Delhi');
    });
});
