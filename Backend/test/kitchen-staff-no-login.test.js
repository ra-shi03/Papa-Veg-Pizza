// Kitchen staff no longer sign in (client decision 2026-11-26, docs/kitchen-staff-removal.md). They are staff records the
// store manager runs from the store panel:
//   the manager adds them (no email needed, no password, no account), the franchise admin approves them,
//   the manager clocks them in / out, puts them on stations, works the stations for them, records leave and salary.
// A kitchen staff login from before the change is refused everywhere; scripts/convert-kitchen-staff.js converts them.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B;
let chef; let packer; let pending;
let seq = 0;

const O = '/v1/food/store/orders';
const msg = (res) => res.body.message || res.body.error;
const newOrder = async (f) => {
    const ref = `KS${fx.ts}${seq++}`;
    const r = await fx.models.FoodOrder.collection.insertOne({
        order_id: ref, orderId: ref, userId: new mongoose.Types.ObjectId(f.customerId), storeId: new mongoose.Types.ObjectId(f.storeId),
        franchiseId: new mongoose.Types.ObjectId(f.franchiseId), orderStatus: 'created', payment: { method: 'cash', status: 'cod_pending' },
        pricing: { subtotal: 300, total: 300 }, deliveryAddress: { street: '1 Test Rd', city: 'Pune', state: 'MH' },
        customerName: 'Test Customer', customerPhone: f.phone, items: [{ itemId: 'i1', name: 'Margherita', quantity: 1, price: 300 }],
        statusHistory: [], createdAt: new Date(), updatedAt: new Date(),
    });
    return { id: String(r.insertedId), ref };
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    chef = await fx.staff('A', 'Pizza Maker', 'kschef');
    packer = await fx.staff('A', 'Packager', 'kspacker');
});
after(async () => { await fx?.teardown(); });

describe('adding kitchen staff (no login)', () => {
    test('the manager adds a person with a name and phone only: a staff record, no account, waiting for approval', async () => {
        const users = await fx.models.User.countDocuments({});
        const r = await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'No Email One', phone: '9876500001', role: 'Baker', password: 'ignored-Pass#1' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(r.body.data.staffKind, 'kitchen_staff');
        assert.equal(r.body.data.userId, null);
        assert.equal(r.body.data.status, 'Pending Approval');
        assert.equal(r.body.data.email, undefined);
        assert.equal(await fx.models.User.countDocuments({}), users, 'no login account is made');
        pending = r.body.data;
        // a second person without an email is fine too (the email is unique only where it is set)
        const r2 = await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'No Email Two', phone: '9876500002', role: 'Packager' });
        assert.equal(r2.status, 201, JSON.stringify(r2.body));
    });

    test('name and phone are required; a bad email or a repeated phone is refused', async () => {
        assert.equal((await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'X' })).status, 400);
        assert.equal((await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'X', phone: '9876500003', email: 'nope' })).status, 400);
        assert.equal((await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'Again', phone: '9876500001' })).status, 409);
        assert.equal((await fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'Sup', phone: '9876500004', role: 'Kitchen Supervisor' })).status, 400);
    });

    test('the franchise admin sees and approves it; another franchise cannot', async () => {
        const list = await fx.call('GET', '/v1/staff-approvals?status=Pending Approval', A.adminToken);
        assert.equal(list.status, 200);
        assert.ok(list.body.data.staff.some((s) => s._id === String(pending._id)));
        assert.equal((await fx.call('PATCH', `/v1/staff-approvals/${pending._id}/approve`, B.adminToken, {})).status, 404);
        const ok = await fx.call('PATCH', `/v1/staff-approvals/${pending._id}/approve`, A.adminToken, {});
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        const staffList = await fx.call('GET', '/v1/staff-approvals/staff', A.adminToken);
        assert.ok(staffList.body.data.staff.some((s) => s._id === String(pending._id)));
    });

    test('a store manager can no longer create a kitchen staff login through the admin staff API', async () => {
        const r = await fx.call('POST', '/v1/food/admin/staff', A.managerToken, { name: 'x', email: `x${fx.ts}@example.invalid`, phone: '9876500009', role: 'kitchen-staff', password: 'Abcd#12345' });
        assert.equal(r.status, 403);
    });
});

