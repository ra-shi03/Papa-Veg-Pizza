// Pet Pooja, one setup per store (docs/kitchen-staff-removal.md, "Pet Pooja"). Each store saves its own restaurant ID and
// keys; when it is on, the store's orders are sent to its Pet Pooja (where the manager runs them with Zomato / Swiggy) and
// Pet Pooja's accepted / food ready / cancelled come back through the store's callback link. The order flow is the same
// with or without it, and nothing breaks when Pet Pooja is off, not set up or down.
// A local HTTP double stands in for Pet Pooja (PETPOOJA_API_BASE_URL may be http://127.0.0.1 outside production).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
let outbox; let Integration; let SyncLog;
let pp; let ppUrl; const received = []; let ppAnswer = { status: 200, body: { success: '1', message: 'Order saved', orderID: 'PP-1' } };
let seq = 0;

const P = '/v1/food/store/pos/petpooja';
const KEYS = { restaurantId: 'rest_A1', appKey: 'appkey-AAAA1111', appSecret: 'secret-BBBB2222', accessToken: 'token-CCCC3333' };
const order = async (f, extra = {}) => {
    const ref = `PP${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
        franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: 'created', payment: { method: 'cash', status: 'cod_pending' },
        pricing: { subtotal: 250, tax: 13, total: 263 }, deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' },
        customerName: 'Test Customer', customerPhone: f.phone, items: [{ itemId: 'prod-1', name: 'Farmhouse', quantity: 2, price: 125 }],
        statusHistory: [], createdAt: new Date(), updatedAt: new Date(), ...extra,
    });
    return { id: String(r.insertedId), ref };
};
const dbOrder = (o) => fx.models.FoodOrder.findById(o.id).lean();
const lastLog = (o, action) => SyncLog.findOne({ orderId: new mongoose.Types.ObjectId(o.id), action }).sort({ createdAt: -1 }).lean();
const callback = (key, body) => fx.call('POST', `/v1/pos/petpooja/callback/${key}`, null, body);
/** Sending runs in the background: wait until the order's outbox row is no longer being sent (at most 3 s). */
const settled = async (o, action) => {
    for (let i = 0; i < 30; i += 1) {
        const row = await lastLog(o, action);
        if (row && row.status !== 'pending') return row;
        await outbox.sweep();
        await new Promise((r) => setTimeout(r, 100));
    }
    return lastLog(o, action);
};

before(async () => {
    pp = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
            received.push({ path: req.url, body: JSON.parse(raw || '{}') });
            res.writeHead(ppAnswer.status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(ppAnswer.body));
        });
    });
    await new Promise((r) => pp.listen(0, '127.0.0.1', r));
    ppUrl = `http://127.0.0.1:${pp.address().port}`;
    delete process.env.PETPOOJA_API_BASE_URL;   // the server starts without Pet Pooja's address

    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    outbox = await import('../src/modules/food/pos/services/posOutbox.service.js');
    ({ StorePosIntegration: Integration } = await import('../src/modules/food/pos/models/storePosIntegration.model.js'));
    ({ PosSyncLog: SyncLog } = await import('../src/modules/food/pos/models/posSyncLog.model.js'));
});
after(async () => {
    delete process.env.PETPOOJA_API_BASE_URL;
    await fx?.teardown();
    await new Promise((r) => pp?.close(r));
});

describe('settings: one per store, store manager only, keys never shown', () => {
    test('a new store starts with Pet Pooja off and its own callback link', async () => {
        const r = await fx.call('GET', P, A.managerToken);
        assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(r.body.data.enabled, false);
        assert.equal(r.body.data.appKey.set, false);
        assert.match(r.body.data.callbackUrl, /\/api\/v1\/pos\/petpooja\/callback\/[a-f0-9]{64}$/);
        const b = await fx.call('GET', P, B.managerToken);
        assert.notEqual(b.body.data.callbackUrl, r.body.data.callbackUrl, 'each store has its own link');
    });

    test('only the store manager: franchise admin, customer and an old kitchen staff token are refused', async () => {
        assert.equal((await fx.call('GET', P, A.adminToken)).status, 403);
        assert.equal((await fx.call('GET', P, A.customerToken)).status, 403);
        const old = await fx.legacyStaff('A', 'pplegacy');
        assert.equal((await fx.call('GET', P, old.token)).status, 403);
    });

    test('it cannot be switched on before the restaurant ID and the three keys are saved', async () => {
        const r = await fx.call('PUT', P, A.managerToken, { enabled: true, restaurantId: 'rest_A1' });
        assert.equal(r.status, 400);
        assert.match(r.body.message || r.body.error, /app key, app secret, access token/);
    });

    test('keys are stored encrypted and only their last 4 characters come back', async () => {
        const r = await fx.call('PUT', P, A.managerToken, { ...KEYS, enabled: true });
        assert.equal(r.status, 200, JSON.stringify(r.body));
        const text = JSON.stringify(r.body);
        for (const k of [KEYS.appKey, KEYS.appSecret, KEYS.accessToken]) assert.ok(!text.includes(k), 'a key is never sent back');
        assert.deepEqual(r.body.data.appSecret, { set: true, last4: '2222' });
        assert.equal(r.body.data.enabled, true);
        assert.equal(r.body.data.runsOrdersInPos, true);
        assert.equal(r.body.data.serverReady, false);
        const doc = await Integration.findOne({ storeId: A.storeId }).lean();
        assert.ok(doc.appSecret.value && !doc.appSecret.value.includes(KEYS.appSecret));
        // a later save without keys keeps them; an unknown field is refused
        assert.equal((await fx.call('PUT', P, A.managerToken, { pushOrders: true })).body.data.appKey.set, true);
        assert.equal((await fx.call('PUT', P, A.managerToken, { storeId: B.storeId })).status, 400);
    });
});

