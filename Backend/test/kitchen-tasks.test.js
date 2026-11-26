// Step 7: /v1/tasks (Kitchen Tasks), driven through the real order flow. Kitchen staff have no login
// (docs/kitchen-staff-removal.md): the manager accepts an order (no supervisor), assigns stations -> one task per station,
// for the staff record on it, and the manager runs those tasks (start, delay, complete, reassign) on the Kitchen Tasks board.
// Scope (store) always comes from the token: another store's tasks are 404; an old kitchen staff token is 403.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
let pizza; let pizza2; let baker; let bStaff;   // staff records: { id = staffId, name, token (old, refused) }
let orderNo = 0;
const MGR = () => ({ token: A.managerToken });
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
const board = async (token = A.managerToken) => (await fx.call('GET', '/v1/tasks', token)).body.data;
/** The manager does the real work at the pizza station for every pizza of the order (a station task completes only when it is done). */
const doPrep = async (o) => {
    const KS = '/v1/food/store/kitchen';
    const items = (await fx.call('GET', `${KS}/preparation-board`, A.managerToken)).body.data.filter((i) => i.orderNumber === o.ref);
    assert.ok(items.length, 'the order has pizzas on the board');
    for (const it of items) {
        assert.equal((await fx.call('PUT', `${KS}/pizza-station/start`, A.managerToken, { orderItemId: it._id })).status, 200);
        assert.equal((await fx.call('PUT', `${KS}/pizza-station/complete`, A.managerToken, { orderItemId: it._id })).status, 200);
    }
};
const taskOf = async (ref, token) => (await board(token)).find((t) => t.orderId === ref);

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    pizza = await fx.staff('A', 'Pizza Maker', 'pizza');
    pizza2 = await fx.staff('A', 'Pizza Maker', 'pizza2');
    baker = await fx.staff('A', 'Baker', 'baker');
    bStaff = await fx.staff('B', 'Pizza Maker', 'bstaff');
});
after(async () => { await fx?.teardown(); });

describe('authentication and roles', () => {
    for (const path of ['/v1/tasks', '/v1/tasks/stats', '/v1/tasks/team', '/v1/tasks/notifications']) {
        test(`GET ${path}: anonymous 401; customer, franchise admin, super admin and an old kitchen staff token 403`, async () => {
            assert.equal((await fx.call('GET', path)).status, 401);
            for (const token of [A.customerToken, A.adminToken, fx.SA, pizza.token]) assert.equal((await fx.call('GET', path, token)).status, 403);
            assert.equal((await fx.call('GET', path, A.managerToken)).status, 200);
        });
    }
});

describe('order flow creates tasks', () => {
    test('accepting an order makes no supervisor task: there is no task until the manager assigns a station', async () => {
        const o = await newOrder(A);
        const res = await accept(A, o);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(await taskOf(o.ref), undefined);
        assert.equal(await fx.models.FoodOrder.findById(o.id).lean().then((d) => d.kitchen.supervisor), undefined, 'no supervisor is stored');
        const { KitchenTask } = await import('../src/modules/food/store/models/kitchenTask.model.js');
        assert.equal(await KitchenTask.countDocuments({ orderId: new mongoose.Types.ObjectId(o.id) }), 0);
    });

    test('assigning a station makes one task for that station, for that staff record, on the manager\'s board', async () => {
        const o = await newOrder(A);
        await accept(A, o);
        assert.equal((await assign(A.managerToken, o, pizza, 'pizza_chef')).status, 200);
        const t = await taskOf(o.ref);
        assert.equal(t.taskType, 'prep');
        assert.equal(t.station, 'Pizza Station');
        assert.match(t.title, /^Prepare /);
        assert.match(t.title, /Margherita \(Medium\) x2/);
        assert.equal(t.priority, 'high');
        assert.equal(t.estimatedMinutes, 15);
        assert.equal(t.assignedBy, 'Manager A');
        assert.equal(t.assignedTo, pizza.name);
        assert.equal(t.assignedToId, pizza.id);
        assert.equal((await board(B.managerToken)).some((x) => x.orderId === o.ref), false, 'another store does not see it');
    });
});