describe('the store manager runs the kitchen staff', () => {
    test('clock in / out: only the manager, only their own store, only once at a time', async () => {
        const id = String(pending._id);
        assert.equal((await fx.call('POST', `/v1/store/attendance/staff/${id}/clock-in`, B.managerToken)).status, 404);
        const ci = await fx.call('POST', `/v1/store/attendance/staff/${id}/clock-in`, A.managerToken);
        assert.equal(ci.status, 201, JSON.stringify(ci.body));
        assert.equal(ci.body.data.source, 'manager');
        assert.equal((await fx.call('POST', `/v1/store/attendance/staff/${id}/clock-in`, A.managerToken)).status, 409);
        const people = await fx.call('GET', '/v1/store/attendance/people', A.managerToken);
        assert.equal(people.body.data.find((p) => p.staffId === id)?.today?.clockedIn, true);
        assert.equal((await fx.call('POST', `/v1/store/attendance/staff/${id}/clock-out`, A.managerToken)).status, 200);
        assert.equal((await fx.call('POST', `/v1/store/attendance/staff/${id}/clock-out`, A.managerToken)).status, 409);
    });

    test('the manager can also mark a past day present (with hours and a reason)', async () => {
        const d = new Date(Date.now() - 86400000);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const r = await fx.call('POST', '/v1/store/attendance', A.managerToken, { staffId: String(pending._id), date, status: 'present', checkIn: '09:00 AM', checkOut: '05:00 PM', notes: 'Forgot to clock in' });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        assert.equal(r.body.data.totalHours, 8);
    });

    test('the team list gives staff record ids; assigning writes the record id on the order and on its task', async () => {
        const team = await fx.call('GET', `${O}/team`, A.managerToken);
        assert.equal(team.status, 200);
        const me = team.body.data.find((m) => m._id === chef.staffId);
        assert.ok(me, 'the chef is in the team by staff record id');
        assert.equal(me.present, true);

        const o = await newOrder(A);
        assert.equal((await fx.call('PATCH', `${O}/${o.id}/accept`, A.managerToken, { estimatedPreparationTime: 15 })).status, 200);
        const a = await fx.call('PATCH', `${O}/${o.id}/assign-staff`, A.managerToken, { staffId: chef.id, role: 'pizza_chef' });
        assert.equal(a.status, 200, JSON.stringify(a.body));
        assert.equal(a.body.data.assignedStaff.pizza_chef._id, chef.staffId);
        const saved = await fx.models.FoodOrder.findById(o.id).lean();
        assert.equal(String(saved.kitchen.staff.pizza_chef.staffId), chef.staffId);

        // a person who is not clocked in cannot be given work
        const notIn = await fx.staff('A', 'Pizza Maker', 'ksnotin', { clockIn: false });
        const refused = await fx.call('PATCH', `${O}/${o.id}/assign-staff`, A.managerToken, { staffId: notIn.id, role: 'pizza_chef' });
        assert.equal(refused.status, 400);
        assert.match(msg(refused), /not present/);

        // the Kitchen Tasks board: every task of the store, with the name of the person it is for
        const tasks = await fx.call('GET', '/v1/tasks', A.managerToken);
        assert.equal(tasks.status, 200);
        const t = tasks.body.data.find((x) => x.orderRef === o.id);
        assert.ok(t, 'the task is on the board');
        assert.equal(t.assignedToId, chef.staffId);
        assert.equal(t.assignedTo, chef.name);
        const team2 = await fx.call('GET', '/v1/tasks/team', A.managerToken);
        assert.equal(team2.body.data.staffList.find((s) => s._id === chef.staffId)?.activeTasks, 1);

        // the manager moves the order along for the staff and marks it ready (rider flow as before)
        assert.equal((await fx.call('PATCH', `${O}/${o.id}/assign-staff`, A.managerToken, { staffId: packer.id, role: 'packaging_staff' })).status, 200);
        for (const s of ['preparing', 'baking', 'packaging', 'ready']) {
            const r = await fx.call('PATCH', `${O}/${o.id}/stage`, A.managerToken, { stage: s });
            assert.equal(r.status, 200, `${s}: ${JSON.stringify(r.body)}`);
        }
        assert.equal((await fx.models.FoodOrder.findById(o.id).lean()).orderStatus, 'ready_for_pickup');
    });

    test('salary: the manager keeps the payout details and records the salary', async () => {
        const acc = await fx.call('PUT', `/v1/food/store/payouts/staff/${chef.staffId}/account`, A.managerToken, { accountHolderName: 'Chef', accountNumber: '123456789012', ifscCode: 'HDFC0001234', bankName: 'HDFC' });
        assert.equal(acc.status, 200, JSON.stringify(acc.body));
        assert.equal((await fx.call('PUT', `/v1/food/store/payouts/staff/${chef.staffId}/account`, B.managerToken, { upiId: 'x@upi' })).status, 404);
        const desk = await fx.call('GET', '/v1/food/store/payouts/staff', A.managerToken);
        const row = desk.body.data.staff.find((s) => s.staffId === chef.staffId);
        assert.ok(row?.account, 'the account shows on the staff salary card');
        const now = new Date();
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const paid = await fx.call('POST', '/v1/food/store/payouts/salaries', A.managerToken, { staffId: chef.staffId, period, amount: 1000, method: 'upi', reference: `UTRKS${fx.ts}` });
        assert.equal(paid.status, 201, JSON.stringify(paid.body));
    });
});

