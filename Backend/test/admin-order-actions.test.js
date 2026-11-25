// Super admin on All Orders / Order Tracking: cancel (paid orders are refunded once), refund a delivered order, delay
// alert. Nobody else may.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let n = 0;
const AD = '/v1/food/admin/orders';
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const col = (c) => mongoose.connection.collection(c);
const msg = (res) => res.body.message || res.body.error;

async function order(extra = {}) {
    const ref = `ADM${fx.ts}${++n}`;
    const r = await col('food_orders').insertOne({
        order_id: ref, orderId: ref, userId: oid(A.customerId), storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderStatus: 'preparing',
        payment: { method: 'wallet', status: 'paid' }, pricing: { subtotal: 300, total: 300 }, items: [{ itemId: 'x', name: 'Margherita', quantity: 1, price: 300 }], statusHistory: [], deliveryAddress: { street: 'x', city: 'y', state: 'z' },
        createdAt: new Date(), updatedAt: new Date(), ...extra,
    });
    return String(r.insertedId);
}
const doc = (id) => col('food_orders').findOne({ _id: oid(id) });
const walletRefunds = (id) => col('refunds').find({ orderId: oid(id) }).toArray();

before(async () => { fx = await createFixture(); A = fx.F.A; });
after(async () => { await fx?.teardown(); });

describe('super admin order actions', () => {
    test('cancel: reason required; paid order cancelled by admin and refunded once', async () => {
        const id = await order();
        assert.equal((await fx.call('POST', `${AD}/${id}/cancel`, fx.SA, { reason: 'x' })).status, 400);
        const res = await fx.call('POST', `${AD}/${id}/cancel`, fx.SA, { reason: 'Store power cut' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.orderStatus, 'cancelled_by_admin');
        assert.deepEqual(res.body.data.refund, { status: 'processed', amount: 300 });
        const d = await doc(id);
        assert.equal(d.cancellation.reason, 'Store power cut');
        assert.equal(d.statusHistory.at(-1).byRole, 'ADMIN');
        assert.equal((await fx.call('POST', `${AD}/${id}/cancel`, fx.SA, { reason: 'again please' })).status, 400);
        assert.equal((await walletRefunds(id)).length, 1);
    });
    test('cancel: a COD order has nothing to refund; a delivered one cannot be cancelled', async () => {
        const cod = await order({ payment: { method: 'cash', status: 'cod_pending' } });
        assert.equal((await fx.call('POST', `${AD}/${cod}/cancel`, fx.SA, { reason: 'Customer asked' })).body.data.refund, null);
        const done = await order({ orderStatus: 'delivered' });
        assert.equal((await fx.call('POST', `${AD}/${done}/cancel`, fx.SA, { reason: 'Too late now' })).status, 400);
    });
    test('refund a delivered paid order: part, then the rest, never more', async () => {
        const id = await order({ orderStatus: 'delivered' });
        const refund = (body) => fx.call('POST', `${AD}/${id}/refund`, fx.SA, { reason: 'Item missing', ...body });
        const part = await refund({ amount: 100 });
        assert.equal(part.status, 200, JSON.stringify(part.body));
        assert.equal((await refund({ amount: 250 })).status, 400, 'only 200 left');
        assert.equal((await refund({ amount: 200 })).status, 200);
        assert.equal((await refund({ amount: 1 })).status, 400);
        const rows = await walletRefunds(id);
        assert.deepEqual(rows.map((r) => [r.amount, r.status, r.requestedBy]), [[100, 'processed', 'ADMIN'], [200, 'processed', 'ADMIN']]);
        const unpaid = await order({ orderStatus: 'delivered', payment: { method: 'cash', status: 'cod_pending' } });
        assert.equal((await fx.call('POST', `${AD}/${unpaid}/refund`, fx.SA, { reason: 'Item missing' })).status, 400);
    });
    test('delay alert: to the store or franchise; a rider only when assigned', async () => {
        const id = await order();
        const alert = (target) => fx.call('POST', `${AD}/${id}/delay-alert`, fx.SA, { target, message: 'Running 20 minutes late' });
        assert.equal((await alert('store')).status, 200);
        assert.equal((await alert('admin')).status, 200);
        const rider = await alert('rider');
        assert.equal(rider.status, 400);
        assert.match(msg(rider), /No rider/);
        assert.match((await doc(id)).statusHistory.at(-1).note, /Delay alert to admin/);
    });
    test('only the super admin', async () => {
        const id = await order();
        for (const action of ['cancel', 'refund', 'delay-alert']) {
            for (const token of [A.adminToken, A.managerToken, A.customerToken]) {
                assert.equal((await fx.call('POST', `${AD}/${id}/${action}`, token, { reason: 'not allowed', target: 'store', message: 'not allowed' })).status, 403, action);
            }
        }
        assert.equal((await doc(id)).orderStatus, 'preparing');
    });
});
