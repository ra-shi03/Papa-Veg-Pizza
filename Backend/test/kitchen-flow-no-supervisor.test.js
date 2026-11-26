// The kitchen flow without a kitchen supervisor (client decision, docs/supervisor-removal.md), and since 2026-11-26 without
// kitchen staff logins (docs/kitchen-staff-removal.md):
//   manager accepts -> manager assigns kitchen staff (staff records) to stations -> the manager moves each station's work
//   along and does the quality check and marks ready, for the person on the station -> rider.
// Orders accepted earlier with a supervisor keep working; the stored supervisor is information only, never a permission.
// The supervisor role is deactivated (never deleted): those accounts cannot sign in and nobody can create one.
// Another store or franchise gets 404; a role the route is not for gets 403.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';
// loaded after the fixture (the app must not read its config before the test database is set)
let deactivateSupervisors; let SUPERVISOR_RETIRED_MESSAGE;

let fx; let A; let B;
let chef; let baker; let packer; let spare; let idle; let bStaff; let A2;   // spare: clocked in, on no order   // A2: a second store of franchise A
let seq = 0;

const O = '/v1/food/store/orders';
const K = '/v1/food/store/kitchen';
const newOrder = async (f, extra = {}) => {
    const ref = `NS${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
        franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: 'created', payment: { method: 'cash', status: 'cod_pending' },
        pricing: { subtotal: 400, total: 400 }, deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' },
        customerName: 'Test Customer', customerPhone: f.phone, items: [{ itemId: 'i1', name: 'Margherita', quantity: 1, size: 'Medium', price: 400 }],
        statusHistory: [{ at: new Date(), byRole: 'SYSTEM', from: '', to: 'created', note: 'Order placed' }],
        createdAt: new Date(), updatedAt: new Date(), ...extra,
    });
    return { id: String(r.insertedId), ref };
};
const accept = (token, o, body = {}) => fx.call('PATCH', `${O}/${o.id}/accept`, token, { estimatedPreparationTime: 15, ...body });
const assign = (token, o, who, role) => fx.call('PATCH', `${O}/${o.id}/assign-staff`, token, { staffId: who.id, role });
const stage = (token, o, s) => fx.call('PATCH', `${O}/${o.id}/stage`, token, { stage: s });
const dbOrder = (o) => fx.models.FoodOrder.findById(o.id).lean();
const msg = (res) => res.body.message || res.body.error;   // the error handler answers { success: false, error }

/** Accepted by A's manager, with chef / baker / packer on their stations. */
const staffedOrder = async () => {
    const o = await newOrder(A);
    assert.equal((await accept(A.managerToken, o)).status, 200);
    for (const [who, slot] of [[chef, 'pizza_chef'], [baker, 'baking_chef'], [packer, 'packaging_staff']]) {
        const r = await assign(A.managerToken, o, who, slot);
        assert.equal(r.status, 200, JSON.stringify(r.body));
    }
    return o;
};

/** A second approved store in franchise A, with its own signed-in manager (the same way the fixture builds one). */
const secondStore = async () => {
    const st = await fx.call('POST', '/v1/stores', A.adminToken, {
        storeName: 'TEST STORE A2', storeCode: `TSA2${fx.ts}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999943', email: `store-a2${fx.ts}@example.invalid`,
        address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active',
    });
    assert.equal(st.status, 201, JSON.stringify(st.body));
    const storeId = st.body.data._id;
    assert.equal((await fx.call('PATCH', `/v1/store-approvals/${storeId}/approve`, fx.SA, {})).status, 200);
    const email = `mgr-a2${fx.ts}@example.invalid`;
    const mc = await fx.api.post('/api/v1/store-managers').set(fx.bearer(A.adminToken))
        .field('name', 'Manager A2').field('email', email).field('phone', `543${String(fx.ts).slice(-8)}`)
        .field('employeeCode', `EMA2${fx.ts}`).field('storeId', storeId).field('password', PASSWORD).field('status', 'Active').field('salary', '1000');
    assert.equal(mc.status, 201, JSON.stringify(mc.body));
    const login = await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD });
    assert.equal(login.status, 200);
    // like every store manager, A2's marks attendance before working (otherwise every write is refused before the 404 check)
    assert.equal((await fx.call('POST', '/v1/store/attendance/clock-in', login.body.data.accessToken)).status, 201);
    return { storeId, managerToken: login.body.data.accessToken };
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    ({ deactivateSupervisors } = await import('../scripts/deactivate-supervisors.js'));
    ({ SUPERVISOR_RETIRED_MESSAGE } = await import('../src/core/auth/auth.service.js'));
    chef = await fx.staff('A', 'Pizza Maker', 'nschef');
    baker = await fx.staff('A', 'Baker', 'nsbaker');
    packer = await fx.staff('A', 'Packager', 'nspacker');
    spare = await fx.staff('A', 'Pizza Maker', 'nsspare');
    idle = await fx.staff('A', 'Pizza Maker', 'nsidle', { clockIn: false });   // approved, but has not clocked in
    bStaff = await fx.staff('B', 'Pizza Maker', 'nsbstaff');
    A2 = await secondStore();
});
after(async () => { await fx?.teardown(); });