describe('kitchen staff logins from before the change', () => {
    test('sign-in is refused with the reason (only after the right password)', async () => {
        const old = await fx.legacyStaff('A', 'kslegacy1');
        const wrong = await fx.call('POST', '/v1/auth/store/login', null, { email: old.email, password: 'Wrong#Pass123' });
        assert.equal(wrong.status, 401);
        assert.doesNotMatch(msg(wrong) || '', /no longer sign in/);
        const right = await fx.call('POST', '/v1/auth/store/login', null, { email: old.email, password: old.password });
        assert.equal(right.status, 401);
        assert.match(msg(right), /Kitchen staff no longer sign in/);
    });

    test('an old kitchen staff token is refused on every route (403), and my-salary is retired (410)', async () => {
        const old = await fx.legacyStaff('A', 'kslegacy2');
        for (const path of [`${O}?view=active`, '/v1/tasks', '/v1/food/store/kitchen/queue', '/v1/store/attendance/today', '/v1/profile', '/v1/food/store/inventory/ingredients']) {
            const r = await fx.call('GET', path, old.token);
            assert.equal(r.status, 403, `${path} -> ${r.status}`);
        }
        assert.equal((await fx.call('GET', '/v1/food/store/my-salary', A.managerToken)).status, 410);
    });

    test('convert-kitchen-staff: a dry run changes nothing; --apply marks the record, switches the login off and links open orders', async () => {
        const { convertKitchenStaff } = await import('../scripts/convert-kitchen-staff.js');
        const old = await fx.legacyStaff('A', 'kslegacy3');
        // an order in the kitchen that names the person by their old User id
        const o = await newOrder(A);
        await fx.models.FoodOrder.updateOne({ _id: o.id }, { $set: { orderStatus: 'preparing', 'kitchen.staff.pizza_chef': { userId: new mongoose.Types.ObjectId(old.userId), name: old.name } } });

        const dry = await convertKitchenStaff();
        assert.equal(dry.applied, false);
        assert.ok(dry.staffRecordsToMark >= 1 && dry.openOrdersToLink >= 1);
        assert.equal((await fx.models.User.findById(old.userId).lean()).isActive, true, 'dry run writes nothing');

        const done = await convertKitchenStaff({ apply: true });
        assert.equal(done.applied, true);
        assert.equal((await fx.models.StoreManager.findById(old.staffId).lean()).staffKind, 'kitchen_staff');
        assert.equal((await fx.models.User.findById(old.userId).lean()).isActive, false);
        assert.equal(String((await fx.models.FoodOrder.findById(o.id).lean()).kitchen.staff.pizza_chef.staffId), old.staffId);
        // still a working staff record: the manager can clock them in and put them on stations
        assert.equal((await fx.call('POST', `/v1/store/attendance/staff/${old.staffId}/clock-in`, A.managerToken)).status, 201);
        assert.equal((await convertKitchenStaff({ apply: true })).staffRecordsMarked, 0, 'running it again changes nothing');
    });
});
