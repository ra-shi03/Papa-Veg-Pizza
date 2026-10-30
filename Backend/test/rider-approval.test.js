// Delivery partner approval by the franchise admin; the super admin only reads.
//   franchise admin: join requests, verification details, approve, reject, suspend, activate for riders in its scope
//                    (claimed by it, or unclaimed and near one of its stores); anyone else's rider -> 404
//   first claim: the first franchise to approve a pending rider claims it (franchiseId, approvedBy, approvedAt);
//                then only that franchise (and the super admin, read only) sees it, and dispatch keeps it to that franchise
//   super admin: full detail and documents; approve / reject / suspend / activate -> 403
// Store A (franchise A) and store B2 (franchise B) are both in Indore; store B (franchise B) is in Delhi.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let B2; let mgrB2; let staffA;
const R = {};
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const INDORE = { lat: 22.7196, lng: 75.8577 };
const ok = (res, status = 200) => {
    assert.equal(res.status, status, JSON.stringify(res.body));
    return res.body.data;
};
const riders = () => mongoose.connection.collection('food_delivery_partners');
const D = '/v1/food/admin/delivery';
const SECRET = {
    aadharNumber: '123456789012', panNumber: 'ABCDE1234F', drivingLicenseNumber: 'MP0920200009876',
    bankAccountNumber: '50100099998888', bankIfscCode: 'HDFC0009999', bankAccountHolderName: 'Holder Person', upiId: 'rider@upi', upiQrCode: 'https://img.example/qr.png',
    fcmTokens: ['push-token-secret'],
};
const DOCS = { profilePhoto: 'https://img.example/selfie.jpg', aadharPhoto: 'https://img.example/aadhar.jpg', panPhoto: 'https://img.example/pan.jpg', drivingLicensePhoto: 'https://img.example/dl.jpg' };

