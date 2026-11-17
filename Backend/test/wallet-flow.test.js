// Customer wallet: balance and history, paying an order from the wallet, the refund on cancelling it, and top-up.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let pizza; let credit;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const me = async (token = A.customerToken) => ok(await fx.call('GET', '/v1/food/user/wallet/me', token)).wallet;
const place = (token = A.customerToken, extra = {}) => fx.call('POST', '/v1/food/orders', token, {
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 200, quantity: 1, size: 'Regular', kind: 'product' }],
    storeId: A.storeId, address: { label: 'Home', name: 'Asha', phone: '9812345678', street: '1 Test Street', city: 'Indore', state: 'MP' },
    customerName: 'Asha', customerPhone: '9812345678', paymentMethod: 'wallet', ...extra,
});

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', sizes: [{ size: 'Regular', price: 200 }], basePrice: 200, price: 200 });
    ({ creditWallet: credit } = await import('../src/modules/food/user/services/walletLedger.service.js'));
});
after(async () => { await fx?.teardown(); });

describe('wallet balance and history', () => {
    test('a new wallet is empty; each customer sees only their own', async () => {
        assert.equal((await me()).balance, 0);
        assert.equal((await fx.call('GET', '/v1/food/user/wallet/me', null)).status, 401);
    });

    test('a credit shows in the balance and the history, newest first', async () => {
        await credit({ userId: A.customerId, amountPaise: 50000, reason: 'TOPUP', idempotencyKey: 'seed:1', description: 'Seed' });
        assert.equal((await me()).balance, 500);
        const tx = ok(await fx.call('GET', '/v1/food/user/wallet/transactions', A.customerToken));
        assert.equal(tx.transactions.length, 1);
        assert.equal(tx.transactions[0].type, 'CREDIT');
        assert.equal(tx.transactions[0].amount, 500);
        assert.equal((await me(B.customerToken)).balance, 0, 'another customer sees nothing');
    });

    test('the same credit key never credits twice', async () => {
        await credit({ userId: A.customerId, amountPaise: 50000, reason: 'TOPUP', idempotencyKey: 'seed:1', description: 'Seed' });
        assert.equal((await me()).balance, 500);
    });
});

describe('paying an order from the wallet', () => {
    let order;
    test('the order is placed, the wallet is debited by the order total and the payment is paid', async () => {
        const res = ok(await place(), 201);
        order = res.order;
        assert.equal((await me()).balance, 500 - order.pricing.total);
        const { FoodOrder } = await import('../src/modules/food/orders/models/order.model.js');
        const fresh = await FoodOrder.findById(order._id).lean();
        assert.equal(fresh.payment.method, 'wallet');
        assert.ok(['paid', 'captured'].includes(String(fresh.payment.status).toLowerCase()), fresh.payment.status);
        const tx = ok(await fx.call('GET', '/v1/food/user/wallet/transactions', A.customerToken)).transactions;
        assert.equal(tx[0].type, 'DEBIT');
    });

    test('not enough balance: refused, nothing is taken', async () => {
        const before = (await me()).balance;
        await credit({ userId: B.customerId, amountPaise: 1000, reason: 'TOPUP', idempotencyKey: 'seed:b', description: 'Seed' });
        const res = await place(B.customerToken);
        assert.equal(res.status, 400, JSON.stringify(res.body));
        assert.equal((await me(B.customerToken)).balance, 10);
        assert.equal((await me()).balance, before);
    });

    test('cancelling the order gives the money back to the wallet, once', async () => {
        const total = order.pricing.total;
        const cancel = await fx.call('PATCH', `/v1/food/orders/${order._id}/cancel`, A.customerToken, { reason: 'Changed my mind' });
        assert.equal(cancel.status, 200, JSON.stringify(cancel.body));
        assert.equal((await me()).balance, 500, `back to 500 after refunding ${total}`);
        await fx.call('PATCH', `/v1/food/orders/${order._id}/cancel`, A.customerToken, { reason: 'again' });
        assert.equal((await me()).balance, 500, 'no second refund');
    });
});

describe('top-up', () => {
    const verify = () => fx.call('POST', '/v1/food/user/wallet/topup/verify', A.customerToken, { razorpayOrderId: 'order_x', razorpayPaymentId: 'pay_x', razorpaySignature: 'sig', amount: 9999 });

    test('with no payment gateway a client cannot credit itself any amount it names', async () => {
        assert.equal((await verify()).status, 400);
        assert.equal((await fx.call('POST', '/v1/food/user/wallet/topup/order', A.customerToken, { amount: 100 })).status, 400);
        assert.equal((await me()).balance, 500);
    });

    test('never in production, even when the developer switch is on', async () => {
        const prev = process.env.NODE_ENV;
        process.env.WALLET_DEV_TOPUP = 'true';
        process.env.NODE_ENV = 'production';
        try {
            assert.equal((await verify()).status, 400);
        } finally {
            process.env.NODE_ENV = prev;
            delete process.env.WALLET_DEV_TOPUP;
        }
        assert.equal((await me()).balance, 500);
    });
});
