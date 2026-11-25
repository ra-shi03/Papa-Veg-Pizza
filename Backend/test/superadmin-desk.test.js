// Super admin screens: refunds with their order and customer, a customer's history and block, every store's kitchen
// staff. Franchise admins and store roles are kept out.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let chef; let refundId;
const AD = '/v1/food/admin';
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const col = (n) => mongoose.connection.collection(n);
const ok = (res) => { assert.equal(res.status, 200, JSON.stringify(res.body)); return res.body.data; };

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    chef = await fx.staff('A', 'Pizza Maker', 'sachef');
    await col('food_orders').updateOne({ _id: oid(A.orderId) }, { $set: { orderStatus: 'delivered', items: [{ itemId: 'x', name: 'Margherita', quantity: 2, price: 150, size: 'Large' }], 'pricing.total': 300, 'kitchen.staff.pizza_chef': { userId: oid(chef.id), name: chef.name } } });
    refundId = String((await col('refunds').insertOne({ orderId: oid(A.orderId), userId: oid(A.customerId), amount: 100, status: 'pending', refundTo: 'wallet', reason: 'Cold', createdAt: new Date() })).insertedId);
});
after(async () => { await fx?.teardown(); });

describe('super admin desk', () => {
    test('refunds carry the order, the customer and the payment', async () => {
        const [r] = ok(await fx.call('GET', `${AD}/refunds`, fx.SA)).refunds;
        assert.equal(r.order.orderNumber, A.orderRef);
        assert.deepEqual(r.order.items.map((i) => [i.product, i.variant, i.qty, i.subtotal]), [['Margherita', 'Large', 2, 300]]);
        assert.deepEqual([r.customer.lifetimeOrders, r.customer.lifetimeSpend], [1, 300]);
        assert.equal(r.status, 'pending');
        assert.equal(ok(await fx.call('POST', `${AD}/refunds/${refundId}/reject`, fx.SA, { reason: 'Not valid' })).refund.status, 'rejected');
        assert.equal((await fx.call('POST', `${AD}/refunds/${refundId}/approve`, fx.SA, {})).status, 400, 'already answered');
    });
    test('customer history, and blocking signs the account off', async () => {
        const h = ok(await fx.call('GET', `${AD}/customers/${A.customerId}/history`, fx.SA));
        assert.deepEqual(h.orders.map((o) => [o.orderNumber, o.total, o.items]), [[A.orderRef, 300, '2 x Margherita']]);
        assert.equal(h.refunds.length, 1);
        ok(await fx.call('PATCH', `${AD}/customers/${A.customerId}/status`, fx.SA, { isActive: false }));
        assert.equal((await fx.models.User.findById(A.customerId).lean()).isActive, false);
        ok(await fx.call('PATCH', `${AD}/customers/${A.customerId}/status`, fx.SA, { isActive: true }));
    });
    test('kitchen staff of every store, with delivered orders and duty', async () => {
        const { staff } = ok(await fx.call('GET', `${AD}/kitchen-staff`, fx.SA));
        const c = staff.find((s) => s._id === chef.staffId);
        assert.deepEqual([c.name, c.storeName, c.ordersDelivered, c.onDuty], [chef.name, 'TEST STORE A', 1, true]);
        assert.ok(!staff.some((s) => /manager/i.test(s.role)), 'store managers have their own page');
    });
    test('roles: the real ones with how many hold each; no supervisor', async () => {
        const { roles } = ok(await fx.call('GET', `${AD}/roles-summary`, fx.SA));
        assert.deepEqual(roles.map((r) => r.code), ['SUPER_ADMIN', 'FRANCHISE_ADMIN', 'STORE_MANAGER', 'KITCHEN_STAFF', 'DELIVERY_PARTNER', 'CUSTOMER']);
        const by = Object.fromEntries(roles.map((r) => [r.code, r.people]));
        assert.deepEqual([by.SUPER_ADMIN, by.FRANCHISE_ADMIN, by.STORE_MANAGER, by.KITCHEN_STAFF], [1, 2, 2, 1]);
    });
    test('only the super admin', async () => {
        for (const path of ['/refunds', '/roles-summary', '/kitchen-staff', `/customers/${A.customerId}/history`]) {
            for (const token of [A.adminToken, A.managerToken, chef.token, A.customerToken]) {
                assert.equal((await fx.call('GET', `${AD}${path}`, token)).status, 403, path);
            }
        }
    });
});
