// Franchise admin across its own stores: stock, alerts, restock requests (answered by the franchise), customers,
// reviews and order issues. Another franchise sees none of it; stores stay the only ones who change stock.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let ingredientId;
const F = '/v1/food/franchise/overview';
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const col = (n) => mongoose.connection.collection(n);
const get = (path, token = A.adminToken) => fx.call('GET', `${F}${path}`, token);
const rows = async (path, token) => { const r = await get(path, token); assert.equal(r.status, 200, JSON.stringify(r.body)); return r.body.data.rows; };

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ingredientId = (await col('food_store_ingredients').insertOne({ storeId: oid(A.storeId), ingredientName: 'Mozzarella', nameKey: 'mozzarella', unit: 'kg', currentStock: 1, reorderLevel: 5, minimumStock: 2, tracked: true, createdAt: new Date(), updatedAt: new Date() })).insertedId;
    await col('food_orders').updateOne({ _id: oid(A.orderId) }, { $set: { 'ratings.store': { rating: 4, comment: 'Good', ratedAt: new Date() }, 'pricing.total': 300 } });
    await col('food_delivery_issues').insertOne({ storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderId: oid(A.orderId), orderRef: A.orderRef, issueType: 'Late', severity: 'high', status: 'open', createdAt: new Date() });
    await col('food_kitchen_issues').insertOne({ storeId: oid(A.storeId), orderId: oid(A.orderId), issueType: 'Burnt Crust', severity: 'Medium', reportedBy: oid(A.customerId), createdAt: new Date(Date.now() - 1000) });
});
after(async () => { await fx?.teardown(); });

const ask = async (quantity = 10) => {
    const r = await fx.call('POST', '/v1/food/store/inventory/reorder', A.managerToken, { ingredientId: String(ingredientId), quantity });
    assert.equal(r.status, 201, JSON.stringify(r.body));
};

describe('franchise overview', () => {
    test('stock, customers, reviews and issues of its own stores', async () => {
        const stock = (await rows('/stock')).find((r) => r.ingredientName === 'Mozzarella');
        assert.deepEqual([stock.storeName, stock.currentStock, stock.status], ['TEST STORE A', 1, 'low_stock']);
        const customer = (await rows('/customers')).find((r) => r._id === A.customerId);
        assert.deepEqual([customer.totalOrders, customer.totalSpent], [1, 300]);
        assert.deepEqual((await rows('/reviews')).map((r) => [r.rating, r.comment]), [[4, 'Good']]);
        assert.deepEqual((await rows('/order-issues')).map((r) => [r.source, r.issueType]), [['delivery', 'Late'], ['kitchen', 'Burnt Crust']]);
        assert.equal((await rows('/order-issues?source=kitchen')).length, 1);
    });
    test('loyalty: members who ordered here, points earned and rewards claimed at its stores only', async () => {
        const userId = oid(A.customerId);
        await col('rewardMemberships').insertOne({ userId, status: 'ACTIVE', pointsBalance: 250, lifetimeEarned: 300, enrolledAt: new Date() });
        await col('rewardMemberships').insertOne({ userId: new mongoose.Types.ObjectId(), status: 'ACTIVE', pointsBalance: 999, enrolledAt: new Date() });   // never ordered here
        await col('rewardLedger').insertOne({ userId, orderId: oid(A.orderId), type: 'EARN', direction: 'CREDIT', points: 100, idempotencyKey: 'l1', createdAt: new Date() });
        await col('rewardLedger').insertOne({ userId, orderId: new mongoose.Types.ObjectId(), type: 'EARN', direction: 'CREDIT', points: 200, idempotencyKey: 'l2', createdAt: new Date() });   // another franchise's order
        await col('rewardRedemptions').insertOne({ userId, code: 'AAA111', points: 50, status: 'REDEEMED', storeId: oid(A.storeId), product: { name: 'Garlic Bread' } });
        await col('rewardRedemptions').insertOne({ userId, code: 'BBB222', points: 50, status: 'REDEEMED', storeId: oid(B.storeId), product: { name: 'Garlic Bread' } });
        const data = (await get('/loyalty')).body.data;
        assert.deepEqual(data.rows.map((r) => [r._id, r.pointsBalance, r.pointsEarnedHere, r.rewardsClaimedHere, r.orders, r.status]), [[A.customerId, 250, 100, 1, 1, 'active']]);
        assert.deepEqual(data.totals, { activeMembers: 1, pointsHeld: 250, pointsEarnedHere: 100, rewardsClaimedHere: 1 });
    });
    test('another franchise sees none of it; its store id is 404; other roles 403', async () => {
        for (const path of ['/stock', '/alerts', '/restock-requests', '/loyalty', '/customers', '/reviews', '/order-issues']) {
            const mine = await rows(path, B.adminToken);
            assert.ok(!mine.some((r) => r.storeName === 'TEST STORE A'), path);
            assert.equal((await get(`${path}?storeId=${A.storeId}`, B.adminToken)).status, 404, path);
            assert.equal((await get(path, A.managerToken)).status, 403, path);
            assert.equal((await get(path, A.customerToken)).status, 403, path);
        }
    });
    test('a restock request: approve once; another franchise cannot answer it; rejecting needs a reason and closes it', async () => {
        await ask();
        const [req] = await rows('/restock-requests?status=pending');
        assert.deepEqual([req.ingredientName, req.quantity, req.unit], ['Mozzarella', 10, 'kg']);
        assert.match(req.message, /^Please send 10 kg/);
        const patch = (id, body, token = A.adminToken) => fx.call('PATCH', `${F}/restock-requests/${id}`, token, body);
        assert.equal((await patch(req._id, { decision: 'approved' }, B.adminToken)).status, 404);
        assert.equal((await patch(req._id, { decision: 'approved' }, A.managerToken)).status, 403);
        const ok = await patch(req._id, { decision: 'approved', note: 'Sending tomorrow' });
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.equal(ok.body.data.status, 'approved');
        assert.equal((await patch(req._id, { decision: 'rejected', note: 'changed my mind' })).status, 409);
        assert.ok(await col('food_task_notifications').countDocuments({ title: 'Restock approved: Mozzarella' }) >= 1, 'the manager is told');
        assert.equal((await col('food_store_ingredients').findOne({ _id: ingredientId })).currentStock, 1, 'stock is the store\'s to change');

        await ask(12);   // asking again while the approved one is still open waits for a new answer
        assert.deepEqual((await rows('/restock-requests?status=pending')).map((r) => [r._id, r.quantity]), [[req._id, 12]]);
        await col('food_ingredient_shortages').updateOne({ _id: oid(req._id) }, { $set: { status: 'resolved' } });
        await ask(3);
        const [next] = await rows('/restock-requests?status=pending');
        assert.equal((await patch(next._id, { decision: 'rejected' })).status, 400);
        assert.equal((await patch(next._id, { decision: 'rejected', note: 'No supply this week' })).status, 200);
        assert.equal((await col('food_ingredient_shortages').findOne({ _id: oid(next._id) })).status, 'resolved');
    });
});