describe('task actions (the store manager, for the person on the station)', () => {
    let o; let task;
    before(async () => {
        o = await newOrder(A); await accept(A, o); await assign(A.managerToken, o, pizza, 'pizza_chef');
        task = await taskOf(o.ref);
    });
    const act = (who, verb, body, id = task._id) => fx.call('PATCH', `/v1/tasks/${id}/${verb}`, who.token, body);

    test('another store\'s manager gets 404; an old kitchen staff token 403', async () => {
        assert.equal((await act({ token: B.managerToken }, 'start', {})).status, 404);
        assert.equal((await act(pizza, 'start', {})).status, 403);
    });
    test('a task cannot be completed before it is started (400)', async () => {
        assert.equal((await act(MGR(), 'complete', { notes: 'x' })).status, 400);
    });
    test('start -> in_progress with a start time; starting twice is refused', async () => {
        const res = await act(MGR(), 'start', { notes: 'on it' });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'in_progress');
        assert.ok(res.body.data.startedAt);
        assert.equal(res.body.data.notes, 'on it');
        assert.equal((await act(MGR(), 'start', {})).status, 400);
    });
    test('a delay needs a reason; it marks the task delayed', async () => {
        assert.equal((await act(MGR(), 'delay', { delayMinutes: 5 })).status, 400);
        const res = await act(MGR(), 'delay', { reason: 'Ingredient Shortage', delayMinutes: 7, remarks: 'out of basil' });
        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, 'delayed');
        assert.equal(res.body.data.delayReason, 'Ingredient Shortage');
        assert.equal(res.body.data.delayMinutes, 7);
    });
    test('stats (store-wide) reflect the delayed task', async () => {
        const s = (await fx.call('GET', '/v1/tasks/stats', A.managerToken)).body.data;
        assert.equal(s.delayedTasks, 1);
        assert.equal(s.avgCompletionTime, 'N/A');
        assert.equal(s.performanceScore, 'N/A');
        assert.equal((await fx.call('GET', '/v1/tasks/stats', B.managerToken)).body.data.delayedTasks, 0);
    });
    test('resume from delayed, then complete: only https proof links are stored (never a base64 preview)', async () => {
        assert.equal((await act(MGR(), 'start', {})).body.data.status, 'in_progress');
        assert.equal((await act(MGR(), 'complete', { notes: 'early' })).status, 400, 'not before the pizzas are made');
        await doPrep(o);
        const after = await taskOf(o.ref);
        assert.equal(after.status, 'completed', 'the station task completes itself when the station\'s work is done');
        assert.equal((await act(MGR(), 'complete', {})).status, 400, 'cannot complete twice');
    });
    test('stats count it as completed today', async () => {
        const s = (await fx.call('GET', '/v1/tasks/stats', A.managerToken)).body.data;
        assert.ok(s.completedToday >= 1);
        assert.notEqual(s.avgCompletionTime, 'N/A');
        assert.match(s.performanceScore, /%$/);
    });
    // N3: proof images must be ours (Cloudinary, our own cloud); anything else is dropped, never fetched by a browser.
    const proofFor = async (image) => {
        const o2 = await newOrder(A); await accept(A, o2); await assign(A.managerToken, o2, pizza, 'pizza_chef');
        const t2 = await taskOf(o2.ref);
        await act(MGR(), 'start', {}, t2._id);
        // the work done, but the task still open (as when the screen completes it with a photo)
        const { KitchenItem } = await import('../src/modules/food/store/models/kitchenItem.model.js');
        const { ensureItems } = await import('../src/modules/food/store/services/kitchenItems.service.js');
        await ensureItems([await fx.models.FoodOrder.findById(o2.id).lean()]);
        await KitchenItem.updateMany({ orderId: new mongoose.Types.ObjectId(o2.id) }, { $set: { stage: 'ready_for_baking', prepStartedAt: new Date(), assemblyCompletedAt: new Date() } });
        const res = await act(MGR(), 'complete', { image }, t2._id);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        return res.body.data.attachments;
    };
    test('a proof image from our own Cloudinary account is kept', async () => {
        const url = 'https://res.cloudinary.com/test/image/upload/v1/papa-veg/proof.jpg';
        assert.deepEqual(await proofFor(url), [url]);
    });
    test('any other link is dropped: other hosts, other Cloudinary accounts, http, look-alike hosts, credentials, base64', async () => {
        for (const bad of [
            'data:image/png;base64,AAAA',
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
        assert.equal((await act(MGR(), 'start', {}, 'not-an-id')).status, 404);
    });
});