describe('orders out to Pet Pooja', () => {
    test('without the server address an order is recorded as skipped, and the order flow is untouched', async () => {
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        await new Promise((r) => setTimeout(r, 150));
        const row = await lastLog(o, 'save_order');
        assert.equal(row.status, 'skipped');
        assert.match(row.lastError, /PETPOOJA_API_BASE_URL/);
        assert.equal((await dbOrder(o)).pos.status, 'skipped');
        // the store accepts it as usual
        assert.equal((await fx.call('PATCH', `/v1/food/store/orders/${o.id}/accept`, A.managerToken, { estimatedPreparationTime: 10 })).status, 200);
    });

    test('a store with Pet Pooja off gets nothing queued', async () => {
        const o = await order(B);
        assert.equal(await outbox.queueOrderIfNeeded(await dbOrder(o)), null);
        assert.equal(await lastLog(o, 'save_order'), null);
    });

    test('an online order is not sent before it is paid', async () => {
        const o = await order(A, { payment: { method: 'razorpay', status: 'created' } });
        assert.equal(await outbox.queueOrderIfNeeded(await dbOrder(o)), null);
    });

    test('with the server address the order goes to Pet Pooja with the store\'s keys, once', async () => {
        process.env.PETPOOJA_API_BASE_URL = ppUrl;
        received.length = 0;
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        await outbox.queueOrderIfNeeded(await dbOrder(o));   // twice: still one row
        const row = await settled(o, 'save_order');
        assert.equal(row.status, 'sent', JSON.stringify(row));
        assert.equal(await SyncLog.countDocuments({ orderId: new mongoose.Types.ObjectId(o.id), action: 'save_order' }), 1);
        const sent = received.find((x) => x.body?.orderinfo?.OrderInfo?.Order?.details?.orderID === o.ref);
        assert.ok(sent, 'Pet Pooja got the order');
        assert.equal(sent.path, '/save_order');
        assert.equal(sent.body.app_secret, KEYS.appSecret);
        assert.equal(sent.body.orderinfo.OrderInfo.Restaurant.details.restID, KEYS.restaurantId);
        assert.equal(sent.body.orderinfo.OrderInfo.Order.details.payment_type, 'COD');
        assert.equal(sent.body.orderinfo.OrderInfo.OrderItem.details[0].quantity, '2');
        // the store's callback link goes with the order, so Pet Pooja's updates come back without the manager doing anything
        assert.match(sent.body.orderinfo.OrderInfo.Order.details.callback_url, /^http:\/\/127\.0\.0\.1:\d+\/api\/v1\/pos\/petpooja\/callback\/[a-f0-9]{64}$/);
        const saved = await dbOrder(o);
        assert.equal(saved.pos.status, 'sent');
        assert.equal(saved.pos.posOrderId, 'PP-1');
        assert.equal(saved.orderStatus, 'created', 'sending never changes the order');
    });

    test('Pet Pooja down: retried later, then the manager can send it again', async () => {
        ppAnswer = { status: 503, body: { success: '0', message: 'busy' } };
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        await new Promise((r) => setTimeout(r, 200));
        let row = await lastLog(o, 'save_order');
        assert.equal(row.status, 'pending');
        assert.ok(row.nextAttemptAt > new Date(), 'a retry is scheduled');
        // a hard refusal (4xx) is not retried: it is failed and the manager sees it
        ppAnswer = { status: 400, body: { success: '0', message: 'Invalid restID' } };
        await SyncLog.updateOne({ _id: row._id }, { $set: { nextAttemptAt: new Date(Date.now() - 1000) } });
        await outbox.processRow(row._id);
        row = await lastLog(o, 'save_order');
        assert.equal(row.status, 'failed');
        assert.equal(row.lastError, 'Invalid restID');
        // another store's manager cannot see or resend it
        assert.equal((await fx.call('POST', `${P}/logs/${row._id}/retry`, B.managerToken)).status, 404);
        ppAnswer = { status: 200, body: { success: '1', message: 'Order saved', orderID: 'PP-2' } };
        const again = await fx.call('POST', `${P}/logs/${row._id}/retry`, A.managerToken);
        assert.equal(again.status, 200, JSON.stringify(again.body));
        assert.equal(again.body.data.status, 'sent');
        const logs = await fx.call('GET', `${P}/logs?status=sent`, A.managerToken);
        assert.ok(logs.body.data.logs.some((l) => l._id === String(row._id)));
    });

    test('an order cancelled here after it was sent is cancelled in Pet Pooja too', async () => {
        const o = await order(A);
        await outbox.queueOrderIfNeeded(await dbOrder(o));
        assert.equal((await settled(o, 'save_order')).status, 'sent');
        assert.equal((await dbOrder(o)).pos.status, 'sent');
        await fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'cancelled_by_user' } });
        received.length = 0;
        await outbox.queueCancelIfNeeded(await dbOrder(o));
        assert.equal((await settled(o, 'cancel_order')).status, 'sent');
        assert.equal(received.find((x) => x.path === '/update_order_status')?.body.status, '-1');
    });
});

