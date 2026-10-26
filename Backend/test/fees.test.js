// Handling charge, GST, platform fee and the cancellation fee are all set by the super admin and applied by the server.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let pizza;
before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 200 });
});
after(async () => { await fx?.teardown(); });

const FEES = '/v1/food/admin/fee-settings';
const save = (body) => fx.call('PUT', FEES, fx.SA, body);
const line = () => ({ itemId: String(pizza._id), name: 'Margherita', price: 1, quantity: 1, kind: 'product' });
const orderBody = (over = {}) => ({
    items: [line()], address: { street: '1 Test St', city: 'Indore', state: 'MP' }, storeId: A.storeId, paymentMethod: 'cash', ...over,
});
const place = (over) => fx.call('POST', '/v1/food/orders', A.customerToken, orderBody(over));

describe('who can change fees', () => {
    test('only the super admin can read or write fee settings', async () => {
        for (const token of [A.adminToken, A.managerToken, A.customerToken]) {
            assert.ok([401, 403].includes((await fx.call('PUT', FEES, token, { handlingFee: 0 })).status));
            assert.ok([401, 403].includes((await fx.call('GET', FEES, token)).status));
        }
        assert.equal((await save({ handlingFee: 10 })).status, 200);
    });
    test('negative or non-numeric fees are rejected', async () => {
        assert.equal((await save({ handlingFee: -5 })).status, 400);
        assert.equal((await save({ cancellationFee: 'abc' })).status, 400);
    });
});

describe('order totals follow the configured fees', () => {
    test('handling, platform, packaging, delivery and GST (on food + handling) are charged exactly', async () => {
        const r = await save({ handlingFee: 20, platformFee: 7, packagingFee: 3, deliveryFee: 30, freeDeliveryThreshold: 0, freeDeliveryUpTo: 0, gstRate: 10, cancellationFee: 40, cancellationFreeMinutes: 5 });
        assert.equal(r.status, 200, JSON.stringify(r.body));
        const res = await place();
        assert.equal(res.status, 201, JSON.stringify(res.body));
        const order = await fx.models.FoodOrder.findById(res.body.data.order._id).lean();
        // subtotal 200, tax = 10% of (200 + 20) = 22, total = 200 + 20 + 7 + 3 + 30 + 22
        assert.equal(order.pricing.handlingFee, 20);
        assert.equal(order.pricing.tax, 22);
        assert.equal(order.pricing.total, 282);
        assert.equal(order.pricing.cancellationFee, 40);
        assert.equal(order.pricing.cancellationFreeMinutes, 5);
    });

    test('changing a fee changes the next order', async () => {
        await save({ handlingFee: 0, platformFee: 0, packagingFee: 0, deliveryFee: 0, gstRate: 0 });
        const res = await place();
        assert.equal((await fx.models.FoodOrder.findById(res.body.data.order._id).lean()).pricing.total, 200);
    });

    test('the public fee-config endpoint shows what is configured', async () => {
        await save({ handlingFee: 12, gstRate: 18, cancellationFee: 25 });
        const res = await fx.call('GET', '/v1/food/fee-config', null);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.handlingFee, 12);
        assert.equal(res.body.data.gstRate, 18);
        assert.equal(res.body.data.cancellationFee, 25);
    });
});

describe('cancellation fee', () => {
    const makeOrder = async ({ method, ageMinutes, free = 5, fee = 50 }) => {
        const { insertedId } = await fx.models.FoodOrder.collection.insertOne({
            order_id: `CAN${Math.random().toString(36).slice(2)}`, userId: new mongoose.Types.ObjectId(A.customerId), storeId: new mongoose.Types.ObjectId(A.storeId),
            franchiseId: new mongoose.Types.ObjectId(A.franchiseId), orderStatus: 'created',
            payment: { method, status: method === 'cash' ? 'cod_pending' : 'paid' },
            pricing: { subtotal: 200, total: 200, cancellationFee: fee, cancellationFreeMinutes: free },
            deliveryAddress: { street: '1 Test St', city: 'Indore', state: 'MP' }, items: [{ itemId: 'x', name: 'Margherita', price: 200, quantity: 1 }], createdAt: new Date(Date.now() - ageMinutes * 60000), updatedAt: new Date(),
        });
        return String(insertedId);
    };
    const cancel = (id) => fx.call('PATCH', `/v1/food/orders/${id}/cancel`, A.customerToken, { refundDestination: 'wallet' });
    const read = (id) => fx.models.FoodOrder.findById(id).lean();

    test('inside the free window the whole amount is refunded', async () => {
        const id = await makeOrder({ method: 'wallet', ageMinutes: 1 });
        assert.equal((await cancel(id)).status, 200);
        const o = await read(id);
        assert.equal(o.pricing.cancellationFeeCharged, 0);
        assert.equal(o.payment.refund.amount, 200);
    });
    test('after the window a prepaid order is refunded minus the fee', async () => {
        const id = await makeOrder({ method: 'wallet', ageMinutes: 30 });
        assert.equal((await cancel(id)).status, 200);
        const o = await read(id);
        assert.equal(o.pricing.cancellationFeeCharged, 50);
        assert.equal(o.payment.refund.amount, 150);
    });
    test('the fee can never exceed the order total', async () => {
        const id = await makeOrder({ method: 'wallet', ageMinutes: 30, fee: 9999 });
        assert.equal((await cancel(id)).status, 200);
        const o = await read(id);
        assert.equal(o.pricing.cancellationFeeCharged, 200);
        assert.ok(!o.payment.refund || o.payment.refund.status !== 'processed');
    });
    test('a cash order is never charged a cancellation fee', async () => {
        const id = await makeOrder({ method: 'cash', ageMinutes: 30 });
        assert.equal((await cancel(id)).status, 200);
        assert.equal((await read(id)).pricing.cancellationFeeCharged, 0);
    });
    test('the fee in force when the order was placed applies, not a later change', async () => {
        const id = await makeOrder({ method: 'wallet', ageMinutes: 30, fee: 10 });
        await save({ cancellationFee: 999 });
        assert.equal((await cancel(id)).status, 200);
        assert.equal((await read(id)).payment.refund.amount, 190);
    });
});
