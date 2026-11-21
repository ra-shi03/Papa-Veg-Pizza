// What the rider records on the way (bill photo at the store, handover photo at the door) reaches the store, the
// franchise admin and the super admin, and the store cannot hand an order to a rider who has not uploaded the bill photo.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let rider; let pizza; let id;
const BILL = 'https://img.test/bill.jpg';
const PROOF = 'https://img.test/door.jpg';
const R = (p) => `/v1/food/delivery/orders/${p}`;
const ok = (res) => { assert.equal(res.status, 200, JSON.stringify(res.body)); return res.body.data; };

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], price: 200 });
    rider = await fx.partner();
    await mongoose.connection.collection('food_delivery_partners').updateOne({ _id: new mongoose.Types.ObjectId(rider.id) }, { $set: { storeId: new mongoose.Types.ObjectId(A.storeId), franchiseId: new mongoose.Types.ObjectId(A.franchiseId) } });
    const placed = await fx.call('POST', '/v1/food/orders', A.customerToken, {
        items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
        address: { street: '1 Test Street', city: 'Indore', state: 'MP' }, storeId: A.storeId, paymentMethod: 'cash',
    });
    id = String(placed.body.data.order._id);
    ok(await fx.call('PATCH', `/v1/food/store/orders/${id}/accept`, A.managerToken, { estimatedPreparationTime: 15 }));
    for (const s of ['preparing', 'baking', 'packaging', 'ready']) ok(await fx.call('PATCH', `/v1/food/store/orders/${id}/stage`, A.managerToken, { stage: s }));
    ok(await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: id, riderId: rider.id }));
    ok(await fx.call('PATCH', R(`${id}/accept`), rider.token, {}));
    ok(await fx.call('PATCH', R(`${id}/reached-pickup`), rider.token, {}));
});
after(async () => { await fx?.teardown(); });

const storeView = async (token = A.managerToken) => (await fx.call('GET', `/v1/food/store/orders/${id}`, token)).body.data;

describe('bill photo before the store hands the order over', () => {
    test('the store cannot confirm the pickup until the rider has uploaded the bill photo', async () => {
        const res = await fx.call('PATCH', `/v1/store/orders/${id}/pickup`, A.managerToken, {});
        assert.equal(res.status, 400);
        assert.match(res.body.message || res.body.error, /bill photo/i);
        assert.notEqual((await fx.models.FoodOrder.findById(id).lean()).orderStatus, 'picked_up');
    });
    test('the rider saves it (own order only, a real link only); the store sees it', async () => {
        const other = await fx.partner();
        assert.equal((await fx.call('PATCH', R(`${id}/bill-photo`), other.token, { billImageUrl: BILL })).status, 403);
        assert.equal((await fx.call('PATCH', R(`${id}/bill-photo`), rider.token, { billImageUrl: 'nope' })).status, 400);
        assert.equal((await fx.call('PATCH', R(`${id}/bill-photo`), rider.token, { billImageUrl: BILL })).status, 200);
        const v = await storeView();
        assert.equal(v.delivery.billImageUrl, BILL);
        assert.equal(v.delivery.handoverPhotoUrl, '');
    });
    test('now the store hands it over; the order records who confirmed the pickup', async () => {
        ok(await fx.call('PATCH', `/v1/store/orders/${id}/pickup`, A.managerToken, {}));
        const row = await fx.models.FoodOrder.findById(id).lean();
        assert.equal(row.orderStatus, 'picked_up');
        assert.equal(row.deliveryState.pickupConfirmedBy, 'store');
        assert.equal(row.deliveryState.billImageUrl, BILL);
    });
    test('a rider cannot pick up without any bill photo', async () => {
        const p2 = await fx.call('POST', '/v1/food/orders', A.customerToken, {
            items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
            address: { street: '1 Test Street', city: 'Indore', state: 'MP' }, storeId: A.storeId, paymentMethod: 'cash',
        });
        const id2 = String(p2.body.data.order._id);
        ok(await fx.call('PATCH', `/v1/food/store/orders/${id2}/accept`, A.managerToken, { estimatedPreparationTime: 15 }));
        for (const s of ['preparing', 'baking', 'packaging', 'ready']) ok(await fx.call('PATCH', `/v1/food/store/orders/${id2}/stage`, A.managerToken, { stage: s }));
        ok(await fx.call('POST', '/v1/store/delivery/assign', A.managerToken, { orderId: id2, riderId: rider.id }));
        ok(await fx.call('PATCH', R(`${id2}/accept`), rider.token, {}));
        assert.equal((await fx.call('PATCH', R(`${id2}/confirm-pickup`), rider.token, { confirmedOrderId: id2 })).status, 400);
    });
});

describe('the handover photo reaches every panel', () => {
    test('delivered with a handover photo: store, franchise admin and super admin all see both photos and the times', async () => {
        ok(await fx.call('PATCH', R(`${id}/reached-drop`), rider.token, {}));
        const otp = (await fx.models.FoodOrder.findById(id).select('+deliveryOtp').lean()).deliveryOtp;
        ok(await fx.call('POST', R(`${id}/verify-drop-otp`), rider.token, { otp }));
        ok(await fx.call('PATCH', R(`${id}/complete`), rider.token, { otp, paymentMethod: 'cash', handoverPhotoUrl: PROOF }));

        const store = await storeView();
        assert.deepEqual([store.delivery.billImageUrl, store.delivery.handoverPhotoUrl, store.delivery.dropOtpVerified], [BILL, PROOF, true]);
        assert.ok(store.delivery.deliveredAt && store.delivery.pickedUpAt);
        assert.ok(!JSON.stringify(store.delivery).includes(otp), 'the OTP itself is never in the payload');

        const franchise = (await fx.call('GET', '/v1/food/franchise/orders', A.adminToken)).body.data.find((o) => String(o._id) === id);
        assert.deepEqual([franchise.delivery.billImageUrl, franchise.delivery.handoverPhotoUrl], [BILL, PROOF]);
        assert.ok(franchise.deliveryPartner.name, 'the franchise sees which rider delivered it');
        assert.match(franchise.deliveryPartner.phone, /\*/, 'with a masked phone');

        const sa = (await fx.call('GET', `/v1/food/admin/orders/${id}`, fx.SA)).body.data.order;
        assert.equal(sa.deliveryVerification.handoverPhotoUrl, PROOF);
        assert.equal(sa.deliveryState.billImageUrl, BILL);
    });
    test('another franchise sees nothing of it', async () => {
        assert.equal((await fx.call('GET', `/v1/food/store/orders/${id}`, B.managerToken)).status, 404);
        const list = (await fx.call('GET', '/v1/food/franchise/orders', B.adminToken)).body.data || [];
        assert.ok(!list.some((o) => String(o._id) === id));
    });
});
