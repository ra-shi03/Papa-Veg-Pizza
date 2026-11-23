// 1. Rider search radius (super admin > Fees & Charges): saved with the fee settings, validated, and it decides which
//    riders count as near a store (order offers and the store's rider list); not set = 10 km.
// 2. A rider hears about a reply to (or a status change of) their support ticket: an entry in the delivery app's
//    Notifications that opens the ticket, from the store manager, the franchise admin or the super admin desk.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PAYOUT } from './helpers/fixture.js';

let fx; let A; let farId;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const point = (lat, lng) => ({ type: 'Point', coordinates: [lng, lat] });
const A_AT = { lat: 22.7196, lng: 75.8577 };
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const FEES = '/v1/food/admin/fee-settings';

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    await fx.models.FoodStore.updateOne({ _id: A.storeId }, { $set: { latitude: A_AT.lat, longitude: A_AT.lng, city: 'Indore', zoneId: null } });
    // an approved, online rider about 15 km north of store A (0.135 degrees of latitude)
    farId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('food_delivery_partners').insertOne({ ...PAYOUT,
        _id: farId, name: 'Rider Fifteen', phone: `96${String(fx.ts).slice(-8)}`, vehicleType: 'bike', status: 'approved', availabilityStatus: 'online',
        lastLocation: point(A_AT.lat + 0.135, A_AT.lng), lastLocationAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    });
});
after(async () => { await fx?.teardown(); });

describe('rider search radius', () => {
    const riderIsNear = async () => {
        const { riderScope } = await import('../src/modules/food/store/services/storeDelivery.service.js');
        const store = await fx.models.FoodStore.findById(A.storeId).lean();
        const { filter } = await riderScope(store, { approvedOnly: true });
        return Boolean(await mongoose.model('FoodDeliveryPartner').findOne({ ...filter, _id: farId }).select('_id').lean());
    };

    test('not set: 10 km, so a rider 15 km away is not near the store', async () => {
        const { riderSearchRadiusKm } = await import('../src/modules/food/store/services/nearby.js');
        assert.equal(await riderSearchRadiusKm(), 10);
        assert.equal(await riderIsNear(), false);
    });
    test('the super admin sets 20 km on Fees & Charges: the same rider is near, and the value reads back', async () => {
        ok(await fx.call('PUT', FEES, fx.SA, { riderSearchRadiusKm: 20 }));
        assert.equal(ok(await fx.call('GET', FEES, fx.SA)).feeSettings.riderSearchRadiusKm, 20);
        assert.equal(await riderIsNear(), true);
    });
    test('out of range values are refused; clearing it goes back to 10 km', async () => {
        for (const bad of [0, 500, 'far']) assert.equal((await fx.call('PUT', FEES, fx.SA, { riderSearchRadiusKm: bad })).status, 400, String(bad));
        ok(await fx.call('PUT', FEES, fx.SA, { riderSearchRadiusKm: null }));
        assert.equal(await riderIsNear(), false);
    });
    test('only the super admin can change it', async () => {
        for (const token of [A.adminToken, A.managerToken, A.customerToken]) {
            assert.equal((await fx.call('PUT', FEES, token, { riderSearchRadiusKm: 50 })).status, 403);
        }
    });
});

describe('rider hears about ticket replies', () => {
    const T = '/v1/food/delivery/support-tickets';
    const inbox = async (token) => ok(await fx.call('GET', '/v1/food/notifications/inbox?limit=50', token)).items;

    test('store manager reply, franchise admin close and super admin reply each reach the rider, linking to the ticket', async () => {
        const mine = await fx.partner('approved', { storeId: oid(A.storeId), franchiseId: oid(A.franchiseId) });
        const id = ok(await fx.call('POST', T, mine.token, { subject: 'Customer not reachable', description: 'Called 3 times, phone switched off.', category: 'order' }), 201)._id;
        assert.equal((await inbox(mine.token)).length, 0);

        ok(await fx.call('PATCH', `/v1/food/store/rider-tickets/${id}`, A.managerToken, { adminResponse: 'Please wait 5 minutes, we are calling.' }));
        let items = await inbox(mine.token);
        assert.equal(items.length, 1);
        assert.match(items[0].title, /^Store replied to your ticket/);
        assert.equal(items[0].message, 'Please wait 5 minutes, we are calling.');
        assert.equal(items[0].link, `/food/delivery/help/tickets/${id}`);
        assert.equal(items[0].category, 'support_ticket');

        ok(await fx.call('PATCH', `/v1/food/admin/delivery/rider-tickets/${id}`, A.adminToken, { status: 'closed' }));
        items = await inbox(mine.token);
        assert.ok(items.some((n) => /is closed$/.test(n.title) && /Franchise marked it closed/.test(n.message)), JSON.stringify(items));

        ok(await fx.call('PATCH', `/v1/food/admin/delivery/support-tickets/${id}`, fx.SA, { adminResponse: 'Refund of the trip added.' }));
        items = await inbox(mine.token);
        assert.ok(items.some((n) => /^Support replied/.test(n.title) && n.message === 'Refund of the trip added.'), JSON.stringify(items));
    });
    test('another rider hears nothing', async () => {
        const other = await fx.partner();
        assert.equal((await inbox(other.token)).length, 0);
    });
});
