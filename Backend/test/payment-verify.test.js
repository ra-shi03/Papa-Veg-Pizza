// POST /food/orders/verify-payment: a Razorpay payment proof is accepted only for the order it was made for, only for
// the full order total, only once, and only by the order's own customer. Razorpay itself is never called: the payment
// lookup is replaced through setPaymentFetcherForTests.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx;
let helper;
const SECRET = 'test_razorpay_secret';
const sign = (orderId, paymentId) => crypto.createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');
// What Razorpay would answer for each payment id
const payments = new Map();

const ids = {};
async function insertOnlineOrder(key, { userId, storeId, franchiseId, total, rzOrderId, orderStatus = 'created' }) {
    const _id = new mongoose.Types.ObjectId();
    await fx.models.FoodOrder.collection.insertOne({
        _id, order_id: `PAY${key}${fx.ts}`, orderId: `PAY${key}${fx.ts}`,
        userId: new mongoose.Types.ObjectId(userId), storeId: new mongoose.Types.ObjectId(storeId), franchiseId: new mongoose.Types.ObjectId(franchiseId),
        orderStatus, items: [{ itemId: 'p1', name: 'Margherita', price: total, quantity: 1 }],
        deliveryAddress: { street: '1 Test Street', city: 'Indore', state: 'MP' },
        pricing: { subtotal: total, total },
        payment: { method: 'razorpay', status: 'created', amountDue: total, razorpay: { orderId: rzOrderId, paymentId: '', signature: '' } },
        statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
    });
    ids[key] = String(_id);
    return String(_id);
}

const verify = (token, body) => fx.call('POST', '/v1/food/orders/verify-payment', token, body);
const load = (key) => fx.models.FoodOrder.findById(ids[key]).lean();

before(async () => {
    fx = await createFixture();
    helper = await import('../src/modules/food/orders/helpers/razorpay.helper.js');
    helper.setRazorpayCredentials({ keyId: 'rzp_test_key', keySecret: SECRET, webhookSecret: '' });
    helper.setPaymentFetcherForTests(async (id) => {
        if (!payments.has(id)) throw new Error('not found');
        return payments.get(id);
    });
    const A = fx.F.A;
    await insertOnlineOrder('cheap', { userId: A.customerId, storeId: A.storeId, franchiseId: A.franchiseId, total: 100, rzOrderId: 'order_cheap' });
    await insertOnlineOrder('big', { userId: A.customerId, storeId: A.storeId, franchiseId: A.franchiseId, total: 900, rzOrderId: 'order_big' });
    await insertOnlineOrder('short', { userId: A.customerId, storeId: A.storeId, franchiseId: A.franchiseId, total: 500, rzOrderId: 'order_short' });
    await insertOnlineOrder('cancelled', { userId: A.customerId, storeId: A.storeId, franchiseId: A.franchiseId, total: 300, rzOrderId: 'order_cancelled', orderStatus: 'cancelled_by_user' });
    payments.set('pay_cheap', { id: 'pay_cheap', order_id: 'order_cheap', amount: 10000, currency: 'INR', status: 'captured' });
    payments.set('pay_big', { id: 'pay_big', order_id: 'order_big', amount: 90000, currency: 'INR', status: 'captured' });
    payments.set('pay_short', { id: 'pay_short', order_id: 'order_short', amount: 100, currency: 'INR', status: 'captured' });
    payments.set('pay_cancelled', { id: 'pay_cancelled', order_id: 'order_cancelled', amount: 30000, currency: 'INR', status: 'captured' });
});
after(async () => {
    helper?.setPaymentFetcherForTests(null);
    helper?.setRazorpayCredentials(null);
    await fx?.teardown();
});

