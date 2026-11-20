// Step 7: /v1/tasks (My Tasks) for kitchen staff, driven through the real order flow:
// the manager accepts an order (no supervisor), then assigns stations -> one staff task per station.
// Scope (store, assignee) always comes from the token: other stores' and other people's tasks are 404.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
let pizza; let pizza2; let baker; let bStaff;   // { id, name, token }
let orderNo = 0;
const mgr = { token: null };
const newOrder = async (f) => {
    const ref = `KT${fx.ts}${orderNo++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId), franchiseId: new mongoose.Types.ObjectId(f.franchiseId),
        orderStatus: 'created', payment: { method: 'cash', status: 'cod_pending' }, pricing: { subtotal: 400, total: 400 },
        deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' }, customerPhone: f.phone,
        items: [{ itemId: 'item-1', name: 'Margherita', quantity: 2, size: 'Medium', price: 200 }], note: 'extra cheese', createdAt: new Date(), updatedAt: new Date(),
    });
    return { id: String(r.insertedId), ref };
};
const accept = (f, order) => fx.call('PATCH', `/v1/food/store/orders/${order.id}/accept`, f.managerToken, { estimatedPreparationTime: 15, priority: 'urgent' });
const assign = (token, order, staff, slot) => fx.call('PATCH', `/v1/food/store/orders/${order.id}/assign-staff`, token, { staffId: staff.id, role: slot });
const mine = async (who) => (await fx.call('GET', '/v1/tasks', who.token)).body.data;
/** Does the real work at the pizza station for every pizza of the order (a station task completes only when it is done). */
const doPrep = async (who, o) => {
    const KS = '/v1/food/store/kitchen';
    const items = (await fx.call('GET', `${KS}/preparation-board`, A.managerToken)).body.data.filter((i) => i.orderNumber === o.ref);
    assert.ok(items.length, 'the order has pizzas on the board');
    for (const it of items) {
        assert.equal((await fx.call('PUT', `${KS}/pizza-station/start`, who.token, { orderItemId: it._id })).status, 200);
        assert.equal((await fx.call('PUT', `${KS}/pizza-station/complete`, who.token, { orderItemId: it._id })).status, 200);
    }
};
const taskOf = async (who, ref) => (await mine(who)).find((t) => t.orderId === ref);

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B; mgr.token = A.managerToken;
    pizza = await fx.staff('A', 'Pizza Maker', 'pizza');
    pizza2 = await fx.staff('A', 'Pizza Maker', 'pizza2');
    baker = await fx.staff('A', 'Baker', 'baker');
    bStaff = await fx.staff('B', 'Pizza Maker', 'bstaff');
});
after(async () => { await fx?.teardown(); });

describe('authentication and roles', () => {
    for (const path of ['/v1/tasks', '/v1/tasks/stats', '/v1/tasks/team', '/v1/tasks/notifications']) {
        test(`GET ${path}: anonymous 401; customer, franchise admin and super admin 403`, async () => {
            assert.equal((await fx.call('GET', path)).status, 401);
            for (const token of [A.customerToken, A.adminToken, fx.SA]) assert.equal((await fx.call('GET', path, token)).status, 403);
        });
    }
});

describe('order flow creates tasks', () => {
    test('accepting an order makes no supervisor task: nobody has work until the manager assigns a station', async () => {
        const o = await newOrder(A);
        const res = await accept(A, o);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        for (const who of [pizza, pizza2, baker]) assert.equal(await taskOf(who, o.ref), undefined);
        assert.equal(await fx.models.FoodOrder.findById(o.id).lean().then((d) => d.kitchen.supervisor), undefined, 'no supervisor is stored');
        const { KitchenTask } = await import('../src/modules/food/store/models/kitchenTask.model.js');
        assert.equal(await KitchenTask.countDocuments({ orderId: new mongoose.Types.ObjectId(o.id) }), 0);
    });

    test('assigning a station gives that person a task for that station only', async () => {
        const o = await newOrder(A);
        await accept(A, o);
        assert.equal((await assign(A.managerToken, o, pizza, 'pizza_chef')).status, 200);
        const t = await taskOf(pizza, o.ref);
        assert.equal(t.taskType, 'prep');
        assert.equal(t.station, 'Pizza Station');
        assert.match(t.title, /^Prepare /);
        assert.match(t.title, /Margherita \(Medium\) x2/);
        assert.equal(t.priority, 'high');
        assert.equal(t.estimatedMinutes, 15);
        assert.equal(t.assignedBy, 'Manager A');
        assert.equal(await taskOf(baker, o.ref), undefined, 'others do not see it');
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', pizza.token)).body.data.some((n) => n.type === 'task_assigned'));
    });
});

describe('task actions (assignee only)', () => {
    let o; let task;
    before(async () => {
        o = await newOrder(A); await accept(A, o); await assign(A.managerToken, o, pizza, 'pizza_chef');
        task = await taskOf(pizza, o.ref);
    });
    const act = (who, verb, body, id = task._id) => fx.call('PATCH', `/v1/tasks/${id}/${verb}`, who.token, body);

    test('nobody but the assignee can act on it: other staff and another store all get 404', async () => {
        for (const who of [baker, pizza2, bStaff]) assert.equal((await act(who, 'start', {})).status, 404, who.id);
        assert.equal((await act({ token: A.managerToken }, 'start', {})).status, 404);
    });
    test('a task cannot be completed before it is started (400)', async () => {
        assert.equal((await act(pizza, 'complete', { notes: 'x' })).status, 400);
    });
    test('start -> in_progress with a start time; starting twice is refused', async () => {
        const res = await act(pizza, 'start', { notes: 'on it' });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'in_progress');
        assert.ok(res.body.data.startedAt);
        assert.equal(res.body.data.notes, 'on it');
        assert.equal((await act(pizza, 'start', {})).status, 400);
    });
    test('a delay needs a reason; it marks the task delayed and tells the manager', async () => {
        assert.equal((await act(pizza, 'delay', { delayMinutes: 5 })).status, 400);
        const res = await act(pizza, 'delay', { reason: 'Ingredient Shortage', delayMinutes: 7, remarks: 'out of basil' });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'delayed');
        assert.equal(res.body.data.delayReason, 'Ingredient Shortage');
        assert.equal(res.body.data.delayMinutes, 7);
        const mgrNotes = (await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data;
        assert.ok(mgrNotes.some((n) => n.type === 'task_delayed' && /Ingredient Shortage/.test(n.message)));
    });
    test('stats reflect the delayed task', async () => {
        const s = (await fx.call('GET', '/v1/tasks/stats', pizza.token)).body.data;
        assert.equal(s.delayedTasks, 1);
        assert.equal(s.avgCompletionTime, 'N/A');
        assert.equal(s.performanceScore, 'N/A');
    });
    test('a handoff request is flagged and the manager is told', async () => {
        const res = await act(pizza, 'request-reassign', { reason: 'Feeling unwell', preferredStaff: baker.name });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.reassignRequested, true);
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data.some((n) => n.type === 'reassign_requested'));
    });
    test('resume from delayed, then complete: only https proof links are stored (never a base64 preview)', async () => {
        assert.equal((await act(pizza, 'start', {})).body.data.status, 'in_progress');
        assert.equal((await act(pizza, 'complete', { notes: 'early' })).status, 400, 'not before the pizzas are made');
        await doPrep(pizza, o);
        const bad = await act(pizza, 'complete', { notes: 'done', image: 'data:image/png;base64,AAAA' });
        assert.equal(bad.status, 200);
        assert.deepEqual(bad.body.data.attachments, []);
        assert.equal(bad.body.data.status, 'completed');
        assert.ok(bad.body.data.completedAt);
        assert.equal((await act(pizza, 'complete', {})).status, 400, 'cannot complete twice');
    });
    test('stats count it as completed today', async () => {
        const s = (await fx.call('GET', '/v1/tasks/stats', pizza.token)).body.data;
        assert.equal(s.completedToday, 1);
        assert.notEqual(s.avgCompletionTime, 'N/A');
        assert.match(s.performanceScore, /%$/);
    });
    // N3: proof images must be ours (Cloudinary, our own cloud); anything else is dropped, never fetched by a browser.
    const proofFor = async (image) => {
        const o2 = await newOrder(A); await accept(A, o2); await assign(A.managerToken, o2, pizza, 'pizza_chef');
        const t2 = await taskOf(pizza, o2.ref);
        await act(pizza, 'start', {}, t2._id);
        await doPrep(pizza, o2);
        const res = await act(pizza, 'complete', { image }, t2._id);
        assert.equal(res.status, 200);
        return res.body.data.attachments;
    };
    test('a proof image from our own Cloudinary account is kept', async () => {
        const url = 'https://res.cloudinary.com/test/image/upload/v1/papa-veg/proof.jpg';
        assert.deepEqual(await proofFor(url), [url]);
    });
    test('any other link is dropped: other hosts, other Cloudinary accounts, http, look-alike hosts, credentials', async () => {
        for (const bad of [
            'https://example.com/proof.jpg',
            'https://res.cloudinary.com/someone-else/image/upload/v1/x.jpg',
            'http://res.cloudinary.com/test/image/upload/v1/x.jpg',
            'https://res.cloudinary.com.evil.example/test/image/upload/v1/x.jpg',
            'https://evil.example/res.cloudinary.com/test/image/upload/x.jpg',
            'https://user:pass@res.cloudinary.com/test/image/upload/v1/x.jpg',
            'https://res.cloudinary.com/test/raw/upload/v1/x.html',
            'https://res.cloudinary.com/test/image/uploadx/v1/x.jpg',
        ]) assert.deepEqual(await proofFor(bad), [], bad);
    });
    test('malformed ids are 404, not a 500', async () => {
        assert.equal((await act(pizza, 'start', {}, 'not-an-id')).status, 404);
    });
});

describe('reassigning', () => {
    let o; let task;
    before(async () => {
        o = await newOrder(A); await accept(A, o); await assign(A.managerToken, o, pizza, 'pizza_chef');
        task = await taskOf(pizza, o.ref);
    });
    const reassign = (who, body, id = task._id) => fx.call('PATCH', `/v1/tasks/${id}/reassign`, who.token, body);

    test('kitchen staff cannot reassign (403)', async () => {
        assert.equal((await reassign(pizza, { assignedTo: baker.id })).status, 403);
    });
    test('other kitchen staff, and another store\'s manager, cannot reassign (403 / 404)', async () => {
        assert.equal((await reassign(pizza2, { assignedTo: baker.id })).status, 403);
        assert.equal((await reassign({ token: B.managerToken }, { assignedTo: baker.id })).status, 404);
    });
    test('the target must be active kitchen staff of this store', async () => {
        assert.equal((await reassign(mgr, { assignedTo: A.managerUserId })).status, 400, 'not the manager');
        assert.equal((await reassign(mgr, { assignedTo: bStaff.id })).status, 400, 'not another store\'s staff');
        assert.equal((await reassign(mgr, { assignedTo: pizza.id })).status, 400, 'not the same person');
        assert.equal((await reassign(mgr, {})).status, 400);
    });
    test('the manager moves it by name; the order station slot follows and both people are told', async () => {
        const res = await reassign(mgr, { assignedTo: baker.name.toLowerCase(), reason: 'cover' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.assignedToId, baker.id);
        assert.equal(await taskOf(pizza, o.ref), undefined);
        assert.ok(await taskOf(baker, o.ref));
        const order = await fx.models.FoodOrder.findById(o.id).lean();
        assert.equal(String(order.kitchen.staff.pizza_chef.userId), baker.id);
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', baker.token)).body.data.some((n) => n.type === 'task_reassigned'));
        assert.ok((await fx.call('GET', '/v1/tasks/notifications', pizza.token)).body.data.some((n) => n.type === 'task_reassigned'));
    });
    test('the new person can now move the order along (kitchen stage), the old one cannot', async () => {
        assert.equal((await fx.call('PATCH', `/v1/food/store/orders/${o.id}/stage`, baker.token, { stage: 'preparing' })).status, 200);
        assert.equal((await fx.call('PATCH', `/v1/food/store/orders/${o.id}/stage`, pizza.token, { stage: 'baking' })).status, 403);
    });
    test('the store manager can reassign any task in the store', async () => {
        const o2 = await newOrder(A); await accept(A, o2); await assign(A.managerToken, o2, pizza, 'pizza_chef');
        const t2 = await taskOf(pizza, o2.ref);
        assert.equal((await reassign({ token: A.managerToken }, { assignedTo: baker.id }, t2._id)).status, 200);
    });
    test('a legacy supervisor task (an order accepted before the role was removed) cannot be reassigned (400)', async () => {
        const o3 = await newOrder(A); await accept(A, o3); await assign(A.managerToken, o3, pizza, 'pizza_chef');
        const { KitchenTask } = await import('../src/modules/food/store/models/kitchenTask.model.js');
        const legacy = await KitchenTask.create({ storeId: new mongoose.Types.ObjectId(A.storeId), orderId: new mongoose.Types.ObjectId(o3.id), kind: 'supervisor', slot: null, assignedTo: new mongoose.Types.ObjectId(pizza.id), status: 'pending' });
        assert.equal((await reassign({ token: A.managerToken }, { assignedTo: baker.id }, String(legacy._id))).status, 400);
    });
});

describe('team list used by the station screens (/v1/food/store/orders/team)', () => {
    const team = async (token, role) => (await fx.call('GET', `/v1/food/store/orders/team${role ? `?role=${role}` : ''}`, token)).body.data;
    test('role filters match what the baking / packaging screens ask for', async () => {
        const bakers = await team(A.managerToken, 'baking_chef');
        assert.deepEqual(bakers.map((m) => m._id), [baker.id]);
        assert.deepEqual((await team(A.managerToken, 'packaging_staff')), []);
    });
    test('without a role it lists the store\'s kitchen staff (not the manager), only this store', async () => {
        const all = await team(pizza.token);
        assert.deepEqual(all.map((m) => m._id).sort(), [pizza.id, pizza2.id, baker.id].sort());
        assert.ok(!all.some((m) => [bStaff.id, A.managerUserId].includes(m._id)));
    });
});

describe('team overview', () => {
    test('kitchen staff cannot see it (403); the manager can', async () => {
        assert.equal((await fx.call('GET', '/v1/tasks/team', pizza.token)).status, 403);
        const res = await fx.call('GET', '/v1/tasks/team', A.managerToken);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.ok(Array.isArray(d.staffList));
        assert.equal(d.totalStaff, 3, 'three kitchen staff in store A');
        assert.ok(d.staffList.every((m) => m.name.startsWith('Name ')), 'only store A people');
    });
    test('store B\'s overview contains only store B people and tasks', async () => {
        const d = (await fx.call('GET', '/v1/tasks/team', B.managerToken)).body.data;
        assert.equal(d.totalStaff, 1);
        assert.equal(d.pendingTasks, 0);
        assert.ok(d.staffList.every((m) => m.name === bStaff.name));
    });
});

describe('notifications are private', () => {
    test('a notification can be marked read only by its owner', async () => {
        const list = (await fx.call('GET', '/v1/tasks/notifications', pizza.token)).body.data;
        const n = list.find((x) => !x.isRead);
        assert.ok(n);
        assert.equal((await fx.call('PATCH', `/v1/tasks/notifications/${n.id}/read`, baker.token)).status, 404);
        assert.equal((await fx.call('PATCH', `/v1/tasks/notifications/${n.id}/read`, bStaff.token)).status, 404);
        assert.equal((await fx.call('PATCH', `/v1/tasks/notifications/${n.id}/read`, pizza.token)).status, 200);
        assert.equal((await fx.call('GET', '/v1/tasks/notifications', pizza.token)).body.data.find((x) => x.id === n.id).isRead, true);
    });
    test('store B people see none of store A\'s tasks or notifications', async () => {
        assert.deepEqual(await mine(bStaff), []);
        assert.deepEqual((await fx.call('GET', '/v1/tasks/notifications', bStaff.token)).body.data, []);
    });
});
