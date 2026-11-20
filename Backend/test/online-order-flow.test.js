// An online (Razorpay) order end to end: placing it stores the Razorpay order id on the order, so the customer's
// payment can be verified, and only then does it reach the store's Incoming Orders (unpaid online orders stay hidden).
// Razorpay itself is never called: the gateway calls are replaced through the helper's test hooks.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let helper; let pizza;
const SECRET = 'test_razorpay_secret';
const sign = (orderId, paymentId) => crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const payments = new Map();

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    helper = await import('../src/modules/food/orders/helpers/razorpay.helper.js');
    helper.setRazorpayCredentials({ keyId: 'rzp_test_key', keySecret: SECRET, webhookSecret: '' });
    helper.setOrderCreatorForTests(async (amountPaise) => ({ id: 'order_online1', amount: amountPaise, currency: 'INR' }));
    helper.setPaymentFetcherForTests(async (id) => { if (!payments.has(id)) throw new Error('not found'); return payments.get(id); });
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    const { FoodFeeSettings } = await import('../src/modules/food/admin/models/feeSettings.model.js');
    const { StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 250 });
    await FoodFeeSettings.create({ platformFee: 0, packagingFee: 0, handlingFee: 0, deliveryFee: 0, gstRate: 0, isActive: true });
    const week = Object.fromEntries(DAYS.map((d) => [d, { open: '00:00', close: '23:59', isClosed: false }]));
    await StoreHours.findOneAndUpdate({ storeId: A.storeId }, { $set: { week, holidays: [] } }, { upsert: true });
});
after(async () => {
    helper?.setOrderCreatorForTests(null); helper?.setPaymentFetcherForTests(null); helper?.setRazorpayCredentials(null);
    await fx?.teardown();
});

test('an online order keeps its Razorpay order id, is paid by a verified payment, and only then reaches the store', async () => {
    const placed = ok(await fx.call('POST', '/v1/food/orders', A.customerToken, {
        storeId: A.storeId, paymentMethod: 'razorpay', address: { street: '1 Test St', city: 'Indore', state: 'MP' },
        items: [{ itemId: String(pizza._id), name: 'Margherita', price: 250, quantity: 2, kind: 'product' }],
    }), 201);
    const id = String(placed.order._id || placed.order.id);
    assert.equal(placed.razorpay.orderId, 'order_online1');

    const stored = await fx.models.FoodOrder.findById(id).lean();
    assert.equal(stored.payment.razorpay.orderId, 'order_online1', 'the saved order knows its Razorpay order');
    assert.equal(stored.payment.status, 'created');

    const incoming = async () => ok(await fx.call('GET', '/v1/food/store/orders?view=incoming', A.managerToken)).map((o) => String(o._id || o.id));
    assert.ok(!(await incoming()).includes(id), 'unpaid online orders are not shown to the store');

    payments.set('pay_online1', { id: 'pay_online1', order_id: 'order_online1', amount: 50000, currency: 'INR', status: 'captured' });
    const verified = await fx.call('POST', '/v1/food/orders/verify-payment', A.customerToken, {
        orderId: id, razorpayOrderId: 'order_online1', razorpayPaymentId: 'pay_online1', razorpaySignature: sign('order_online1', 'pay_online1'),
    });
    assert.equal(verified.status, 200, JSON.stringify(verified.body));
    assert.equal((await fx.models.FoodOrder.findById(id).lean()).payment.status, 'paid');
    assert.ok((await incoming()).includes(id), 'once paid, the order is in Incoming Orders');
});
