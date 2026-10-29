// Riders and customers near a store, in that store's panel (/v1/store/riders, /delivery/available-riders,
// /store/dashboard/rider-roster, /v1/food/store/customers/*). The rule is store/services/nearby.js:
//   saved coordinates within NEARBY_RADIUS_KM (default 10) of the store; without coordinates, the same zone (name /
//   service location) or city; neither -> hidden. Riders of other stores or franchises never show (audit4 N-L1).
//
// Store A is in Indore (zone "Vijay Nagar"), store B in Delhi, different franchises.
// Riders (shared fleet unless noted):
//   near     approved, online, 2 km from A, with documents and bank details on the record
//   pending  pending approval, 3 km from A
//   zoned    approved, offline, no coordinates, city = A's zone name
//   city     approved, online, no coordinates, city = A's city (different case, spaces)
//   nowhere  approved, online, no coordinates, no city
//   delhi    approved, online, 1 km from B
//   far15    approved, online, 15 km from A (outside 10 km, inside 20 km)
//   ofB      belongs to store B but is 1 km from A
// Customers: cNear (address 3 km from A), cZone (no coordinates, city = A's zone), cNowhere (no coordinates, another
// city), cDelhi (address near B); and B's fixture customer, who ordered at B, saves an address near A.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
let supA; let staffA;
const R = {};
const C = {};
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const A_AT = { lat: 22.7196, lng: 75.8577 };
const B_AT = { lat: 28.6139, lng: 77.209 };
const point = (at, dLat = 0) => ({ type: 'Point', coordinates: [at.lng, at.lat + dLat] });  // 0.009 deg lat ~ 1 km
const ok = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};

let seq = 0;
async function rider(key, set) {
    const _id = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('food_delivery_partners').insertOne({
        _id, name: `Rider ${key}`, phone: `93${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, vehicleType: 'Bike', vehicleNumber: `MP09-${seq}`,
        status: 'approved', availabilityStatus: 'online', rating: 4, createdAt: new Date(), updatedAt: new Date(), ...set,
    });
    R[key] = String(_id);
}
async function customer(key, address, extra = {}) {
    const u = await fx.models.User.create({
        mobile: `94${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, email: `${key.toLowerCase()}${fx.ts}@example.invalid`,
        loginType: 'OTP', primaryRole: fx.roles.CUSTOMER._id, isActive: true,
        addresses: [{ label: 'Home', street: '1 Main Rd', state: 'MP', isDefault: true, recipientName: `Customer ${key}`, ...address }], ...extra,
    });
    C[key] = { id: String(u._id), mobile: u.mobile, email: u.email };
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    supA = fx.claim('KITCHEN_SUPERVISOR', { franchiseId: A.franchiseId, storeId: A.storeId });
    staffA = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    const zone = await mongoose.connection.collection('food_zones').insertOne({
        name: 'Vijay Nagar', zoneName: 'Vijay Nagar', serviceLocation: 'Vijay Nagar', regionId: new mongoose.Types.ObjectId(), country: 'India', isActive: true,
        coordinates: [{ latitude: 22.70, longitude: 75.83 }, { latitude: 22.70, longitude: 75.89 }, { latitude: 22.74, longitude: 75.89 }, { latitude: 22.74, longitude: 75.83 }],
    });
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: A_AT.lat, longitude: A_AT.lng, city: 'Indore', zoneId: zone.insertedId } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: B_AT.lat, longitude: B_AT.lng, city: 'Delhi', zoneId: null } });

    await rider('near', {
        lastLocation: point(A_AT, 0.018), lastLocationAt: new Date(), city: 'Indore',
        aadharNumber: '123412341234', panNumber: 'ABCDE1234F', drivingLicenseNumber: 'MP0920200000001', aadharPhoto: 'https://x/aadhar.jpg',
        panPhoto: 'https://x/pan.jpg', drivingLicensePhoto: 'https://x/dl.jpg', bankAccountNumber: '000111222333', bankIfscCode: 'SBIN0000001', upiId: 'near@upi',
    });
    await rider('pending', { status: 'pending', lastLocation: point(A_AT, 0.027) });
    await rider('zoned', { availabilityStatus: 'offline', city: 'Vijay Nagar' });
    await rider('city', { city: ' indore ' });
    await rider('nowhere', {});
    await rider('delhi', { lastLocation: point(B_AT, 0.009), city: 'Delhi' });
    await rider('far15', { lastLocation: point(A_AT, 0.135) });
    await rider('ofB', { storeId: oid(B.storeId), franchiseId: oid(B.franchiseId), lastLocation: point(A_AT, 0.009) });

    await customer('Near', { city: 'Indore', location: point(A_AT, 0.027) });
    await customer('Zone', { city: 'Vijay Nagar' });
    await customer('Nowhere', { city: 'Bhopal' });
    await customer('Delhi', { city: 'Delhi', location: point(B_AT, 0.009) });
    await fx.models.User.updateOne({ _id: B.customerId }, { $set: { addresses: [{ label: 'Home', street: '2 Main Rd', city: 'Indore', state: 'MP', location: point(A_AT, 0.009) }] } });
});
after(async () => {
    delete process.env.NEARBY_RADIUS_KM;
    await fx?.teardown();
});