describe('verify-payment binds the proof to its order', () => {
    test("a valid proof for order A is refused on order B, and B does not change", async () => {
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.big, razorpayOrderId: 'order_cheap', razorpayPaymentId: 'pay_cheap', razorpaySignature: sign('order_cheap', 'pay_cheap'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        const big = await load('big');
        assert.equal(big.payment.status, 'created');
        assert.equal(big.payment.razorpay.paymentId, '');
        assert.equal((big.statusHistory || []).length, 0);
    });

    test('a proof whose payment belongs to another Razorpay order is refused, even with this order id', async () => {
        // signature is valid for (order_big, pay_cheap), but Razorpay says pay_cheap paid order_cheap
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.big, razorpayOrderId: 'order_big', razorpayPaymentId: 'pay_cheap', razorpaySignature: sign('order_big', 'pay_cheap'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await load('big')).payment.status, 'created');
    });

    test('a payment for less than the order total is refused', async () => {
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.short, razorpayOrderId: 'order_short', razorpayPaymentId: 'pay_short', razorpaySignature: sign('order_short', 'pay_short'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await load('short')).payment.status, 'created');
    });

    test('a bad signature is refused', async () => {
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.big, razorpayOrderId: 'order_big', razorpayPaymentId: 'pay_big', razorpaySignature: sign('order_big', 'pay_big').replace(/.$/, '0'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await load('big')).payment.status, 'created');
    });

    test("another customer's order is 404 and does not change", async () => {
        const res = await verify(fx.F.B.customerToken, {
            orderId: ids.big, razorpayOrderId: 'order_big', razorpayPaymentId: 'pay_big', razorpaySignature: sign('order_big', 'pay_big'),
        });
        assert.equal(res.status, 404, JSON.stringify(res.body));
        assert.equal((await load('big')).payment.status, 'created');
    });

    test('a cancelled order cannot be paid', async () => {
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.cancelled, razorpayOrderId: 'order_cancelled', razorpayPaymentId: 'pay_cancelled', razorpaySignature: sign('order_cancelled', 'pay_cancelled'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await load('cancelled')).payment.status, 'created');
    });

    test('the valid proof for the order marks it paid', async () => {
        const body = { orderId: ids.big, razorpayOrderId: 'order_big', razorpayPaymentId: 'pay_big', razorpaySignature: sign('order_big', 'pay_big') };
        const res = await verify(fx.F.A.customerToken, body);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const big = await load('big');
        assert.equal(big.payment.status, 'paid');
        assert.equal(big.payment.razorpay.paymentId, 'pay_big');
        assert.equal(big.statusHistory.filter((h) => h.note === 'Payment verified').length, 1);
    });

    test('verifying the same payment twice is idempotent', async () => {
        const body = { orderId: ids.big, razorpayOrderId: 'order_big', razorpayPaymentId: 'pay_big', razorpaySignature: sign('order_big', 'pay_big') };
        const before = await load('big');
        const res = await verify(fx.F.A.customerToken, body);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const afterDoc = await load('big');
        assert.equal(afterDoc.payment.status, 'paid');
        assert.equal(afterDoc.statusHistory.length, before.statusHistory.length, 'no second history entry');
    });

    test('another proof on an order that is already paid is refused and changes nothing', async () => {
        const res = await verify(fx.F.A.customerToken, {
            orderId: ids.big, razorpayOrderId: 'order_cheap', razorpayPaymentId: 'pay_cheap', razorpaySignature: sign('order_cheap', 'pay_cheap'),
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await load('big')).payment.razorpay.paymentId, 'pay_big');
    });
});

describe('signature compare and payment secrets key', () => {
    test('safeEqual is exact', () => {
        assert.equal(helper.safeEqual('abc', 'abc'), true);
        assert.equal(helper.safeEqual('abc', 'abd'), false);
        assert.equal(helper.safeEqual('abc', 'abcd'), false);
        assert.equal(helper.safeEqual('abc', undefined), false);
    });

    test('in production, a saved gateway without PAYMENT_SECRETS_KEY stops the server from starting', async () => {
        const { validatePaymentSecrets } = await import('../src/config/validateEnv.js');
        const { config } = await import('../src/config/env.js');
        const saved = { env: config.nodeEnv, key: process.env.PAYMENT_SECRETS_KEY, exit: process.exit };
        let exitCode = null;
        try {
            delete process.env.PAYMENT_SECRETS_KEY;
            process.exit = (code) => { exitCode = code; };
            config.nodeEnv = 'production';
            await validatePaymentSecrets(async () => 1);
            assert.equal(exitCode, 1);
            exitCode = null;
            await validatePaymentSecrets(async () => 0);
            assert.equal(exitCode, null, 'no gateway saved: nothing to protect');
            process.env.PAYMENT_SECRETS_KEY = 'k'.repeat(64);
            await validatePaymentSecrets(async () => 3);
            assert.equal(exitCode, null);
        } finally {
            config.nodeEnv = saved.env;
            process.exit = saved.exit;
            if (saved.key === undefined) delete process.env.PAYMENT_SECRETS_KEY; else process.env.PAYMENT_SECRETS_KEY = saved.key;
        }
    });
});