let seq = 0;
async function rider(key, set) {
    const _id = new mongoose.Types.ObjectId();
    await riders().insertOne({
        _id, name: `Rider ${key}`, phone: `96${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, email: `${key}${fx.ts}@rider.example.invalid`,
        address: '12 MG Road', city: 'Indore', state: 'MP', vehicleType: 'bike', vehicleName: 'Activa', vehicleNumber: `MP09AB${1000 + seq}`,
        status: 'pending', availabilityStatus: 'offline', createdAt: new Date(), updatedAt: new Date(), ...set,
    });
    R[key] = String(_id);
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    staffA = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: INDORE.lat, longitude: INDORE.lng, city: 'Indore', zoneId: null } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 28.6139, longitude: 77.209, city: 'Delhi', zoneId: null } });
    const b2 = await fx.models.FoodStore.collection.insertOne({
        storeName: `B2 Indore ${fx.ts}`, code: `B2${fx.ts}`, phone: '9000000002', address: 'b2', city: 'Indore', state: 'MP', franchiseId: oid(B.franchiseId),
        latitude: INDORE.lat + 0.01, longitude: INDORE.lng, isActive: true, approvalStatus: 'Approved', storeType: 'DELIVERY_CARRYOUT', createdAt: new Date(), updatedAt: new Date(),
    });
    B2 = String(b2.insertedId);
    mgrB2 = fx.claim('STORE_MANAGER', { franchiseId: B.franchiseId, storeId: B2 });

    await rider('near', { ...SECRET, ...DOCS, lastLocation: point(INDORE.lat + 0.005, INDORE.lng), lastLat: INDORE.lat + 0.005, lastLng: INDORE.lng, lastLocationAt: new Date() });
    await rider('cityOnly', { city: ' indore ' });
    await rider('far', { city: 'Mumbai', lastLocation: point(19.076, 72.8777) });
    await rider('shared', { status: 'approved', availabilityStatus: 'online', lastLocation: point(INDORE.lat, INDORE.lng + 0.005), lastLat: INDORE.lat, lastLng: INDORE.lng + 0.005, lastLocationAt: new Date() });
});
after(async () => { await fx?.teardown(); });

const joinIds = async (token) => ok(await fx.call('GET', `${D}/join-requests`, token)).requests.map((r) => String(r._id));
const listIds = async (token) => ok(await fx.call('GET', `${D}/partners`, token)).deliveryPartners.map((r) => String(r._id));

describe('before anyone approves', () => {
    test('a pending rider near stores of two franchises is a join request for both; a far one for neither', async () => {
        for (const token of [A.adminToken, B.adminToken]) {
            const ids = await joinIds(token);
            assert.ok(ids.includes(R.near) && ids.includes(R.cityOnly), 'GPS match and city fallback');
            assert.ok(!ids.includes(R.far));
        }
        assert.ok((await joinIds(fx.SA)).includes(R.far), 'the super admin sees every pending signup');
    });
    test('franchise admin: verification details with masked Aadhaar / PAN / licence numbers, documents, no bank, UPI or push tokens', async () => {
        const d = ok(await fx.call('GET', `${D}/${R.near}`, A.adminToken)).delivery;
        assert.deepEqual([d.name, d.address, d.city, d.vehicleType, d.vehicleName], ['Rider near', '12 MG Road', 'Indore', 'bike', 'Activa']);
        assert.ok(d.phone.startsWith('96') && !d.phone.includes('*'));
        assert.deepEqual([d.aadharNumber, d.panNumber, d.drivingLicenseNumber], ['XXXXXXXX9012', 'XXXXXX234F', 'XXXXXXXXXXX9876']);
        assert.deepEqual([d.profilePhoto, d.aadharPhoto, d.panPhoto, d.drivingLicensePhoto], [DOCS.profilePhoto, DOCS.aadharPhoto, DOCS.panPhoto, DOCS.drivingLicensePhoto]);
        const text = JSON.stringify(d);
        for (const secret of ['123456789012', 'ABCDE1234F', 'MP0920200009876', SECRET.bankAccountNumber, SECRET.bankIfscCode, 'Holder Person', 'rider@upi', 'qr.png', 'push-token-secret']) {
            assert.ok(!text.includes(secret), `leaked ${secret}`);
        }
        assert.ok(!/bank|upi|fcm/i.test(text));
    });
    test('super admin: full detail and documents (bank included), but approve / reject / suspend / activate are 403', async () => {
        const d = ok(await fx.call('GET', `${D}/${R.near}`, fx.SA)).delivery;
        assert.equal(d.aadharPhoto, DOCS.aadharPhoto);
        assert.equal(d.documents.bankDetails.accountNumber, SECRET.bankAccountNumber);
        for (const [path, body] of [['approve', {}], ['reject', { reason: 'x' }], ['suspend', {}], ['activate', {}]]) {
            const res = await fx.call('PATCH', `${D}/${R.near}/${path}`, fx.SA, body);
            assert.equal(res.status, 403, path);
            assert.match(res.body.message || res.body.error, /franchise admin/i);
        }
        assert.equal((await fx.call('PATCH', `${D}/${R.near}`, fx.SA, { status: 'suspended' })).status, 403);
        assert.equal((await riders().findOne({ _id: oid(R.near) })).status, 'pending');
    });
    test('store manager, kitchen staff, rider and customer tokens: 403', async () => {
        const riderToken = fx.tokenFor(oid(R.shared), 'DELIVERY_PARTNER');
        for (const token of [A.managerToken, staffA, riderToken, A.customerToken]) {
            assert.equal((await fx.call('GET', `${D}/join-requests`, token)).status, 403);
            assert.equal((await fx.call('GET', `${D}/${R.near}`, token)).status, 403);
            assert.equal((await fx.call('PATCH', `${D}/${R.near}/approve`, token, {})).status, 403);
        }
    });
});

describe('first claim', () => {
    test('franchise A approves: the rider is claimed by A (franchiseId, approvedBy, approvedAt, history)', async () => {
        const d = ok(await fx.call('PATCH', `${D}/${R.near}/approve`, A.adminToken, {}));
        assert.deepEqual([d.status, d.claimedByYou, d.aadharNumber], ['approved', true, 'XXXXXXXX9012']);
        const row = await riders().findOne({ _id: oid(R.near) });
        assert.equal(row.status, 'approved');
        assert.equal(String(row.franchiseId), A.franchiseId);
        assert.ok(row.approvedBy && row.approvedAt);
        assert.deepEqual(row.approvalHistory.map((h) => [h.action, String(h.franchiseId)]), [['approved', A.franchiseId]]);
    });
    test('approving again is 409; franchise B no longer sees it (join requests, list, detail, approve all 404 / absent)', async () => {
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/approve`, A.adminToken, {})).status, 409);
        assert.ok(!(await joinIds(B.adminToken)).includes(R.near));
        assert.ok(!(await listIds(B.adminToken)).includes(R.near));
        assert.equal((await fx.call('GET', `${D}/${R.near}`, B.adminToken)).status, 404);
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/approve`, B.adminToken, {})).status, 404);
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/suspend`, B.adminToken, {})).status, 404);
        assert.ok((await listIds(A.adminToken)).includes(R.near));
    });
    test('a far rider is 404 for the franchise admin', async () => {
        assert.equal((await fx.call('GET', `${D}/${R.far}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('PATCH', `${D}/${R.far}/approve`, A.adminToken, {})).status, 404);
    });
    test('the super admin detail shows the franchise that claimed it and who approved', async () => {
        const d = ok(await fx.call('GET', `${D}/${R.near}`, fx.SA)).delivery;
        assert.ok(d.franchiseName);
        assert.equal(String(d.franchiseId), A.franchiseId);
        assert.equal(d.approvedByEmail, String(A.email).toLowerCase());
    });
});

describe('reject, suspend, activate', () => {
    test('reject needs a reason; it records rejectedBy, rejectedAt and the reason', async () => {
        assert.equal((await fx.call('PATCH', `${D}/${R.cityOnly}/reject`, A.adminToken, { reason: '  ' })).status, 400);
        ok(await fx.call('PATCH', `${D}/${R.cityOnly}/reject`, A.adminToken, { reason: 'Licence photo is blurry' }));
        const row = await riders().findOne({ _id: oid(R.cityOnly) });
        assert.deepEqual([row.status, row.rejectionReason], ['rejected', 'Licence photo is blurry']);
        assert.ok(row.rejectedBy && row.rejectedAt);
        assert.equal(row.approvalHistory.at(-1).action, 'rejected');
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/reject`, A.adminToken, { reason: 'x' })).status, 409, 'an approved rider is suspended, not rejected');
    });
    test('suspend and activate the claimed rider, with the audit trail; wrong state is 409', async () => {
        ok(await fx.call('PATCH', `${D}/${R.near}/suspend`, A.adminToken, { reason: 'Customer complaints' }));
        let row = await riders().findOne({ _id: oid(R.near) });
        assert.deepEqual([row.status, row.availabilityStatus, row.suspensionReason], ['suspended', 'offline', 'Customer complaints']);
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/suspend`, A.adminToken, {})).status, 409);
        ok(await fx.call('PATCH', `${D}/${R.near}/activate`, A.adminToken, {}));
        row = await riders().findOne({ _id: oid(R.near) });
        assert.equal(row.status, 'approved');
        assert.deepEqual(row.approvalHistory.map((h) => h.action), ['approved', 'suspended', 'activated']);
        assert.equal((await fx.call('PATCH', `${D}/${R.near}/activate`, A.adminToken, {})).status, 409);
    });
});

describe('stores and dispatch keep a claimed rider inside its franchise', () => {
    test('franchise B\'s Indore store does not list A\'s rider; the shared-fleet rider still works for both', async () => {
        await riders().updateOne({ _id: oid(R.near) }, { $set: { availabilityStatus: 'online', lastLocationAt: new Date() } });
        const b2List = ok(await fx.call('GET', '/v1/store/riders', mgrB2)).map((r) => r._id);
        assert.ok(!b2List.includes(R.near));
        assert.ok(b2List.includes(R.shared));
        const aList = ok(await fx.call('GET', '/v1/store/riders', A.managerToken)).map((r) => r._id);
        assert.ok(aList.includes(R.near) && aList.includes(R.shared));
    });
    test('auto-dispatch never offers A\'s rider to franchise B\'s store', async () => {
        const { listNearbyOnlineDeliveryPartners } = await import('../src/modules/food/orders/services/order-dispatch.service.js');
        const offeredTo = async (storeId) => (await listNearbyOnlineDeliveryPartners(storeId, { maxKm: 15, limit: 50 })).partners.map((p) => String(p.partnerId));
        const b2 = await offeredTo(B2);
        assert.ok(!b2.includes(R.near));
        assert.ok(b2.includes(R.shared));
        assert.ok((await offeredTo(A.storeId)).includes(R.near));
    });
});

test('stores made in the franchise panel (region in "city", zone in "state", zone only via the territory) still match riders by city', async () => {
    const { storeArea } = await import('../src/modules/food/store/services/nearby.js');
    const zone = await mongoose.connection.collection('food_zones').insertOne({ name: 'Vijay Nagar', zoneName: 'Vijay Nagar', regionId: new mongoose.Types.ObjectId(), country: 'India', isActive: true,
        coordinates: [{ latitude: 22.70, longitude: 75.83 }, { latitude: 22.70, longitude: 75.89 }, { latitude: 22.74, longitude: 75.89 }] });
    const territory = await mongoose.connection.collection('food_territories').insertOne({ name: 'Palasia', zoneId: zone.insertedId, createdAt: new Date() });
    const st = await fx.models.FoodStore.collection.insertOne({
        storeName: `Panel store ${fx.ts}`, code: `PS${fx.ts}`, phone: '9000000003', address: 'x', city: 'Central Region (Madhya Pradesh)', state: 'Indore',
        territoryId: territory.insertedId, franchiseId: oid(A.franchiseId), isActive: true, approvalStatus: 'Approved', createdAt: new Date(), updatedAt: new Date(),
    });
    const area = await storeArea(st.insertedId);
    for (const label of ['indore', 'vijay nagar', 'madhya pradesh']) assert.ok(area.labels.includes(label), label);
    assert.ok(area.polygon, 'the territory\'s zone polygon is used when the store has no coordinates');
});