const riders = (token, qs = '') => fx.call('GET', `/v1/store/riders${qs}`, token);
const names = (list) => list.map((r) => r.name).sort();
const custs = async (token, qs = '') => ok(await fx.call('GET', `/v1/food/store/customers/orders?limit=100${qs}`, token)).customers;

describe('riders near the store', () => {
    test('a store sees riders near it (distance, zone, city); not far ones, not ones without a location, not other stores\' riders', async () => {
        assert.deepEqual(names(ok(await riders(A.managerToken))), ['Rider city', 'Rider near', 'Rider pending', 'Rider zoned']);
        assert.deepEqual(names(ok(await riders(B.managerToken))), ['Rider delhi', 'Rider ofB']);
    });
    test('coordinates in the request never change who is near', async () => {
        const qs = `?lat=${A_AT.lat}&lng=${A_AT.lng}&latitude=${A_AT.lat}&longitude=${A_AT.lng}&radius=500`;
        assert.deepEqual(names(ok(await riders(B.managerToken, qs))), ['Rider delhi', 'Rider ofB']);
    });
    test('status: pending, online, offline; area, last seen, distance', async () => {
        const by = Object.fromEntries(ok(await riders(A.managerToken)).map((r) => [r.name, r]));
        assert.deepEqual([by['Rider near'].status, by['Rider near'].approvalStatus, by['Rider near'].availability], ['online', 'approved', 'online']);
        assert.deepEqual([by['Rider pending'].status, by['Rider pending'].approvalStatus, by['Rider pending'].currentStatus], ['pending', 'pending', 'pending']);
        assert.equal(by['Rider zoned'].status, 'offline');
        assert.equal(by['Rider zoned'].area, 'Vijay Nagar');
        assert.ok(by['Rider near'].distanceFromStore > 1.5 && by['Rider near'].distanceFromStore < 2.5);
        assert.equal(by['Rider zoned'].distanceFromStore, null);
        assert.ok(by['Rider near'].lastSeen);
    });
    test('the store gets a masked phone and never documents, bank details, Aadhaar or the vehicle number', async () => {
        const list = ok(await riders(A.managerToken));
        const detail = ok(await fx.call('GET', `/v1/store/rider/${R.near}`, A.managerToken));
        const avail = ok(await fx.call('GET', '/v1/store/delivery/available-riders', A.managerToken));
        const near = await mongoose.connection.collection('food_delivery_partners').findOne({ _id: oid(R.near) });
        for (const body of [list, detail, avail]) {
            const text = JSON.stringify(body);
            for (const secret of [near.phone, '123412341234', 'ABCDE1234F', 'MP0920200000001', 'aadhar.jpg', 'pan.jpg', 'dl.jpg', '000111222333', 'SBIN0000001', 'near@upi', 'MP09-']) {
                assert.ok(!text.includes(secret), `leaked ${secret}`);
            }
            assert.ok(!/aadhar|bank|pan(Number|Photo)|drivingLicense|upi|password/i.test(text));
        }
        assert.match(detail.mobile, /^93\*+\d{2}$/);
        for (const role of [supA, A.adminToken, fx.SA]) {
            const qs = role === supA ? '' : `?storeId=${A.storeId}`;
            assert.match(ok(await riders(role, qs)).find((r) => r.name === 'Rider near').mobile, /^93\*+\d{2}$/);
        }
    });
    test('available riders: approved, online and near only (pending riders cannot be assigned)', async () => {
        assert.deepEqual(names(ok(await fx.call('GET', '/v1/store/delivery/available-riders', A.managerToken))), ['Rider city', 'Rider near']);
        assert.equal((await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: A.orderId, riderId: R.pending })).status, 404);
        assert.equal((await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: A.orderId, riderId: R.delhi })).status, 404);
        assert.equal((await fx.call('GET', `/v1/store/rider/${R.delhi}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/store/rider/${R.ofB}`, A.managerToken)).status, 404);
    });
    test('rider-roster and the delivery card: near riders only, pending and offline marked (N-L1)', async () => {
        const rows = ok(await fx.call('GET', '/v1/store/dashboard/rider-roster', A.managerToken));
        const status = Object.fromEntries(rows.map((r) => [r.name, r.status]));
        assert.deepEqual(Object.keys(status).sort(), ['Rider city', 'Rider near', 'Rider pending', 'Rider zoned']);
        assert.deepEqual([status['Rider near'], status['Rider pending'], status['Rider zoned']], ['Idle', 'Pending approval', 'Offline']);
        assert.equal(rows.find((r) => r.name === 'Rider zoned').location, 'Vijay Nagar');
        const card = ok(await fx.call('GET', '/v1/store/dashboard/delivery-overview', A.managerToken));
        assert.equal(card.availableRiders, 2);
    });
    test('NEARBY_RADIUS_KM is respected', async () => {
        process.env.NEARBY_RADIUS_KM = '20';
        try {
            assert.ok(names(ok(await riders(A.managerToken))).includes('Rider far15'));
        } finally {
            delete process.env.NEARBY_RADIUS_KM;
        }
        process.env.NEARBY_RADIUS_KM = '1';
        try {
            assert.ok(!names(ok(await riders(A.managerToken))).includes('Rider near'), '2 km is outside 1 km');
        } finally {
            delete process.env.NEARBY_RADIUS_KM;
        }
        assert.ok(!names(ok(await riders(A.managerToken))).includes('Rider far15'));
    });
});

