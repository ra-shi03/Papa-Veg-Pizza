// The customer's "My Complaints" screen: send a complaint about their own order, then read the store's reply and outcome.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let orderA; let orderB; let ticketId;
const T = '/v1/food/user/support/ticket';
const LIST = '/v1/food/user/support/my-tickets';

const makeOrder = async (f, ref) => {
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
        franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: 'delivered', payment: { method: 'cash', status: 'paid' },
        pricing: { subtotal: 400, total: 400 }, deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerName: 'C', customerPhone: '9000000000',
        items: [{ itemId: 'x', name: 'Margherita', quantity: 1, size: 'Medium', price: 400 }], statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
    });
    return String(r.insertedId);
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    orderA = await makeOrder(A, `CH${fx.ts}A`);
    orderB = await makeOrder(B, `CH${fx.ts}B`);
});
after(async () => { await fx?.teardown(); });

describe('sending a complaint', () => {
    test('about their own order: goes to that order\'s store', async () => {
        const res = await fx.call('POST', T, A.customerToken, { type: 'order', orderId: orderA, issueType: 'Late Delivery', description: 'Cold: came an hour late' });
        assert.equal(res.status, 201, JSON.stringify(res.body));
        ticketId = res.body.data.ticket._id;
        assert.equal(res.body.data.ticket.storeId, A.storeId);
    });
    test('about another customer\'s order: 404, and nothing reaches that store', async () => {
        const res = await fx.call('POST', T, A.customerToken, { type: 'order', orderId: orderB, issueType: 'Other', description: 'not mine' });
        assert.equal(res.status, 404);
        assert.equal((await fx.call('GET', '/v1/food/store/complaints', B.managerToken)).body.data.complaints.length, 0);
    });
    test('the coupon issue form\'s type "other" is accepted; signed-out and staff are refused', async () => {
        assert.equal((await fx.call('POST', T, A.customerToken, { type: 'other', issueType: 'Code did not work', description: 'Coupon Code: X' })).status, 201);
        assert.equal((await fx.call('POST', T, null, { type: 'other', issueType: 'x' })).status, 401);
        assert.equal((await fx.call('POST', T, A.managerToken, { type: 'other', issueType: 'x' })).status, 403);
    });
});

describe('reading replies', () => {
    const mine = async (token) => (await fx.call('GET', LIST, token)).body.data;
    const about = async () => (await mine(A.customerToken)).tickets.find((t) => t._id === ticketId);

    test('a new complaint shows the order number and store, with no reply yet', async () => {
        const t = await about();
        assert.deepEqual([t.orderNumber, t.status, t.responses.length, t.resolution], [`CH${fx.ts}A`, 'open', 0, null]);
        assert.ok(t.storeName);
    });
    test('the store\'s reply appears, and moves it to in progress', async () => {
        assert.equal((await fx.call('POST', `/v1/food/store/complaints/${ticketId}/respond`, A.managerToken, { message: 'Sorry, we are checking.' })).status, 200);
        const t = await about();
        assert.equal(t.status, 'in-progress');
        assert.equal(t.responses[0].message, 'Sorry, we are checking.');
    });
    test('the outcome appears; internal fields never do', async () => {
        const res = await fx.call('PUT', `/v1/food/store/complaints/${ticketId}/resolve`, A.managerToken, { actionTaken: 'Refund approved', refundAmount: 100, couponIssued: 'SORRY10' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const t = await about();
        assert.equal(t.status, 'resolved');
        assert.deepEqual([t.resolution.actionTaken, t.resolution.refundAmount, t.resolution.couponIssued], ['Refund approved', 100, 'SORRY10']);
        const text = JSON.stringify(t);
        for (const internal of ['resolvedById', 'resolvedBy', 'evidenceImage', 'priority', 'byName', 'userId', 'images']) assert.ok(!text.includes(internal), internal);
    });
    test('a customer sees only their own complaints', async () => {
        assert.equal((await mine(B.customerToken)).total, 0);
        assert.equal((await fx.call('GET', LIST, null)).status, 401);
        assert.equal((await fx.call('GET', LIST, A.managerToken)).status, 403);
    });
    test('paging', async () => {
        const d = (await fx.call('GET', `${LIST}?limit=1&page=2`, A.customerToken)).body.data;
        assert.deepEqual([d.tickets.length, d.total, d.page, d.limit], [1, 2, 2, 1]);
    });
});
