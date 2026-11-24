// Store manager panel pieces that were missing:
//   - Staff performance (/v1/store/performance): worked out from finished kitchen orders, attendance, complaints and ratings
//   - Dashboard low-stock "Reorder" (/v1/food/store/inventory/reorder): a restock request to the franchise (a shortage on
//     record + the franchise admins told)
//   - Delivery issues keep an uploaded photo link
//   - notifyUsers (task assigned, leave, attendance...) also sends a push to the person's saved devices
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let chef; let baker;
const oid = (v) => new mongoose.Types.ObjectId(String(v));
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
let seq = 0;

/** A finished kitchen order of store A: `who` held the stations, ready `minutes` after it was accepted. */
async function finishedOrder({ pizza, bake, pack, minutes = 20, delayed = false, rating }) {
    const ready = new Date(Date.now() - 60 * 60 * 1000);
    const accepted = new Date(ready.getTime() - minutes * 60000);
    const person = (u) => (u ? { userId: oid(u.id), name: u.name, assignedAt: accepted } : undefined);
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: `PERF${fx.ts}${++seq}`, userId: oid(A.customerId), storeId: oid(A.storeId), franchiseId: oid(A.franchiseId), orderStatus: 'delivered',
        kitchen: { stage: 'ready', acceptedAt: accepted, readyAt: ready, expectedReadyAt: new Date(accepted.getTime() + 30 * 60000), delayReason: delayed ? 'Oven down' : '',
            staff: { pizza_chef: person(pizza), baking_chef: person(bake), packaging_staff: person(pack) } },
        ...(rating ? { ratings: { store: { rating, ratedAt: ready } } } : {}),
        pricing: { total: 300 }, items: [], createdAt: accepted, updatedAt: ready,
    });
    return r.insertedId;
}

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    chef = await fx.staff('A', 'Pizza Maker', 'pchef');
    baker = await fx.staff('A', 'Baker', 'pbaker');
    await finishedOrder({ pizza: chef, bake: baker, minutes: 20, rating: 5 });
    await finishedOrder({ pizza: chef, bake: baker, minutes: 40, delayed: true, rating: 3 });
    const third = await finishedOrder({ pizza: chef, minutes: 30 });
    await mongoose.connection.collection('food_support_tickets').insertOne({ userId: oid(A.customerId), type: 'order', orderId: third, storeId: oid(A.storeId), issueType: 'Cold pizza', status: 'open', createdAt: new Date() });
});
after(async () => { await fx?.teardown(); });

describe('staff performance', () => {
    test('leaderboard from real orders: orders, prep time, delays, attendance, complaints, rating, score', async () => {
        const rows = ok(await fx.call('GET', '/v1/store/performance?period=weekly', A.managerToken));
        const c = rows.find((r) => r.staffId === chef.staffId);
        const b = rows.find((r) => r.staffId === baker.staffId);
        assert.deepEqual([c.totalOrders, c.avgPreparationTime, c.delayedOrders, c.customerComplaints, c.rating], [3, 30, 1, 1, 4]);
        assert.deepEqual([b.totalOrders, b.avgPreparationTime, b.delayedOrders, b.customerComplaints], [2, 30, 1, 0]);
        assert.equal(c.attendancePercentage, 100, 'clocked in today');
        assert.ok(c.score > 0 && c.score <= 100);
        assert.equal(rows[0].score >= rows[rows.length - 1].score, true, 'best first');
    });
    test('filters: role and search; one person\'s details with their latest orders', async () => {
        assert.deepEqual(ok(await fx.call('GET', '/v1/store/performance?role=Baker', A.managerToken)).map((r) => r.staffId), [baker.staffId]);
        assert.deepEqual(ok(await fx.call('GET', '/v1/store/performance?search=pchef', A.managerToken)).map((r) => r.staffId), [chef.staffId]);
        const d = ok(await fx.call('GET', `/v1/store/performance/${chef.staffId}?period=monthly`, A.managerToken));
        assert.equal(d.staff.fullName, chef.name);
        assert.equal(d.staff.activities.length, 3);
        assert.ok(d.staff.activities.some((a) => a.type === 'delay'));
    });
    test('scope: another store is 404, kitchen staff 403, the franchise admin names the store', async () => {
        assert.equal((await fx.call('GET', `/v1/store/performance/${chef.staffId}`, B.managerToken)).status, 404);
        assert.equal((await fx.call('GET', '/v1/store/performance', chef.token)).status, 403);
        assert.equal((await fx.call('GET', '/v1/store/performance', A.adminToken)).status, 400);
        assert.equal(ok(await fx.call('GET', `/v1/store/performance?storeId=${A.storeId}`, A.adminToken)).length, 2);
        assert.equal((await fx.call('GET', `/v1/store/performance?storeId=${A.storeId}`, B.adminToken)).status, 404);
    });
});