describe('accept and assign', () => {
    test('the manager accepts without a supervisor; no supervisor is stored and a sent supervisor id is ignored', async () => {
        const o = await newOrder(A);
        const res = await accept(A.managerToken, o, { kitchenSupervisorId: chef.id, priority: 'urgent' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const doc = await dbOrder(o);
        assert.equal(doc.orderStatus, 'confirmed');
        assert.equal(doc.kitchen.supervisor, undefined);
        assert.equal(doc.kitchen.priority, 'urgent');
        assert.equal(doc.kitchen.staff?.pizza_chef?.userId, undefined, 'nobody is put on a station by accepting');
    });
    test('only the manager accepts: kitchen staff 403', async () => {
        const o = await newOrder(A);
        assert.equal((await accept(chef.token, o)).status, 403);
    });
    test('the manager assigns staff to stations; each assignee gets a task for that station', async () => {
        const o = await staffedOrder();
        const doc = await dbOrder(o);
        assert.equal(String(doc.kitchen.staff.pizza_chef.staffId), chef.id);
        assert.equal(String(doc.kitchen.staff.baking_chef.staffId), baker.id);
        assert.equal(String(doc.kitchen.staff.packaging_staff.staffId), packer.id);
        const tasks = (await fx.call('GET', '/v1/tasks', A.managerToken)).body.data;
        assert.ok(tasks.some((t) => t.orderId === o.ref && t.taskType === 'pack' && t.assignedToId === packer.id));
    });
    test('an old kitchen staff token cannot assign anyone (403)', async () => {
        const o = await staffedOrder();
        assert.equal((await assign(chef.token, o, baker, 'pizza_chef')).status, 403, 'station holder');
        assert.equal((await assign(spare.token, o, chef, 'baking_chef')).status, 403, 'not on the order');
        assert.equal((await fx.call('PUT', `${K}/orders/${o.id}/assign-chef`, chef.token, { chefId: baker.id })).status, 403);
        assert.equal((await fx.call('PUT', `${K}/orders/${o.id}/reassign`, chef.token, { staffId: baker.id })).status, 403);
    });
    test('a staff member who has not clocked in cannot be assigned (400); neither can the manager or another store\'s staff', async () => {
        const o = await newOrder(A);
        await accept(A.managerToken, o);
        const res = await assign(A.managerToken, o, idle, 'pizza_chef');
        assert.equal(res.status, 400);
        assert.match(msg(res), /not present today/);
        assert.equal((await assign(A.managerToken, o, { id: A.managerUserId }, 'pizza_chef')).status, 400, 'the manager is not kitchen staff');
        assert.equal((await assign(A.managerToken, o, bStaff, 'pizza_chef')).status, 400, 'another franchise\'s staff');
        assert.equal((await dbOrder(o)).kitchen.staff?.pizza_chef?.userId, undefined);
    });
    test('the manager opens the order; old kitchen staff tokens cannot (403)', async () => {
        const o = await staffedOrder();
        const seen = async (who) => fx.call('GET', `${O}/${o.id}`, who.token);
        assert.equal((await seen({ token: A.managerToken })).status, 200);
        for (const who of [chef, packer, spare]) assert.equal((await seen(who)).status, 403);
    });
});

describe('quality check and mark ready', () => {
    test('the manager moves it along and marks it ready for the packer', async () => {
        const o = await staffedOrder();
        assert.equal((await stage(A.managerToken, o, 'preparing')).status, 200);
        const res = await stage(A.managerToken, o, 'ready');
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const doc = await dbOrder(o);
        assert.equal(doc.kitchen.stage, 'ready');
        assert.equal(doc.orderStatus, 'ready_for_pickup');
    });
    test('old kitchen staff tokens cannot mark it ready (403), and nothing changes', async () => {
        const o = await staffedOrder();
        assert.equal((await stage(A.managerToken, o, 'preparing')).status, 200);
        assert.equal((await stage(chef.token, o, 'ready')).status, 403, 'chef');
        assert.equal((await stage(baker.token, o, 'ready')).status, 403, 'baker');
        assert.equal((await stage(spare.token, o, 'ready')).status, 403, 'not on the order');
        assert.equal((await dbOrder(o)).orderStatus, 'preparing');
    });
    test('the manager can override and mark it ready, even with no packer assigned', async () => {
        const o = await newOrder(A);
        await accept(A.managerToken, o);
        assert.equal((await stage(A.managerToken, o, 'preparing')).status, 200);
        const res = await stage(A.managerToken, o, 'ready');
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal((await dbOrder(o)).orderStatus, 'ready_for_pickup');
    });
    test('quality check: the manager; old kitchen staff tokens may not (403)', async () => {
        const o = await staffedOrder();
        const qc = (who, rating) => fx.call('POST', `${K}/quality-checks`, who.token, { orderId: o.ref, rating });
        assert.equal((await qc(chef, 4)).status, 403);
        assert.equal((await qc(baker, 4)).status, 403);
        assert.equal((await qc(spare, 4)).status, 403);
        assert.equal((await qc(packer, 5)).status, 403);
        assert.equal((await qc({ token: A.managerToken }, 5)).status, 201);
    });
});

describe('priority, pause and delay', () => {
    const calls = (token, o) => [
        fx.call('PATCH', `${O}/${o.id}/priority`, token, { priority: 'urgent' }),
        fx.call('PATCH', `${O}/${o.id}/pause`, token, { isPaused: true, reason: 'Oven' }),
        fx.call('PATCH', `${O}/${o.id}/delay`, token, { minutes: 5, reason: 'Rush' }),
    ];
    test('the manager may; old kitchen staff tokens (on the order or not) may not (403)', async () => {
        const o = await staffedOrder();
        for (const r of await Promise.all(calls(A.managerToken, o))) assert.equal(r.status, 200, JSON.stringify(r.body));
        for (const who of [chef, baker, packer, spare]) for (const r of await Promise.all(calls(who.token, o))) assert.equal(r.status, 403, who.name);
    });
});

describe('another store, another franchise', () => {
    test('every changed route answers 404 for another store of the same franchise and for another franchise', async () => {
        const o = await staffedOrder();
        const fresh = await newOrder(A);
        for (const token of [A2.managerToken, B.managerToken]) {
            assert.equal((await accept(token, fresh)).status, 404, 'accept');
            assert.equal((await assign(token, o, chef, 'pizza_chef')).status, 404, 'assign-staff');
            assert.equal((await stage(token, o, 'ready')).status, 404, 'stage');
            assert.equal((await fx.call('PATCH', `${O}/${o.id}/priority`, token, { priority: 'urgent' })).status, 404, 'priority');
            assert.equal((await fx.call('PATCH', `${O}/${o.id}/pause`, token, { isPaused: true })).status, 404, 'pause');
            assert.equal((await fx.call('PATCH', `${O}/${o.id}/delay`, token, { minutes: 5 })).status, 404, 'delay');
            assert.equal((await fx.call('GET', `${O}/${o.id}`, token)).status, 404, 'read');
            assert.equal((await fx.call('POST', `${K}/quality-checks`, token, { orderId: o.ref, rating: 4 })).status, 404, 'quality check');
            assert.equal((await fx.call('PUT', `${K}/orders/${o.id}/ready`, token, {})).status, 404, 'packaging ready');
        }
        for (const s of ['pizza_chef', 'baking_chef', 'packaging_staff']) assert.equal(String((await dbOrder(o)).kitchen.staff[s].staffId), { pizza_chef: chef, baking_chef: baker, packaging_staff: packer }[s].id);
        assert.equal((await dbOrder(fresh)).orderStatus, 'created');
    });
    test('another franchise\'s old kitchen staff token is refused on A\'s order (403)', async () => {
        const o = await staffedOrder();
        assert.equal((await fx.call('GET', `${O}/${o.id}`, bStaff.token)).status, 403);
        assert.equal((await fx.call('PATCH', `${O}/${o.id}/priority`, bStaff.token, { priority: 'urgent' })).status, 403);
    });
    test('customers, franchise admins and the super admin are refused (403)', async () => {
        const o = await staffedOrder();
        for (const token of [A.customerToken, A.adminToken, fx.SA]) {
            assert.equal((await assign(token, o, chef, 'pizza_chef')).status, 403);
            assert.equal((await stage(token, o, 'ready')).status, 403);
        }
    });
});

describe('orders accepted with a supervisor (before the role was removed)', () => {
    let sup; let o;
    before(async () => {
        sup = await fx.legacySupervisor('A', 'nslegacy');
        o = await newOrder(A, {
            orderStatus: 'confirmed',
            kitchen: { stage: 'pending', priority: 'normal', supervisor: { userId: new mongoose.Types.ObjectId(sup.userId), name: sup.name }, staff: {} },
        });
    });
    test('the stored supervisor is kept, and the manager runs the order as usual', async () => {
        for (const [who, slot] of [[chef, 'pizza_chef'], [packer, 'packaging_staff']]) assert.equal((await assign(A.managerToken, o, who, slot)).status, 200);
        assert.equal((await stage(A.managerToken, o, 'preparing')).status, 200);
        assert.equal((await fx.call('PATCH', `${O}/${o.id}/priority`, A.managerToken, { priority: 'urgent' })).status, 200);
        const view = (await fx.call('GET', `${O}/${o.id}`, A.managerToken)).body.data;
        assert.equal(view.kitchenSupervisor?.name || view.kitchenSupervisor, sup.name, 'shown as information');
    });
    test('the stored supervisor gives no permission: their old token is refused everywhere (403)', async () => {
        assert.equal((await fx.call('GET', `${O}/${o.id}`, sup.token)).status, 403);
        assert.equal((await stage(sup.token, o, 'ready')).status, 403);
        assert.equal((await assign(sup.token, o, chef, 'baking_chef')).status, 403);
        assert.equal((await fx.call('PATCH', `${O}/${o.id}/priority`, sup.token, { priority: 'normal' })).status, 403);
        assert.equal((await fx.call('GET', `${K}/queue`, sup.token)).status, 403);
        assert.equal((await fx.call('GET', '/v1/tasks', sup.token)).status, 403);
        assert.equal((await fx.call('GET', '/v1/store/dashboard/today-orders', sup.token)).status, 403);
    });
    test('the manager marks it ready and the order leaves the kitchen', async () => {
        assert.equal((await stage(A.managerToken, o, 'ready')).status, 200);
        const doc = await dbOrder(o);
        assert.equal(doc.orderStatus, 'ready_for_pickup');
        assert.equal(String(doc.kitchen.supervisor.userId), sup.userId, 'still recorded');
    });
});

describe('the supervisor role is deactivated, not deleted', () => {
    let sup;
    before(async () => { sup = await fx.legacySupervisor('A', 'nsdeact'); });

    test('a supervisor account cannot sign in, with a clear message (only once the password is right)', async () => {
        const res = await fx.call('POST', '/v1/auth/store/login', null, { email: sup.email, password: PASSWORD });
        assert.equal(res.status, 401);
        assert.equal(msg(res), SUPERVISOR_RETIRED_MESSAGE);
        const wrong = await fx.call('POST', '/v1/auth/store/login', null, { email: sup.email, password: 'Wrong#Pass-123' });
        assert.equal(wrong.status, 401);
        assert.notEqual(msg(wrong), SUPERVISOR_RETIRED_MESSAGE);
    });
    test('the migration: dry run writes nothing; --apply deactivates, suspends and revokes; records are kept', async () => {
        const uid = new mongoose.Types.ObjectId(sup.userId);
        // an open session from before the change (the account can no longer sign in to make one)
        await fx.models.RefreshToken.create({ userId: uid, tokenHash: `legacy-${fx.ts}`, familyId: `legacy-${fx.ts}`, expiresAt: new Date(Date.now() + 86400000) });
        const dry = await deactivateSupervisors();
        assert.equal(dry.applied, false);
        assert.ok(dry.supervisorAccounts >= 1 && dry.usersToDeactivate >= 1 && dry.staffRecordsToSuspend >= 1 && dry.sessionsToRevoke >= 1, JSON.stringify(dry));
        assert.equal((await fx.models.User.findById(uid).lean()).isActive, true, 'dry run changed nothing');

        const done = await deactivateSupervisors({ apply: true });
        assert.equal(done.applied, true);
        assert.ok(done.usersDeactivated >= 1 && done.staffRecordsSuspended >= 1 && done.sessionsRevoked >= 1, JSON.stringify(done));
        const user = await fx.models.User.findById(uid).lean();
        assert.ok(user, 'the user is kept');
        assert.equal(user.isActive, false);
        const rec = await fx.models.StoreManager.findById(sup.staffId).lean();
        assert.equal(rec.status, 'Suspended');
        assert.equal(await fx.models.RefreshToken.countDocuments({ userId: uid, revoked: false }), 0);
        assert.ok(await fx.models.UserRole.countDocuments({ userId: uid }) >= 1, 'the role link is kept');
        // kitchen staff records are untouched
        assert.equal((await fx.models.StoreManager.findById(chef.staffId).lean()).status, 'Active');

        const again = await deactivateSupervisors({ apply: true });
        assert.equal(again.usersDeactivated, 0, 'running it twice changes nothing more');
    });
    test('after the migration the sign-in still says why', async () => {
        const res = await fx.call('POST', '/v1/auth/store/login', null, { email: sup.email, password: PASSWORD });
        assert.equal(res.status, 401);
        assert.equal(msg(res), SUPERVISOR_RETIRED_MESSAGE);
    });
    test('the store manager cannot switch the deactivated record back on', async () => {
        for (const path of [`/v1/food/store/staff/${sup.staffId}`, `/v1/food/store/staff/${sup.staffId}/status`]) {
            const res = await fx.call('PATCH', path, A.managerToken, { status: 'Active' });
            assert.equal(res.status, 400, `${path} ${JSON.stringify(res.body)}`);
        }
        assert.equal((await fx.models.User.findById(sup.userId).lean()).isActive, false);
        assert.equal((await fx.models.StoreManager.findById(sup.staffId).lean()).status, 'Suspended');
    });
});

describe('nobody can create or approve a kitchen supervisor', () => {
    const payload = (tag, role) => ({ fullName: `X ${tag}`, email: `${tag}${fx.ts}@example.invalid`, phone: `64${String(seq++).padStart(2, '0')}${String(fx.ts).slice(-6)}`, password: PASSWORD, role });
    test('store manager staff creation rejects the supervisor role (400) and creates nothing', async () => {
        for (const role of ['Kitchen Supervisor', 'kitchen supervisor']) {
            const res = await fx.call('POST', '/v1/food/store/staff', A.managerToken, payload(`nsnew${seq}`, role));
            assert.equal(res.status, 400, JSON.stringify(res.body));
            assert.match(msg(res), /no longer used/);
        }
        assert.equal(await fx.models.User.countDocuments({ email: new RegExp(`^nsnew.*${fx.ts}`) }), 0);
    });
    test('editing a staff member into a supervisor is refused (400)', async () => {
        const res = await fx.call('PATCH', `/v1/food/store/staff/${chef.staffId}`, A.managerToken, { role: 'Kitchen Supervisor' });
        assert.equal(res.status, 400);
    });
    test('the admin staff API gives the store manager no roles to create (403 for the supervisor role)', async () => {
        const res = await fx.call('POST', '/v1/food/admin/staff', A.managerToken, { email: `nsadm${fx.ts}@example.invalid`, phone: '6400000099', role: 'kitchen-supervisor' });
        assert.equal(res.status, 403);
    });
    test('a supervisor waiting for approval is not offered to the franchise admin, and approving one is 404', async () => {
        // a supervisor record left from before the change, still waiting
        const old = await fx.legacySupervisor('A', 'nspend');
        await fx.models.StoreManager.updateOne({ _id: new mongoose.Types.ObjectId(old.staffId) }, { $set: { status: 'Pending Approval' } });
        const list = await fx.call('GET', '/v1/staff-approvals', A.adminToken);
        assert.equal(list.status, 200);
        assert.equal(JSON.stringify(list.body.data).includes(old.staffId), false);
        assert.equal((await fx.call('PATCH', `/v1/staff-approvals/${old.staffId}/approve`, A.adminToken, {})).status, 404);
    });
});