describe('status updates from Pet Pooja', () => {
    let key;
    before(async () => { key = (await Integration.findOne({ storeId: A.storeId }).lean()).callbackKey; });

    test('a wrong link is 404 and another outlet\'s restaurant ID is refused', async () => {
        assert.equal((await callback('f'.repeat(64), { status: '1' })).status, 404);
        assert.equal((await callback('not-a-key', { status: '1' })).status, 404);
        const o = await order(A);
        assert.equal((await callback(key, { restID: 'other', clientorderID: o.ref, status: '1' })).status, 403);
        assert.equal((await dbOrder(o)).orderStatus, 'created');
    });

    test('accepted -> food ready move the order here; a repeat is ignored; delivery stays ours', async () => {
        const o = await order(A);
        const acc = await callback(key, { restID: KEYS.restaurantId, orderID: 'PP-9', clientorderID: o.ref, status: '1', minimum_prep_time: '12' });
        assert.equal(acc.status, 200, JSON.stringify(acc.body));
        assert.equal(acc.body.data.status, 'applied');
        let saved = await dbOrder(o);
        assert.equal(saved.orderStatus, 'confirmed');
        assert.equal(saved.kitchen.estimatedPrepMinutes, 12);
        assert.equal(saved.pos.posOrderId, 'PP-9');
        assert.equal((await callback(key, { restID: KEYS.restaurantId, orderID: 'PP-9', status: '2' })).body.data.status, 'ignored');

        const ready = await callback(key, { restID: KEYS.restaurantId, orderID: 'PP-9', status: '5' });
        assert.equal(ready.body.data.status, 'applied', JSON.stringify(ready.body));
        saved = await dbOrder(o);
        assert.equal(saved.orderStatus, 'ready_for_pickup');
        assert.equal(saved.kitchen.stage, 'ready');
        assert.equal((await callback(key, { restID: KEYS.restaurantId, orderID: 'PP-9', status: '10' })).body.data.status, 'ignored');
        assert.equal((await dbOrder(o)).orderStatus, 'ready_for_pickup', 'delivered in Pet Pooja does not deliver the order here');
    });

    test('cancelled in Pet Pooja cancels the order here, and it is not sent back as a cancellation', async () => {
        const o = await order(A, { pos: { provider: 'petpooja', status: 'sent', posOrderId: 'PP-C' } });
        const r = await callback(key, { restID: KEYS.restaurantId, orderID: 'PP-C', status: '-1', cancel_reason: 'Out of cheese' });
        assert.equal(r.body.data.status, 'applied', JSON.stringify(r.body));
        const saved = await dbOrder(o);
        assert.equal(saved.orderStatus, 'cancelled_by_store');
        assert.match(saved.cancellation.reason, /Out of cheese/);
        assert.equal(await outbox.queueCancelIfNeeded(saved), null);
    });

    test('with "Let Pet Pooja update order status" off, updates are only recorded', async () => {
        assert.equal((await fx.call('PUT', P, A.managerToken, { acceptStatusUpdates: false })).status, 200);
        const o = await order(A);
        const r = await callback(key, { restID: KEYS.restaurantId, clientorderID: o.ref, status: '1' });
        assert.equal(r.body.data.status, 'ignored');
        assert.equal((await dbOrder(o)).orderStatus, 'created');
        await fx.call('PUT', P, A.managerToken, { acceptStatusUpdates: true });
    });

    test('a new callback link: the old one stops working', async () => {
        const r = await fx.call('POST', `${P}/callback-key`, A.managerToken);
        assert.equal(r.status, 200);
        assert.equal((await callback(key, { status: '1' })).status, 404);
        key = r.body.data.callbackUrl.split('/').pop();
    });
});