describe('reassigning', () => {
    let o; let task;
    before(async () => {
        o = await newOrder(A); await accept(A, o); await assign(A.managerToken, o, pizza, 'pizza_chef');
        task = await taskOf(o.ref);
    });
    const reassign = (who, body, id = task._id) => fx.call('PATCH', `/v1/tasks/${id}/reassign`, who.token, body);

    test('an old kitchen staff token cannot reassign (403); another store\'s manager gets 404', async () => {
        assert.equal((await reassign(pizza, { assignedTo: baker.id })).status, 403);
        assert.equal((await reassign({ token: B.managerToken }, { assignedTo: baker.id })).status, 404);
    });
    test('the target must be active, clocked-in kitchen staff of this store', async () => {
        assert.equal((await reassign(MGR(), { assignedTo: A.managerUserId })).status, 400, 'not the manager');
        assert.equal((await reassign(MGR(), { assignedTo: bStaff.id })).status, 400, 'not another store\'s staff');
        assert.equal((await reassign(MGR(), { assignedTo: pizza.id })).status, 400, 'not the same person');
        assert.equal((await reassign(MGR(), {})).status, 400);
        const away = await fx.staff('A', 'Pizza Maker', 'away', { clockIn: false });
        assert.equal((await reassign(MGR(), { assignedTo: away.id })).status, 400, 'not clocked in');
    });
    test('the manager moves it by name; the order station slot follows', async () => {
        const res = await reassign(MGR(), { assignedTo: baker.name.toLowerCase(), reason: 'cover' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.assignedToId, baker.id);
        assert.equal(res.body.data.assignedTo, baker.name);
        const order = await fx.models.FoodOrder.findById(o.id).lean();
        assert.equal(String(order.kitchen.staff.pizza_chef.staffId), baker.id);
        assert.equal(order.kitchen.staff.pizza_chef.name, baker.name);
    });
    test('the manager moves the order along for the new person (kitchen stage); an old staff token cannot', async () => {
        assert.equal((await fx.call('PATCH', `/v1/food/store/orders/${o.id}/stage`, A.managerToken, { stage: 'preparing' })).status, 200);
        assert.equal((await fx.call('PATCH', `/v1/food/store/orders/${o.id}/stage`, baker.token, { stage: 'baking' })).status, 403);
    });
    test('the store manager can reassign any task in the store, by staff record id', async () => {
        const o2 = await newOrder(A); await accept(A, o2); await assign(A.managerToken, o2, pizza, 'pizza_chef');
        const t2 = await taskOf(o2.ref);
        assert.equal((await reassign(MGR(), { assignedTo: baker.id }, t2._id)).status, 200);
    });
    test('a legacy supervisor task (an order accepted before the role was removed) cannot be reassigned (400)', async () => {
        const o3 = await newOrder(A); await accept(A, o3); await assign(A.managerToken, o3, pizza, 'pizza_chef');
        const { KitchenTask } = await import('../src/modules/food/store/models/kitchenTask.model.js');
        const legacy = await KitchenTask.create({ storeId: new mongoose.Types.ObjectId(A.storeId), orderId: new mongoose.Types.ObjectId(o3.id), kind: 'supervisor', slot: null, assignedTo: new mongoose.Types.ObjectId(), status: 'pending' });
        assert.equal((await reassign(MGR(), { assignedTo: baker.id }, String(legacy._id))).status, 400);
    });
});

describe('team list used by the station screens (/v1/food/store/orders/team)', () => {
    const team = async (token, role) => (await fx.call('GET', `/v1/food/store/orders/team${role ? `?role=${role}` : ''}`, token)).body.data;
    test('role filters match what the baking / packaging screens ask for (staff record ids)', async () => {
        const bakers = await team(A.managerToken, 'baking_chef');
        assert.deepEqual(bakers.map((m) => m._id), [baker.id]);
        assert.deepEqual((await team(A.managerToken, 'packaging_staff')), []);
    });
    test('without a role it lists the store\'s kitchen staff (not the manager), only this store', async () => {
        const all = await team(A.managerToken);
        for (const s of [pizza, pizza2, baker]) assert.ok(all.some((m) => m._id === s.id), s.name);
        assert.ok(!all.some((m) => [bStaff.id, A.managerUserId, A.managerId].includes(m._id)));
        assert.equal((await fx.call('GET', '/v1/food/store/orders/team', pizza.token)).status, 403, 'an old kitchen staff token');
    });
});

describe('team overview', () => {
    test('the manager sees the store\'s kitchen staff and what each is on', async () => {
        const res = await fx.call('GET', '/v1/tasks/team', A.managerToken);
        assert.equal(res.status, 200);
        const d = res.body.data;
        assert.ok(Array.isArray(d.staffList));
        assert.equal(d.totalStaff, 4, 'four kitchen staff in store A');
        assert.ok(d.staffList.every((m) => m.name.startsWith('Name ')), 'only store A people');
        assert.ok(d.staffList.find((m) => m._id === baker.id).activeTasks >= 1);
    });
    test('store B\'s overview contains only store B people and tasks', async () => {
        const d = (await fx.call('GET', '/v1/tasks/team', B.managerToken)).body.data;
        assert.equal(d.totalStaff, 1);
        assert.equal(d.pendingTasks, 0);
        assert.ok(d.staffList.every((m) => m.name === bStaff.name));
    });
});

describe('notifications are private', () => {
    test('a manager\'s notification can be marked read only by its owner', async () => {
        const { notifyUsers } = await import('../src/modules/food/store/services/kitchenTasks.service.js');
        await notifyUsers({ userIds: [A.managerUserId], storeId: A.storeId, type: 'task_delayed', title: 'Task Delayed', message: 'test', push: false });
        const list = (await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data;
        const n = list.find((x) => !x.isRead);
        assert.ok(n);
        assert.equal((await fx.call('PATCH', `/v1/tasks/notifications/${n.id}/read`, B.managerToken)).status, 404);
        assert.equal((await fx.call('PATCH', `/v1/tasks/notifications/${n.id}/read`, A.managerToken)).status, 200);
        assert.equal((await fx.call('GET', '/v1/tasks/notifications', A.managerToken)).body.data.find((x) => x.id === n.id).isRead, true);
    });
    test('store B sees none of store A\'s tasks or notifications', async () => {
        assert.equal((await board(B.managerToken)).length, 0);
        assert.deepEqual((await fx.call('GET', '/v1/tasks/notifications', B.managerToken)).body.data, []);
    });
});
