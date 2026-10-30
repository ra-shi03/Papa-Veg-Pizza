// What each panel gets about a rider (docs/rider-flow.md):
//   super admin       GET /food/admin/delivery/:id   -> the full signup record, documents and bank included
//   franchise admin   GET /food/admin/delivery/partners -> riders near / working for its stores; no documents, no bank
//   store manager     GET /store/riders, /store/rider/:id, /store/delivery/available-riders -> riders near the store; no documents, no bank
// The test rider mirrors the dev "DeliveryBoy": approved, offline, no GPS, city "Delhi"; the store's city is saved as
// "North India (Delhi)" (city fallback: the part in brackets matches, case-insensitive, spaces trimmed).
// Store A (franchise A) is in Delhi, store B (franchise B) in Indore.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let staffA;
const R = {};
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const ok = (res) => {
    assert.equal(res.status, 200, JSON.stringify(res.body));
    return res.body.data;
};
const SECRET = {
    aadharNumber: '987698769876', panNumber: 'PQRST6789K', drivingLicenseNumber: 'DL0420190012345',
    aadharPhoto: 'https://img.example/aadhar-card.jpg', panPhoto: 'https://img.example/pan-card.jpg',
    drivingLicensePhoto: 'https://img.example/licence.jpg', profilePhoto: 'https://img.example/selfie.jpg',
    bankAccountHolderName: 'Delivery Boy', bankAccountNumber: '50100012345678', bankIfscCode: 'HDFC0001234', bankName: 'HDFC Bank',
    upiId: 'deliveryboy@upi', upiQrCode: 'https://img.example/upi-qr.png', vehicleNumber: 'DL3SAB1234', email: 'deliveryboy@example.invalid',
};

let seq = 0;
async function rider(key, set) {
    const _id = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('food_delivery_partners').insertOne({
        _id, name: key, phone: `98${String(fx.ts).slice(-6)}${String(++seq).padStart(2, '0')}`, vehicleType: 'bike', status: 'approved',
        availabilityStatus: 'offline', rating: 0, createdAt: new Date(), updatedAt: new Date(), fcmTokens: ['push-token-secret'], ...set,
    });
    R[key] = String(_id);
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    staffA = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: 28.6588803, longitude: 77.1993149, city: 'North India (Delhi)', zoneId: null } });
    await fx.models.FoodStore.updateOne({ _id: B.storeId }, { $set: { latitude: 22.7196, longitude: 75.8577, city: 'Indore', zoneId: null } });
    await rider('DeliveryBoy', { city: 'Delhi', state: 'Delhi', address: 'karol bagh', ...SECRET });
    await rider('PendingDelhi', { status: 'pending', city: '  DELHI  ' });
    await rider('OnlineNear', { availabilityStatus: 'online', lastLocation: point(28.66, 77.21), lastLat: 28.66, lastLng: 77.21, lastLocationAt: new Date() });
    await rider('FarMumbai', { availabilityStatus: 'online', city: 'Mumbai', lastLocation: point(19.076, 72.8777), lastLat: 19.076, lastLng: 72.8777, lastLocationAt: new Date() });
    await rider('NoCityNoGps', {});
});
after(async () => { await fx?.teardown(); });

const leaks = (body) => {
    const text = JSON.stringify(body);
    return [...Object.values(SECRET), 'push-token-secret'].filter((v) => text.includes(v))
        .concat(/aadhar|bankAccount|bankIfsc|panNumber|panPhoto|drivingLicense|upiId|upiQr|fcmToken/i.test(text) ? ['a document / bank field name'] : []);
};

describe('super admin: the full signup record', () => {
    test('GET /food/admin/delivery/:id has contact, address, vehicle, licence, documents and bank; no push tokens', async () => {
        const d = ok(await fx.call('GET', `/v1/food/admin/delivery/${R.DeliveryBoy}`, fx.SA)).delivery;
        assert.deepEqual([d.name, d.email, d.address, d.city, d.vehicleType, d.vehicleNumber, d.drivingLicenseNumber, d.approvalStatus],
            ['DeliveryBoy', SECRET.email, 'karol bagh', 'Delhi', 'bike', SECRET.vehicleNumber, SECRET.drivingLicenseNumber, 'approved']);
        for (const k of ['profilePhoto', 'aadharPhoto', 'panPhoto', 'drivingLicensePhoto']) assert.equal(d[k], SECRET[k], k);
        assert.equal(d.documents.bankDetails.accountNumber, SECRET.bankAccountNumber);
        assert.equal(d.documents.bankDetails.ifscCode, SECRET.bankIfscCode);
        assert.ok(!JSON.stringify(d).includes('push-token-secret'));
        assert.equal((await fx.call('GET', '/v1/food/admin/delivery/not-an-id', fx.SA)).status, 404);
    });
    test('store manager, rider and customer cannot open it; the franchise admin gets the masked verification view (rider-approval.test.js)', async () => {
        const riderToken = fx.tokenFor(oid(R.DeliveryBoy), 'DELIVERY_PARTNER');
        const fa = ok(await fx.call('GET', `/v1/food/admin/delivery/${R.DeliveryBoy}`, A.adminToken)).delivery;
        assert.equal(fa.aadharNumber, 'XXXXXXXX9876');
        assert.ok(!JSON.stringify(fa).includes(SECRET.bankAccountNumber) && !JSON.stringify(fa).includes('push-token-secret'));
        assert.equal((await fx.call('GET', `/v1/food/admin/delivery/${R.DeliveryBoy}`, B.adminToken)).status, 404);
        for (const token of [A.managerToken, riderToken, A.customerToken]) {
            assert.equal((await fx.call('GET', `/v1/food/admin/delivery/${R.DeliveryBoy}`, token)).status, 403);
        }
    });
});