describe('dashboard Reorder: a restock request to the franchise', () => {
    let ingredientId;
    before(async () => {
        const r = await mongoose.connection.collection('food_store_ingredients').insertOne({
            storeId: oid(A.storeId), ingredientName: 'Mozzarella', nameKey: 'mozzarella', unit: 'kg', currentStock: 1, reorderLevel: 5, tracked: true, createdAt: new Date(), updatedAt: new Date(),
        });
        ingredientId = String(r.insertedId);
    });
    test('the manager asks; a shortage is recorded and the franchise admins are told', async () => {
        assert.equal((await fx.call('POST', '/v1/food/store/inventory/reorder', A.managerToken, { ingredientId, quantity: 0 })).status, 400);
        const out = ok(await fx.call('POST', '/v1/food/store/inventory/reorder', A.managerToken, { ingredientId, quantity: 10, note: 'Weekend rush' }), 201);
        assert.match(out.message || JSON.stringify(out), /Mozzarella/);
        const s = await mongoose.connection.collection('food_ingredient_shortages').findOne({ storeId: oid(A.storeId), ingredientId: oid(ingredientId) });
        assert.equal(s.shortageQty, 10);
        assert.ok(s.timeline.some((t) => t.action === 'admin_notified'));
        const told = await mongoose.connection.collection('food_task_notifications').countDocuments({ userId: oid(A.adminUserId) });
        assert.ok(told >= 1, 'franchise admin got the request');
    });
    test('kitchen staff and another store cannot', async () => {
        assert.equal((await fx.call('POST', '/v1/food/store/inventory/reorder', chef.token, { ingredientId, quantity: 5 })).status, 403);
        assert.equal((await fx.call('POST', '/v1/food/store/inventory/reorder', B.managerToken, { ingredientId, quantity: 5 })).status, 404);
    });
});

describe('delivery issue photo', () => {
    test('an uploaded photo link is kept and returned; anything that is not an https link is refused', async () => {
        const order = A.orderId;
        assert.equal((await fx.call('POST', '/v1/store/delivery/issues', A.managerToken, { orderId: order, issueType: 'Damaged', description: 'Box crushed', image: 'javascript:alert(1)' })).status, 400);
        const made = ok(await fx.call('POST', '/v1/store/delivery/issues', A.managerToken, { orderId: order, issueType: 'Damaged', description: 'Box crushed', image: 'https://res.cloudinary.com/demo/image/upload/box.jpg' }), 201);
        assert.equal(made.image, 'https://res.cloudinary.com/demo/image/upload/box.jpg');
        const list = ok(await fx.call('GET', '/v1/store/delivery/issues', A.managerToken));
        assert.equal(list.find((i) => i._id === made._id).image, 'https://res.cloudinary.com/demo/image/upload/box.jpg');
    });
});

describe('push for store notices', () => {
    test('notifyUsers sends a push to the person\'s saved devices (and keeps the in-app record)', async () => {
        const { notifyUsers } = await import('../src/modules/food/store/services/kitchenTasks.service.js');
        const fb = await import('../src/core/notifications/firebase.service.js');
        ok(await fx.call('POST', '/v1/fcm-tokens/save', baker.token, { token: 'baker-device-token-01' }));
        assert.deepEqual(await fb.listOwnerTokens({ ownerType: 'KITCHEN_STAFF', ownerId: baker.id }), ['baker-device-token-01']);
        await notifyUsers({ userIds: [baker.id], storeId: A.storeId, type: 'task_assigned', title: 'New Task Assigned', message: 'Pizza station' });
        assert.equal(await mongoose.connection.collection('food_task_notifications').countDocuments({ userId: oid(baker.id), title: 'New Task Assigned' }), 1);
    });
});
