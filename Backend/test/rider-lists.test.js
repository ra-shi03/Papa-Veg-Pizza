// Rider lists for the admin panels: GET /v1/food/admin/delivery/partners.
//   super admin      -> every rider (approved by default, ?status=approved,suspended,pending), can approve / reject
//   franchise admin  -> only riders near, or working for, its own stores; masked phone, no documents / bank / email;
//                       read only (approve, reject, edit are 403); another franchise's ?storeId= is 404
//   store manager, kitchen staff, rider, customer -> 403
// Store A (franchise A) is in Indore, store B (franchise B) in Delhi. See nearby-people.test.js for the nearby rule.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let staffA;
const R = {};
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const A_AT = { lat: 22.7196, lng: 75.8577 };
const B_AT = { lat: 28.6139, lng: 77.209 };
const ok = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const URL = '/v1/food/admin/delivery/partners';
const names = (data) => data.deliveryPartners.map((r) => r.name).sort();

let seq = 0;
async function rider(key, set) {
    const _id = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('food_delivery_partners').insertOne({
        _id, name: `Rider ${key}`, phone: `97${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, email: `${key}${fx.ts}@rider.example.invalid`,
        vehicleType: 'Bike', vehicleNumber: `MP09-${seq}`, status: 'approved', availabilityStatus: 'online', rating: 4.5,
        createdAt: new Date(), updatedAt: new Date(), lastLocationAt: new Date(), ...set,
    });
    R[key] = String(_id);
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    staffA = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: A_AT.lat, longitude: A_AT.lng, city: 'Indore', zoneId: null } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: B_AT.lat, longitude: B_AT.lng, city: 'Delhi', zoneId: null } });
    await rider('nearA', {
        lastLocation: point(A_AT.lat + 0.01, A_AT.lng), city: 'Indore',
        aadharNumber: '123412341234', panNumber: 'ABCDE1234F', drivingLicenseNumber: 'MP0920200000001', aadharPhoto: 'https://x/aadhar.jpg',
        panPhoto: 'https://x/pan.jpg', drivingLicensePhoto: 'https://x/dl.jpg', profilePhoto: 'https://x/me.jpg',
        bankAccountNumber: '000111222333', bankIfscCode: 'SBIN0000001', bankAccountHolderName: 'Holder Name', upiId: 'nearA@upi',
    });
    await rider('pendingA', { status: 'pending', availabilityStatus: 'offline', lastLocation: point(A_AT.lat + 0.02, A_AT.lng) });
    await rider('ownA', { storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), availabilityStatus: 'offline' });
    await rider('nearB', { lastLocation: point(B_AT.lat + 0.01, B_AT.lng), city: 'Delhi' });
    await rider('ownB', { storeId: oid(B.storeId), franchiseId: oid(B.franchiseId) });
    await rider('nowhere', {});
    await rider('suspendedA', { status: 'suspended', lastLocation: point(A_AT.lat, A_AT.lng + 0.01) });
    // a rider far from both stores (Mumbai) who delivers A's order
    await rider('worksA', { lastLocation: point(19.076, 72.8777) });
    await fx.models.FoodOrder.collection.insertOne({
        order_id: `RL${fx.ts}`, userId: oid(A.customerId), storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderStatus: 'delivered',
        dispatch: { status: 'accepted', deliveryPartnerId: oid(R.worksA) }, pricing: { total: 100 }, items: [], createdAt: new Date(), updatedAt: new Date(),
    });
});
after(async () => { await fx?.teardown(); });

describe('franchise admin', () => {
    test('sees only riders near or working for its own stores', async () => {
        const a = ok(await fx.call('GET', URL, A.adminToken));
        assert.deepEqual(names(a), ['Rider nearA', 'Rider ownA', 'Rider pendingA', 'Rider worksA']);
        const b = ok(await fx.call('GET', URL, B.adminToken));
        assert.deepEqual(names(b), ['Rider nearB', 'Rider ownB']);
        assert.ok(!JSON.stringify(a).includes('Rider nearB') && !JSON.stringify(b).includes('Rider nearA'));
    });
    test('the screen\'s fields: masked phone, vehicle type, area, status, rating, last seen, stats and its own stores', async () => {
        const a = ok(await fx.call('GET', URL, A.adminToken));
        const by = Object.fromEntries(a.deliveryPartners.map((r) => [r.name, r]));
        const near = by['Rider nearA'];
        assert.match(near.phone, /^97\*+\d{2}$/);
        assert.deepEqual([near.vehicleType, near.zone, near.status, near.availability, near.rating], ['Bike', 'Indore', 'approved', 'online', 4.5]);
        assert.ok(near.lastSeen && near.deliveryId.startsWith('DP-'));
        assert.equal(by['Rider pendingA'].status, 'pending');
        assert.equal(by['Rider worksA'].totalOrders, 1);
        assert.deepEqual(near.storeNames, [(await fx.models.FoodStore.findById(A.storeId).lean()).storeName]);
        assert.deepEqual(a.stats, { total: 4, pending: 1, approved: 3, suspended: 0, online: 2, offline: 1, busy: 0 });
        assert.deepEqual(a.stores.map((s) => String(s._id)), [A.storeId]);
        assert.equal(a.pagination.total, 4);
    });
    test('never documents, bank details, Aadhaar, PAN, email, photo or the full phone', async () => {
        const a = ok(await fx.call('GET', URL, A.adminToken));
        const text = JSON.stringify(a);
        const row = await mongoose.connection.collection('food_delivery_partners').findOne({ _id: oid(R.nearA) });
        for (const secret of [row.phone, row.email, '123412341234', 'ABCDE1234F', 'MP0920200000001', 'aadhar.jpg', 'pan.jpg', 'dl.jpg', 'me.jpg', '000111222333', 'SBIN0000001', 'Holder Name', 'nearA@upi', 'MP09-']) {
            assert.ok(!text.includes(secret), `leaked ${secret}`);
        }
        assert.ok(!/aadhar|bank|pan(Number|Photo)|drivingLicense|upi|password|email|profilePhoto|vehicleNumber/i.test(text));
    });
    test('?storeId=: its own store narrows the list; another franchise\'s store is 404', async () => {
        const own = ok(await fx.call('GET', `${URL}?storeId=${A.storeId}`, A.adminToken));
        assert.equal(own.deliveryPartners.length, 4);
        assert.equal((await fx.call('GET', `${URL}?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `${URL}?storeId=not-an-id`, A.adminToken)).status, 404);
    });
    test('NEARBY_RADIUS_KM is respected', async () => {
        process.env.NEARBY_RADIUS_KM = '0.5';
        try {
            assert.ok(!names(ok(await fx.call('GET', URL, A.adminToken))).includes('Rider nearA'), '1 km is outside 0.5 km');
        } finally {
            delete process.env.NEARBY_RADIUS_KM;
        }
    });
    test('read only: approve, reject and edit are 403, and change nothing', async () => {
        for (const [method, path, body] of [['PATCH', `/v1/food/admin/delivery/${R.pendingA}/approve`, {}], ['PATCH', `/v1/food/admin/delivery/${R.pendingA}/reject`, { reason: 'x' }], ['PATCH', `/v1/food/admin/delivery/${R.pendingA}`, { name: 'Hacked' }]]) {
            assert.equal((await fx.call(method, path, A.adminToken, body)).status, 403, `${method} ${path}`);
        }
        assert.equal((await fx.call('GET', '/v1/food/admin/delivery/join-requests', A.adminToken)).status, 403);
        const row = await mongoose.connection.collection('food_delivery_partners').findOne({ _id: oid(R.pendingA) });
        assert.deepEqual([row.status, row.name], ['pending', 'Rider pendingA']);
    });
});