describe('the test rider (Delhi, offline, no GPS) near the Delhi store', () => {
    test('the store manager sees it as offline and the pending Delhi rider as pending; far and location-less riders hidden', async () => {
        const list = ok(await fx.call('GET', '/v1/store/riders', A.managerToken));
        const by = Object.fromEntries(list.map((r) => [r.name, r]));
        assert.deepEqual(Object.keys(by).sort(), ['DeliveryBoy', 'OnlineNear', 'PendingDelhi']);
        assert.deepEqual([by.DeliveryBoy.status, by.DeliveryBoy.area, by.DeliveryBoy.distanceFromStore], ['offline', 'Delhi', null]);
        assert.deepEqual([by.PendingDelhi.status, by.PendingDelhi.currentStatus], ['pending', 'pending']);
        assert.deepEqual(leaks(list), []);
        assert.deepEqual(leaks(ok(await fx.call('GET', `/v1/store/rider/${R.DeliveryBoy}`, A.managerToken))), []);
    });
    test('Assign Rider offers only approved online riders: not the offline test rider, not the pending one', async () => {
        const avail = ok(await fx.call('GET', '/v1/store/delivery/available-riders', A.managerToken));
        assert.deepEqual(avail.map((r) => r.name), ['OnlineNear']);
        assert.deepEqual(leaks(avail), []);
    });
    test('the franchise admin sees it too (offline, and the pending one tagged pending), without documents or bank', async () => {
        const data = ok(await fx.call('GET', '/v1/food/admin/delivery/partners', A.adminToken));
        const by = Object.fromEntries(data.deliveryPartners.map((r) => [r.name, r]));
        assert.deepEqual(Object.keys(by).sort(), ['DeliveryBoy', 'OnlineNear', 'PendingDelhi']);
        assert.deepEqual([by.DeliveryBoy.status, by.DeliveryBoy.availability, by.PendingDelhi.status], ['approved', 'offline', 'pending']);
        assert.match(by.DeliveryBoy.phone, /^98\*+\d{2}$/);
        assert.deepEqual([data.stats.total, data.stats.pending, data.stats.online, data.stats.offline], [3, 1, 1, 1]);
        assert.deepEqual(leaks(data), []);
    });
    test('the other store and franchise (Indore) do not see Delhi riders; the far Mumbai rider is nobody\'s', async () => {
        const storeB = ok(await fx.call('GET', '/v1/store/riders', B.managerToken)).map((r) => r.name);
        const franchiseB = ok(await fx.call('GET', '/v1/food/admin/delivery/partners', B.adminToken)).deliveryPartners.map((r) => r.name);
        for (const list of [storeB, franchiseB]) {
            for (const name of ['DeliveryBoy', 'PendingDelhi', 'OnlineNear', 'FarMumbai', 'NoCityNoGps']) assert.ok(!list.includes(name), name);
        }
    });
    test('rider-roster shows the test rider as Offline and the pending one as Pending approval', async () => {
        const rows = ok(await fx.call('GET', '/v1/store/dashboard/rider-roster', A.managerToken));
        const status = Object.fromEntries(rows.map((r) => [r.name, r.status]));
        assert.deepEqual([status.DeliveryBoy, status.PendingDelhi, status.OnlineNear], ['Offline', 'Pending approval', 'Idle']);
    });
});

describe('scope and roles', () => {
    test('another franchise\'s store is 404; rider and customer tokens are 403 on every rider list', async () => {
        assert.equal((await fx.call('GET', `/v1/food/admin/delivery/partners?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await fx.call('GET', `/v1/store/riders?storeId=${A.storeId}`, B.adminToken)).status, 404);
        const riderToken = fx.tokenFor(oid(R.DeliveryBoy), 'DELIVERY_PARTNER');
        for (const path of ['/v1/food/admin/delivery/partners', '/v1/store/riders', '/v1/store/delivery/available-riders', `/v1/store/rider/${R.DeliveryBoy}`]) {
            for (const token of [riderToken, A.customerToken, staffA]) assert.equal((await fx.call('GET', path, token)).status, 403, path);
        }
    });
});

test('the city fallback: brackets and comma parts, any case, extra spaces', async () => {
    const { areaNames } = await import('../src/modules/food/store/services/nearby.js');
    assert.deepEqual(areaNames('North India (Delhi)'), ['north india (delhi)', 'delhi', 'north india']);
    assert.deepEqual(areaNames('  Indore ,  MP '), ['indore , mp', 'indore']);
    assert.deepEqual(areaNames('  New   Delhi '), ['new delhi']);
    assert.deepEqual(areaNames(''), []);
});