describe('customers near the store', () => {
    test('customers near a store show before their first order, tagged; far ones and ones without a location do not', async () => {
        const a = await custs(A.managerToken);
        const ids = a.map((c) => c._id);
        for (const k of ['Near', 'Zone']) assert.ok(ids.includes(C[k].id), k);
        for (const k of ['Nowhere', 'Delhi']) assert.ok(!ids.includes(C[k].id), k);
        const near = a.find((c) => c._id === C.Near.id);
        assert.deepEqual([near.name, near.tag, near.totalOrders, near.totalSpent, near.recentOrder], ['Customer Near', 'new', 0, 0, null]);
        const b = (await custs(B.managerToken)).map((c) => c._id);
        assert.ok(b.includes(C.Delhi.id));
        assert.ok(!b.includes(C.Near.id) && !b.includes(C.Zone.id));
    });
    test('order history stays per store: B\'s customer living near A shows at A with no orders', async () => {
        const atA = (await custs(A.managerToken)).find((c) => c._id === B.customerId);
        assert.deepEqual([atA.totalOrders, atA.recentOrder, atA.tag], [0, null, 'new']);
        const profile = ok(await fx.call('GET', `/v1/food/store/customers/${B.customerId}`, A.managerToken));
        assert.deepEqual(profile.recentOrders, []);
        const atB = (await custs(B.managerToken)).find((c) => c._id === B.customerId);
        assert.equal(atB.totalOrders, 1);
    });
    test('profile of a nearby customer; another store gets 404', async () => {
        const p = ok(await fx.call('GET', `/v1/food/store/customers/${C.Near.id}`, A.managerToken));
        assert.equal(p.customerProfile.name, 'Customer Near');
        assert.deepEqual(p.recentOrders, []);
        assert.equal((await fx.call('GET', `/v1/food/store/customers/${C.Near.id}`, B.managerToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/food/store/customers/${C.Nowhere.id}`, A.managerToken)).status, 404);
    });
    test('masking: manager full phone, masked email; supervisor and franchise admin both masked; super admin full phone', async () => {
        const of = async (token, qs = '') => (await custs(token, qs)).find((c) => c._id === C.Near.id);
        const mgr = await of(A.managerToken);
        assert.deepEqual([mgr.mobile, mgr.email], [C.Near.mobile, `n***@example.invalid`]);
        const sup = await of(supA);
        assert.match(sup.mobile, /^94\*+\d{2}$/);
        assert.equal(sup.email, 'n***@example.invalid');
        const fa = await of(A.adminToken, `&storeId=${A.storeId}`);
        assert.match(fa.mobile, /^94\*+\d{2}$/);
        const sa = await of(fx.SA, `&storeId=${A.storeId}`);
        assert.deepEqual([sa.mobile, sa.email], [C.Near.mobile, 'n***@example.invalid']);
        const profile = ok(await fx.call('GET', `/v1/food/store/customers/${C.Near.id}`, supA));
        assert.match(profile.customerProfile.mobile, /^94\*+\d{2}$/);
    });
});

test('the fields the nearby rule queries have 2dsphere indexes', async () => {
    await fx.models.User.init();
    await mongoose.model('FoodDeliveryPartner').init();
    const geo = async (coll) => (await mongoose.connection.collection(coll).indexes()).filter((i) => Object.values(i.key).includes('2dsphere')).map((i) => Object.keys(i.key)[0]);
    assert.ok((await geo('users')).includes('addresses.location'));
    assert.ok((await geo('food_delivery_partners')).includes('lastLocation'));
});

describe('role and scope from the token', () => {
    const paths = ['/v1/store/riders', '/v1/store/delivery/available-riders', '/v1/store/dashboard/rider-roster', '/v1/food/store/customers/orders'];
    test('rider, customer and kitchen staff tokens: 403; no token: 401', async () => {
        const rider = fx.tokenFor(oid(R.near), 'DELIVERY_PARTNER');
        for (const path of paths) {
            assert.equal((await fx.call('GET', path)).status, 401, path);
            for (const token of [rider, A.customerToken, staffA]) assert.equal((await fx.call('GET', `${path}?storeId=${A.storeId}`, token)).status, 403, path);
        }
    });
    test('franchise admin: own franchise\'s store via ?storeId=, another franchise 404, read only', async () => {
        for (const path of paths) {
            assert.equal((await fx.call('GET', `${path}?storeId=${A.storeId}`, A.adminToken)).status, 200, path);
            assert.equal((await fx.call('GET', `${path}?storeId=${A.storeId}`, B.adminToken)).status, 404, path);
        }
        assert.equal((await fx.call('GET', `/v1/food/store/customers/${C.Near.id}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await fx.call('GET', `/v1/food/store/customers/${C.Near.id}?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await fx.call('POST', `/v1/store/delivery/assign?storeId=${A.storeId}`, A.adminToken, { orderId: A.orderId, riderId: R.near })).status, 403);
    });
    test('super admin: any store; store manager: own store only (another store\'s id is 404)', async () => {
        assert.deepEqual(names(ok(await riders(fx.SA, `?storeId=${B.storeId}`))), ['Rider delhi', 'Rider ofB']);
        assert.equal((await fx.call('GET', `/v1/food/store/customers/orders?storeId=${B.storeId}`, A.managerToken)).status, 404);
        assert.deepEqual(names(ok(await riders(A.managerToken, `?storeId=${B.storeId}`))), ['Rider city', 'Rider near', 'Rider pending', 'Rider zoned']);
    });
});