describe('super admin', () => {
    test('sees every approved rider with the new fields; ?status= widens the list', async () => {
        const all = ok(await fx.call('GET', URL, fx.SA));
        assert.deepEqual(names(all).filter((n) => /^Rider (nearA|nearB|ownA|ownB|nowhere|worksA)$/.test(n)), ['Rider nearA', 'Rider nearB', 'Rider nowhere', 'Rider ownA', 'Rider ownB', 'Rider worksA']);
        assert.ok(!names(all).includes('Rider pendingA') && !names(all).includes('Rider suspendedA'));
        const near = all.deliveryPartners.find((r) => r.name === 'Rider nearA');
        assert.deepEqual([near.availability, near.rating, near.activeOrders, near.phone.includes('*')], ['online', 4.5, 0, false]);
        assert.ok(near.lastSeen);
        const wide = ok(await fx.call('GET', `${URL}?status=approved,suspended`, fx.SA));
        assert.ok(names(wide).includes('Rider suspendedA') && !names(wide).includes('Rider pendingA'));
        const own = wide.deliveryPartners.find((r) => r.name === 'Rider ownA');
        assert.deepEqual([String(own.storeId), String(own.franchiseId)], [A.storeId, A.franchiseId]);
    });
    test('pending signups are in join-requests, and can be approved (then they appear in the list) or rejected', async () => {
        const pending = ok(await fx.call('GET', '/v1/food/admin/delivery/join-requests?status=pending', fx.SA)).requests;
        assert.ok(pending.some((r) => r._id === R.pendingA));
        assert.equal((await fx.call('PATCH', `/v1/food/admin/delivery/${R.pendingA}/approve`, fx.SA, {})).status, 200);
        assert.equal((await mongoose.connection.collection('food_delivery_partners').findOne({ _id: oid(R.pendingA) })).status, 'approved');
        assert.ok(names(ok(await fx.call('GET', URL, fx.SA))).includes('Rider pendingA'));
        await rider('toReject', { status: 'pending' });
        assert.equal((await fx.call('PATCH', `/v1/food/admin/delivery/${R.toReject}/reject`, fx.SA, { reason: 'Blurry documents' })).status, 200);
        const row = await mongoose.connection.collection('food_delivery_partners').findOne({ _id: oid(R.toReject) });
        assert.deepEqual([row.status, row.rejectionReason], ['rejected', 'Blurry documents']);
    });
});

describe('other roles', () => {
    test('store manager, kitchen staff, rider and customer tokens: 403; no token: 401', async () => {
        assert.equal((await fx.call('GET', URL)).status, 401);
        const riderToken = fx.tokenFor(oid(R.nearA), 'DELIVERY_PARTNER');
        for (const token of [A.managerToken, staffA, riderToken, A.customerToken]) assert.equal((await fx.call('GET', URL, token)).status, 403);
    });
});
