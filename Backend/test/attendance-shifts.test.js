// Feature 7: shifts and attendance (/v1/store/shifts, /v1/store/attendance) and the dashboard staff widgets that read them.
// Role and scope come from the token only: kitchen staff clock themselves in and out and read only their own records; the
// store manager manages shifts and marks only leave (by approving a leave request, or cancelling a leave day); worked days
// are never written by the manager. The kitchen supervisor role is no longer used: refused. franchise admin reads one of its own stores, and
// anything of another store or franchise is 404.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';
import { formatClock, dateKeyOf, parseClock, atClock } from '../src/modules/food/store/services/attendanceTime.js';

let fx; let A; let B;
let packer; let pizza; let baker; let bPacker; let bStaff;   // { id (user id), staffId (StoreManager id), token }
let phoneSeq = 0;
const objectId = (v) => new mongoose.Types.ObjectId(String(v));

const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
// created by the store manager and approved by the franchise admin (fx.staff); a 'Kitchen Supervisor' is a legacy
// account (the role is no longer used and cannot be created). Clocking in is left to the tests.
const makeStaff = (manager, role, tag) => {
    const k = manager === fx.F.B.managerToken ? 'B' : 'A';
    return /supervisor/i.test(role) ? fx.legacySupervisor(k, tag) : fx.staff(k, role, tag, { clockIn: false });
};
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const call = (method, path, token, body) => fx.call(method, `/v1/store${path}`, token, body);
const todayKey = () => dateKeyOf(new Date());
const daysBack = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateKeyOf(d); };
const daysAhead = (n) => daysBack(-n);
/**
 * A finished day as a staff member's own clock-in and clock-out leaves it. The API cannot write worked days for the past
 * (they are the staff's own), so history used by the list and visibility tests is put in place here.
 */
const seedDay = async (f, staff, { date, checkIn = '09:00 AM', checkOut = '05:00 PM', shiftId = null, status = 'present', totalHours = 8, late = false, lateMinutes = 0 } = {}) => {
    const off = status === 'leave' || status === 'absent';
    const doc = {
        storeId: objectId(f.storeId), franchiseId: objectId(f.franchiseId), staffId: objectId(staff.staffId), userId: objectId(staff.id),
        shiftId: shiftId ? objectId(shiftId) : null, date, checkInAt: off ? null : atClock(date, parseClock(checkIn)),
        checkOutAt: off || !checkOut ? null : atClock(date, parseClock(checkOut)), totalHours: off ? 0 : totalHours, overtimeHours: 0, status,
        late, lateMinutes, source: off ? 'manager' : 'self', markedBy: null, markedByName: off ? 'Manager A' : staff.name, notes: '',
        createdAt: new Date(), updatedAt: new Date(),
    };
    const r = await att().insertOne(doc);
    return { _id: String(r.insertedId), ...doc };
};
/** kitchen staff ask for leave; the store manager decides */
const requestLeave = (staff, startDate, endDate = startDate, extra = {}) =>
    call('POST', '/leave-requests', staff.token, { category: 'Sick', startDate, endDate, reason: 'Fever and rest', ...extra });
const approvedLeave = async (staff, startDate, endDate = startDate) => {
    const r = ok(await requestLeave(staff, startDate, endDate), 201);
    return ok(await call('PATCH', `/leave-requests/${r._id}/approve`, A.managerToken, {}));
};
/** "hh:mm AM" for `minutes` minutes ago */
const clockAgo = (minutes) => { const d = new Date(Date.now() - minutes * 60000); return formatClock(d.getHours() * 60 + d.getMinutes()); };
const att = () => fx.models.FoodOrder.db.collection('food_store_attendance');
// clears the staff's records; the store managers stay clocked in (they mark attendance before any work)
// the store managers' own days (they clock in like everyone) are left out of the staff counts below
const staffRows = (rows) => rows.filter((r) => !/^Manager /.test(r.staffName));
const resetAttendance = async () => {
    const managers = await mongoose.connection.collection('storemanagers').find({ role: /manager/i }).project({ _id: 1 }).toArray();
    await att().deleteMany({ staffId: { $nin: managers.map((m) => m._id) } });
    await mongoose.model('LeaveRequest').deleteMany({});
};

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    packer = await makeStaff(A.managerToken, 'Packager', 'apack');   // kitchen staff (the supervisor role is no longer used)
    pizza = await makeStaff(A.managerToken, 'Pizza Maker', 'apizza');
    baker = await makeStaff(A.managerToken, 'Baker', 'abaker');
    bPacker = await makeStaff(B.managerToken, 'Packager', 'bpack');
    bStaff = await makeStaff(B.managerToken, 'Pizza Maker', 'bstaff');
});
after(async () => { await fx?.teardown(); });

describe('staff list feeds the attendance screens', () => {
    test('each person carries fullName as well as name (the screens look people up by fullName)', async () => {
        const list = ok(await fx.call('GET', '/v1/food/store/staff', A.managerToken));
        const rec = list.find((s) => String(s._id) === pizza.staffId);
        assert.equal(rec.fullName, 'Name apizza');
        assert.equal(rec.name, rec.fullName);
    });
});

describe('authentication and roles', () => {
    const ID = '64b000000000000000000001';
    const endpoints = [
        ['GET', '/shifts'], ['GET', `/shifts/${ID}`], ['GET', '/attendance'], ['GET', `/attendance/${ID}`],
        ['GET', '/attendance/today'], ['GET', '/attendance/me'], ['POST', '/attendance/clock-in'], ['POST', '/attendance/clock-out'],
        ['POST', '/shifts'], ['PUT', `/shifts/${ID}`], ['DELETE', `/shifts/${ID}`], ['POST', `/shifts/${ID}/assign`],
        ['DELETE', `/attendance/${ID}`], ['GET', '/leave-requests'], ['PATCH', `/leave-requests/${ID}/approve`],
    ];
    test('anonymous callers get 401 everywhere', async () => {
        for (const [m, p] of endpoints) assert.equal((await call(m, p)).status, 401, `${m} ${p}`);
    });
    test('customers and delivery partners get 403 everywhere', async () => {
        const rider = await fx.partner('approved');
        for (const token of [A.customerToken, rider.token]) for (const [m, p] of endpoints) assert.equal((await call(m, p, token)).status, 403, `${m} ${p}`);
    });
    test('a (removed) kitchen supervisor is refused everywhere (403), and the account cannot clock in', async () => {
        const legacy = await fx.legacySupervisor('A', 'alegacy');
        for (const [m, p] of endpoints) assert.equal((await call(m, p, legacy.token, {})).status, 403, `${m} ${p}`);
    });
    test('kitchen staff cannot change shifts or attendance', async () => {
        const writes = [['POST', '/shifts'], ['PUT', `/shifts/${ID}`], ['DELETE', `/shifts/${ID}`], ['POST', `/shifts/${ID}/assign`],
            ['DELETE', `/attendance/${ID}`], ['GET', '/leave-requests'], ['PATCH', `/leave-requests/${ID}/approve`], ['PATCH', `/leave-requests/${ID}/reject`]];
        for (const token of [packer.token, pizza.token]) for (const [m, p] of writes) assert.equal((await call(m, p, token, {})).status, 403, `${m} ${p}`);
    });
    test('the store manager clocks in like the kitchen staff; the franchise admin and super admin do not', async () => {
        assert.equal(ok(await call('GET', '/attendance/today', A.managerToken)).state, 'clocked_in', 'the manager clocked in at the start of the shift');
        assert.equal((await call('POST', '/attendance/clock-in', A.managerToken)).status, 409, 'already clocked in');
        for (const token of [A.adminToken, fx.SA]) {
            assert.equal((await call('POST', '/attendance/clock-in', token)).status, 403);
            assert.equal((await call('GET', '/attendance/today', token)).status, 403);
        }
    });
});

describe('shifts: store manager', () => {
    let morning; let evening;
    test('creates a shift: shape, 12-hour times, creator is the server\'s idea of the caller', async () => {
        morning = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Morning', startTime: '9:00 AM', endTime: '17:00', breakMinutes: '30', maxStaff: 2, description: 'Prep' }), 201);
        assert.equal(morning.startTime, '09:00 AM');
        assert.equal(morning.endTime, '05:00 PM');
        assert.equal(morning.breakMinutes, 30);
        assert.equal(morning.maxStaff, 2);
        assert.equal(morning.status, 'active');
        assert.deepEqual(morning.assignedStaff, []);
        assert.equal(morning.createdBy, 'Manager A');
        assert.equal(morning.storeId, A.storeId);
        for (const k of ['_id', 'storeId', 'shiftName', 'startTime', 'endTime', 'breakMinutes', 'maxStaff', 'assignedStaff', 'status', 'description', 'createdBy', 'createdAt']) assert.ok(k in morning, k);
        evening = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Evening', startTime: '04:00 PM', endTime: '12:00 AM' }), 201);
    });
    test('store and franchise in the body are ignored; the shift lands in the caller\'s store', async () => {
        const s = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Sneaky', startTime: '01:00 AM', endTime: '02:00 AM', storeId: B.storeId, franchiseId: B.franchiseId, createdBy: 'Someone Else', _id: '64b000000000000000000009' }), 201);
        assert.equal(s.storeId, A.storeId);
        assert.equal(s.createdBy, 'Manager A');
        assert.notEqual(s._id, '64b000000000000000000009');
        const stored = await fx.models.FoodOrder.db.collection('food_store_shifts').findOne({ _id: objectId(s._id) });
        assert.equal(String(stored.franchiseId), A.franchiseId);
        ok(await call('DELETE', `/shifts/${s._id}`, A.managerToken));
    });
    test('validation: bad times, empty name, duplicate name (any case) and a ?storeId of another store', async () => {
        assert.equal((await call('POST', '/shifts', A.managerToken, { shiftName: 'X', startTime: '25:00', endTime: '05:00 PM' })).status, 400);
        assert.equal((await call('POST', '/shifts', A.managerToken, { shiftName: 'X', startTime: '9:00 XM', endTime: '05:00 PM' })).status, 400);
        assert.equal((await call('POST', '/shifts', A.managerToken, { shiftName: '', startTime: '09:00 AM', endTime: '05:00 PM' })).status, 400);
        assert.equal((await call('POST', '/shifts', A.managerToken, { shiftName: 'X', startTime: '09:00 AM', endTime: '05:00 PM', maxStaff: 0 })).status, 400);
        assert.equal((await call('POST', '/shifts', A.managerToken, { shiftName: 'MORNING', startTime: '09:00 AM', endTime: '05:00 PM' })).status, 409);
        assert.equal((await call('POST', `/shifts?storeId=${B.storeId}`, A.managerToken, { shiftName: 'Elsewhere', startTime: '09:00 AM', endTime: '05:00 PM' })).status, 404);
        // the same name is fine in another store
        ok(await call('POST', '/shifts', B.managerToken, { shiftName: 'Morning', startTime: '09:00 AM', endTime: '05:00 PM' }), 201);
    });
    test('list (search, status) and get', async () => {
        const all = ok(await call('GET', '/shifts', A.managerToken));
        assert.deepEqual(all.map((s) => s.shiftName), ['Morning', 'Evening']);   // by start time
        assert.deepEqual(ok(await call('GET', '/shifts?search=eve', A.managerToken)).map((s) => s.shiftName), ['Evening']);
        assert.equal(ok(await call('GET', '/shifts?status=inactive', A.managerToken)).length, 0);
        assert.equal(ok(await call('GET', `/shifts/${morning._id}`, A.managerToken)).shiftName, 'Morning');
        assert.equal((await call('GET', '/shifts/not-an-id', A.managerToken)).status, 404);
    });
    test('update: rename, retime, deactivate; unknown fields are ignored', async () => {
        const u = ok(await call('PUT', `/shifts/${evening._id}`, A.managerToken, { shiftName: 'Late', endTime: '11:30 PM', status: 'inactive', storeId: B.storeId, assignedStaff: [pizza.staffId] }));
        assert.equal(u.shiftName, 'Late');
        assert.equal(u.endTime, '11:30 PM');
        assert.equal(u.status, 'inactive');
        assert.deepEqual(u.assignedStaff, [], 'assignment only through /assign');
        assert.equal(ok(await call('GET', '/shifts?status=inactive', A.managerToken)).length, 1);
        ok(await call('PUT', `/shifts/${evening._id}`, A.managerToken, { shiftName: 'Evening', status: 'active' }));
    });
    test('assign: only kitchen staff of this store, at most maxStaff, one shift per person, staff records follow', async () => {
        const a = ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [packer.staffId, pizza.staffId] }));
        assert.deepEqual(a.assignedStaff.sort(), [packer.staffId, pizza.staffId].sort());
        const rec = await fx.models.StoreManager.findById(pizza.staffId).lean();
        assert.equal(rec.personalDetails.shiftType, 'Morning');
        assert.equal(rec.personalDetails.startTime, '09:00 AM');

        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [packer.staffId, pizza.staffId, baker.staffId] })).status, 400, 'maxStaff 2');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [bStaff.staffId] })).status, 404, 'another store\'s staff');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [A.managerId] })).status, 404, 'the manager is not kitchen staff');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: ['x'] })).status, 400);
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, {})).status, 400);

        // moving pizza to the evening takes them off the morning
        const e = ok(await call('POST', `/shifts/${evening._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
        assert.deepEqual(e.assignedStaff, [pizza.staffId]);
        assert.deepEqual(ok(await call('GET', `/shifts/${morning._id}`, A.managerToken)).assignedStaff, [packer.staffId]);
        assert.equal((await fx.models.StoreManager.findById(pizza.staffId).lean()).personalDetails.shiftType, 'Evening');
        // an empty list clears the shift and the staff record
        ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [] }));
        assert.equal((await fx.models.StoreManager.findById(packer.staffId).lean()).personalDetails.shiftType, undefined);
        ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [packer.staffId, baker.staffId] }));
    });
    test('delete: assignments are cleared and attendance history keeps its record', async () => {
        const temp = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Temp', startTime: '06:00 AM', endTime: '07:00 AM' }), 201);
        ok(await call('POST', `/shifts/${temp._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
        const rec = await seedDay(A, pizza, { date: daysBack(5), checkIn: '06:02 AM', checkOut: '07:00 AM', shiftId: temp._id, totalHours: 1 });
        ok(await call('DELETE', `/shifts/${temp._id}`, A.managerToken));
        assert.equal((await call('GET', `/shifts/${temp._id}`, A.managerToken)).status, 404);
        assert.equal((await fx.models.StoreManager.findById(pizza.staffId).lean()).personalDetails.shiftType, undefined);
        const kept = ok(await call('GET', `/attendance/${rec._id}`, A.managerToken));
        assert.deepEqual([kept.shiftId, kept.totalHours], [null, 1], 'the worked day stays, without the deleted shift');
        await att().deleteOne({ _id: objectId(rec._id) });
        ok(await call('POST', `/shifts/${evening._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
    });
});

describe('shifts: who sees what, and other stores', () => {
    test('the manager sees every shift of the store; kitchen staff only the one they are on', async () => {
        assert.equal(ok(await call('GET', '/shifts', A.managerToken)).length, 2);
        assert.deepEqual(ok(await call('GET', '/shifts', packer.token)).map((x) => x.shiftName), ['Morning']);
        const mine = ok(await call('GET', '/shifts', pizza.token));
        assert.deepEqual(mine.map((s) => s.shiftName), ['Evening']);
        const morning = ok(await call('GET', '/shifts', A.managerToken)).find((s) => s.shiftName === 'Morning');
        assert.equal((await call('GET', `/shifts/${morning._id}`, pizza.token)).status, 404, 'a shift they are not on');
        assert.equal((await call('GET', `/shifts/${morning._id}`, baker.token)).status, 200);
        assert.equal((await call('GET', '/shifts', bStaff.token)).body.data.length, 0);
    });
    test('the bulk attendance modal can build its roster from the staff list and each shift\'s assignedStaff', async () => {
        const staff = ok(await fx.call('GET', '/v1/food/store/staff', A.managerToken));
        const morning = ok(await call('GET', '/shifts?status=active', A.managerToken)).find((s) => s.shiftName === 'Morning');
        // the modal's own rule: active (any case) and on the selected shift
        const roster = staff.filter((s) => String(s.status || '').toLowerCase() === 'active' && morning.assignedStaff.map(String).includes(String(s._id)));
        assert.deepEqual(roster.map((s) => s.fullName).sort(), ['Name abaker', 'Name apack']);
        assert.ok(staff.every((s) => s.status === 'Active'), 'the server says "Active", not "active"');
        // what the modal used to ask for: the status filter is an exact match, so "active" finds nobody
        assert.equal(ok(await fx.call('GET', '/v1/food/store/staff?status=active', A.managerToken)).length, 0);
    });
    test('another store\'s manager and staff cannot read or change these shifts (404)', async () => {
        const [morning] = ok(await call('GET', '/shifts', A.managerToken));
        for (const token of [B.managerToken, bPacker.token, bStaff.token]) assert.equal((await call('GET', `/shifts/${morning._id}`, token)).status, 404);
        assert.equal((await call('PUT', `/shifts/${morning._id}`, B.managerToken, { shiftName: 'Hijacked' })).status, 404);
        assert.equal((await call('DELETE', `/shifts/${morning._id}`, B.managerToken)).status, 404);
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, B.managerToken, { staffIds: [bStaff.staffId] })).status, 404);
        assert.deepEqual(ok(await call('GET', '/shifts', B.managerToken)).map((s) => s.shiftName), ['Morning']);   // B's own, not A's
        assert.equal(ok(await call('GET', '/shifts', B.managerToken))[0].storeId, B.storeId);
        assert.equal((await call('GET', `/shifts?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.equal((await call('GET', `/shifts?storeId=${B.storeId}`, packer.token)).status, 404);
    });
    test('franchise admin: read only, one of its own stores; another franchise\'s store is 404', async () => {
        assert.equal((await call('GET', '/shifts', A.adminToken)).status, 400, 'must name the store');
        assert.equal(ok(await call('GET', `/shifts?storeId=${A.storeId}`, A.adminToken)).length, 2);
        assert.equal((await call('GET', `/shifts?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await call('GET', `/shifts?storeId=${A.storeId}`, B.adminToken)).status, 404);
        const [morning] = ok(await call('GET', '/shifts', A.managerToken));
        assert.equal((await call('GET', `/shifts/${morning._id}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await call('GET', `/shifts/${morning._id}?storeId=${B.storeId}`, A.adminToken)).status, 404);
        for (const [m, p, b] of [['POST', `/shifts?storeId=${A.storeId}`, { shiftName: 'Z', startTime: '1:00 AM', endTime: '2:00 AM' }], ['PUT', `/shifts/${morning._id}?storeId=${A.storeId}`, { shiftName: 'Z' }],
            ['DELETE', `/shifts/${morning._id}?storeId=${A.storeId}`, {}], ['POST', `/shifts/${morning._id}/assign?storeId=${A.storeId}`, { staffIds: [] }]]) {
            assert.equal((await call(m, p, A.adminToken, b)).status, 403, `${m} ${p}`);
        }
    });
    test('super admin reads any store', async () => {
        assert.equal(ok(await call('GET', `/shifts?storeId=${B.storeId}`, fx.SA)).length, 1);
        assert.equal((await call('GET', '/shifts?storeId=64b000000000000000000001', fx.SA)).status, 404);
    });
});

describe('attendance: staff clock in themselves; the store manager only marks leave', () => {
    let worked; let morning;
    before(async () => {
        await resetAttendance();
        [morning] = ok(await call('GET', '/shifts', A.managerToken));   // 09:00 AM - 05:00 PM
        worked = await seedDay(A, baker, { date: daysBack(1), checkIn: '09:05 AM', checkOut: '06:05 PM', shiftId: morning._id, totalHours: 9 });
        await seedDay(A, packer, { date: daysBack(2), checkIn: '09:40 AM', checkOut: '05:00 PM', shiftId: morning._id, totalHours: 7.33, late: true, lateMinutes: 40 });
    });
    test('the manager cannot write a worked day: present is refused (403), bulk marking and editing are gone (404); a worked day cannot be deleted (403)', async () => {
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: daysBack(3), checkIn: '09:00 AM', status: 'present', notes: 'forgot to clock in' })).status, 403);
        assert.equal((await call('POST', '/attendance/bulk', A.managerToken, { date: daysBack(3), attendances: [{ staffId: baker.staffId, status: 'present' }] })).status, 404);
        assert.equal((await call('PUT', `/attendance/${worked._id}`, A.managerToken, { checkOut: '05:00 PM', totalHours: 1 })).status, 404);
        const del = await call('DELETE', `/attendance/${worked._id}`, A.managerToken);
        assert.equal(del.status, 403);
        assert.match(del.body.message || del.body.error, /made by the person themselves/);
        const stored = await att().findOne({ _id: objectId(worked._id) });
        assert.deepEqual([stored.totalHours, stored.status], [9, 'present'], 'unchanged');
    });
    test('leave: a kitchen staff request the manager approves becomes one leave day per day, with no times or hours', async () => {
        const [d1, d2] = [daysAhead(1), daysAhead(2)];
        const req = ok(await requestLeave(pizza, d1, d2), 201);
        assert.deepEqual([req.status, req.days, req.staffId], ['pending', 2, pizza.staffId]);
        assert.equal(ok(await call('GET', '/attendance?status=leave', A.managerToken)).length, 0, 'nothing before the approval');
        ok(await call('PATCH', `/leave-requests/${req._id}/approve`, A.managerToken, {}));
        const days = ok(await call('GET', '/attendance?status=leave', A.managerToken));
        assert.deepEqual(days.map((r) => r.date).sort(), [d1, d2]);
        for (const r of days) {
            assert.deepEqual([r.staffId, r.checkIn, r.checkOut, r.totalHours, r.markedBy, r.source], [pizza.staffId, '', '', 0, 'Manager A', 'manager']);
            assert.deepEqual([r.leave.category, r.leave.approvedBy], ['Sick', 'Manager A']);
        }
        assert.equal((await call('PATCH', `/leave-requests/${req._id}/approve`, A.managerToken, {})).status, 409, 'decided once');
    });
    test('leave requests: validation; an overlap is 409; only kitchen staff ask and only their own store manager decides', async () => {
        assert.equal((await requestLeave(pizza, daysBack(1))).status, 400, 'in the past');
        assert.equal((await requestLeave(pizza, daysAhead(6), daysAhead(5))).status, 400, 'ends before it starts');
        assert.equal((await requestLeave(pizza, daysAhead(5), daysAhead(5), { reason: 'x' })).status, 400, 'reason');
        assert.equal((await requestLeave(pizza, daysAhead(5), daysAhead(5), { category: 'Holiday' })).status, 400, 'category');
        assert.equal((await requestLeave(pizza, daysAhead(2), daysAhead(3))).status, 409, 'overlaps the approved leave');
        // the store manager asks too; only the franchise admin decides it, never the manager themselves
        const mine = ok(await requestLeave({ token: A.managerToken }, daysAhead(5)), 201);
        assert.equal((await call('PATCH', `/leave-requests/${mine._id}/approve`, A.managerToken, {})).status, 403, 'not their own');
        assert.ok(!ok(await call('GET', '/leave-requests?status=pending', A.managerToken)).requests.some((q) => q._id === mine._id), 'not in the manager\'s queue');
        ok(await call('PATCH', `/leave-requests/${mine._id}/cancel`, A.managerToken, {}));
        const r = ok(await requestLeave(baker, daysAhead(5)), 201);
        for (const token of [pizza.token, baker.token]) assert.equal((await call('PATCH', `/leave-requests/${r._id}/approve`, token, {})).status, 403);
        assert.equal((await call('PATCH', `/leave-requests/${r._id}/approve`, A.adminToken, {})).status, 400, 'the franchise admin names the store');
        assert.equal((await call('PATCH', `/leave-requests/${r._id}/approve`, B.managerToken, {})).status, 404, 'another store');
        assert.equal((await call('PATCH', `/leave-requests/${r._id}/reject`, A.managerToken, {})).status, 400, 'a rejection needs a reason');
        ok(await call('PATCH', `/leave-requests/${r._id}/reject`, A.managerToken, { reason: 'Short staffed that day' }));
        assert.equal(ok(await call('GET', `/attendance?date=${daysAhead(5)}`, A.managerToken)).length, 0, 'a rejected request writes nothing');
    });
    test('the manager cancels a leave day; twice, unknown or malformed is 404', async () => {
        const [day] = ok(await call('GET', `/attendance?status=leave&date=${daysAhead(2)}`, A.managerToken));
        ok(await call('DELETE', `/attendance/${day._id}`, A.managerToken));
        assert.equal((await call('GET', `/attendance/${day._id}`, A.managerToken)).status, 404);
        assert.equal((await call('DELETE', `/attendance/${day._id}`, A.managerToken)).status, 404);
        assert.equal((await call('DELETE', '/attendance/not-an-id', A.managerToken)).status, 404);
    });
    test('list: filters by date, status, search, role and shift; newest first; hours and lateness as recorded at clock-out', async () => {
        const all = staffRows(ok(await call('GET', '/attendance', A.managerToken)));
        assert.equal(all.length, 3);
        assert.deepEqual(all.map((r) => r.date), [...all.map((r) => r.date)].sort().reverse());
        const b = ok(await call('GET', `/attendance?date=${daysBack(1)}`, A.managerToken));
        assert.deepEqual(b.map((r) => [r.staffName, r.checkIn, r.checkOut, r.totalHours, r.shiftName, r.source]), [['Name abaker', '09:05 AM', '06:05 PM', 9, 'Morning', 'self']]);
        const p = ok(await call('GET', `/attendance?date=${daysBack(2)}`, A.managerToken));
        assert.deepEqual(p.map((r) => [r.staffName, r.late, r.lateMinutes]), [['Name apack', true, 40]]);
        assert.ok(ok(await call('GET', '/attendance?status=leave', A.managerToken)).every((r) => r.status === 'leave'));
        assert.deepEqual(ok(await call('GET', '/attendance?search=abaker', A.managerToken)).map((r) => r.staffName), ['Name abaker']);
        assert.equal(ok(await call('GET', '/attendance?search=.*', A.managerToken)).length, 0, 'search text is literal');
        assert.ok(ok(await call('GET', '/attendance?role=Baker', A.managerToken)).every((r) => r.role === 'Baker'));
        assert.equal(ok(await call('GET', `/attendance?shiftId=${morning._id}`, A.managerToken)).length, 2);
        assert.equal((await call('GET', '/attendance?status[$ne]=x', A.managerToken)).status, 400);
        assert.equal((await call('GET', '/attendance?status=bogus', A.managerToken)).status, 400);
        assert.equal((await call('GET', '/attendance?date=yesterday', A.managerToken)).status, 400);
    });
});

describe('attendance: other stores and franchises', () => {
    test('another store\'s manager and staff see none of it and cannot touch it', async () => {
        const [one] = ok(await call('GET', '/attendance', A.managerToken));
        for (const token of [B.managerToken, bPacker.token, bStaff.token]) {
            assert.equal((await call('GET', `/attendance/${one._id}`, token)).status, 404);
        }
        assert.equal(staffRows(ok(await call('GET', '/attendance', B.managerToken))).length, 0);
        assert.equal(ok(await call('GET', '/attendance', bPacker.token)).length, 0);
        assert.equal((await call('DELETE', `/attendance/${one._id}`, B.managerToken)).status, 404);
        assert.equal((await call('GET', `/attendance?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.ok(await att().findOne({ _id: objectId(one._id) }), 'still there');
    });
    test('franchise admin reads one of its own stores and decides its leave queue; another franchise gets 404', async () => {
        const [one] = ok(await call('GET', '/attendance', A.managerToken));
        assert.equal((await call('GET', '/attendance', A.adminToken)).status, 400);
        assert.equal(staffRows(ok(await call('GET', `/attendance?storeId=${A.storeId}`, A.adminToken))).length, 3);
        assert.equal((await call('GET', `/attendance?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await call('GET', `/attendance?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await call('GET', `/attendance/${one._id}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await call('GET', `/attendance/${one._id}?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await call('GET', `/leave-requests?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await call('GET', `/leave-requests?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await call('PATCH', `/leave-requests/${one._id}/approve?storeId=${A.storeId}`, A.adminToken, {})).status, 404, 'not a leave request');
    });
});

describe('attendance: kitchen staff clock in and out', () => {
    before(resetAttendance);

    test('today: not clocked in yet', async () => {
        const t = ok(await call('GET', '/attendance/today', pizza.token));
        assert.equal(t.state, 'not_clocked_in');
        assert.equal(t.clockedIn, false);
        assert.equal(t.record, null);
        assert.equal(t.shift.shiftName, 'Evening');
    });
    test('clock out before clocking in is refused (409)', async () => {
        assert.equal((await call('POST', '/attendance/clock-out', pizza.token)).status, 409);
    });
    test('clock in: the record is the caller\'s own, whatever the body says', async () => {
        const rec = ok(await call('POST', '/attendance/clock-in', pizza.token, { storeId: B.storeId, userId: bStaff.id, staffId: bStaff.staffId, status: 'absent', checkIn: '01:00 AM', franchiseId: B.franchiseId }), 201);
        assert.equal(rec.storeId, A.storeId);
        assert.equal(rec.staffId, pizza.staffId);
        assert.equal(rec.status, 'present');
        assert.equal(rec.source, 'self');
        assert.equal(rec.date, todayKey());
        assert.equal(rec.checkOut, '');
        assert.ok(rec.checkInAt);
        assert.notEqual(rec.checkIn, '01:00 AM');
        assert.equal(rec.shiftName, 'Evening');
        assert.equal((await fx.models.FoodOrder.db.collection('food_store_attendance').countDocuments({ staffId: objectId(bStaff.staffId) })), 0);
    });
    test('clocking in again while clocked in is refused (409); today shows clocked_in', async () => {
        assert.equal((await call('POST', '/attendance/clock-in', pizza.token)).status, 409);
        const t = ok(await call('GET', '/attendance/today', pizza.token));
        assert.equal(t.state, 'clocked_in');
        assert.equal(t.clockedIn, true);
    });
    test('clock out: hours are worked out from the real times', async () => {
        // pretend the shift began three and a half hours ago
        await fx.models.FoodOrder.db.collection('food_store_attendance').updateOne({ staffId: objectId(pizza.staffId) }, { $set: { checkInAt: new Date(Date.now() - 3.5 * 3600000) } });
        const rec = ok(await call('POST', '/attendance/clock-out', pizza.token));
        assert.equal(rec.totalHours, 3.5);
        assert.equal(rec.overtimeHours, 0);
        assert.ok(rec.checkOut);
        const t = ok(await call('GET', '/attendance/today', pizza.token));
        assert.equal(t.state, 'clocked_out');
        assert.equal((await call('POST', '/attendance/clock-out', pizza.token)).status, 409, 'already clocked out');
        assert.equal((await call('POST', '/attendance/clock-in', pizza.token)).status, 409, 'one record per day');
    });
    test('lateness against the person\'s shift', async () => {
        const late = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Late test', startTime: clockAgo(120), endTime: '11:59 PM' }), 201);
        ok(await call('POST', `/shifts/${late._id}/assign`, A.managerToken, { staffIds: [baker.staffId] }));
        const rec = ok(await call('POST', '/attendance/clock-in', baker.token), 201);
        assert.equal(rec.late, true);
        assert.ok(rec.lateMinutes >= 119 && rec.lateMinutes <= 122, `lateMinutes ${rec.lateMinutes}`);
        ok(await call('POST', '/attendance/clock-out', baker.token));
        // on time: a shift that starts now
        const sched = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'On time', startTime: clockAgo(2), endTime: '11:59 PM' }), 201);
        ok(await call('POST', `/shifts/${sched._id}/assign`, A.managerToken, { staffIds: [packer.staffId] }));
        const onTime = ok(await call('POST', '/attendance/clock-in', packer.token), 201);
        assert.equal(onTime.late, false);
        assert.equal(onTime.lateMinutes, 0);
    });
    test('an account on leave or suspended cannot clock in (403)', async () => {
        await fx.models.FoodOrder.db.collection('food_store_attendance').deleteMany({ staffId: objectId(packer.staffId) });
        for (const status of ['On Leave', 'Suspended']) {
            await fx.models.StoreManager.updateOne({ _id: packer.staffId }, { $set: { status } });
            assert.equal((await call('POST', '/attendance/clock-in', packer.token)).status, 403, status);
        }
        await fx.models.StoreManager.updateOne({ _id: packer.staffId }, { $set: { status: 'Active' } });
        assert.equal((await call('POST', '/attendance/clock-in', packer.token)).status, 201);
    });
    test('an approved leave day cannot be clocked in over (409); once the manager cancels it, they can clock in', async () => {
        await resetAttendance();
        await approvedLeave(baker, todayKey());
        const res = await call('POST', '/attendance/clock-in', baker.token);
        assert.equal(res.status, 409);
        assert.match(res.body.message || res.body.error, /on leave today/);
        assert.equal(ok(await call('GET', '/attendance/today', baker.token)).state, 'on_leave');
        const [day] = ok(await call('GET', `/attendance?date=${todayKey()}&status=leave`, A.managerToken));
        ok(await call('DELETE', `/attendance/${day._id}`, A.managerToken));
        ok(await call('POST', '/attendance/clock-in', baker.token), 201);
        await resetAttendance();
    });
    test('another store\'s staff clock in to their own store', async () => {
        const rec = ok(await call('POST', '/attendance/clock-in', bStaff.token), 201);
        assert.equal(rec.storeId, B.storeId);
        assert.equal(staffRows(ok(await call('GET', '/attendance', A.managerToken))).length, 0, 'store A does not see it');
    });
});

describe('attendance: kitchen staff read only their own', () => {
    let pizzaRec; let bakerRec;
    before(async () => {
        await resetAttendance();
        pizzaRec = await seedDay(A, pizza, { date: daysBack(1) });
        bakerRec = await seedDay(A, baker, { date: daysBack(1) });
        await seedDay(A, pizza, { date: daysBack(2), status: 'leave' });
    });
    test('kitchen staff: list is their own whatever the query says; another person\'s record is 404', async () => {
        const own = ok(await call('GET', '/attendance', pizza.token));
        assert.deepEqual(own.map((r) => r.staffId), [pizza.staffId, pizza.staffId]);
        assert.equal(ok(await call('GET', '/attendance?search=abaker', pizza.token)).every((r) => r.staffId === pizza.staffId), true);
        assert.equal(ok(await call('GET', '/attendance?role=Baker', pizza.token)).every((r) => r.staffId === pizza.staffId), true, 'filters never widen what they can see');
        assert.equal((await call('GET', `/attendance/${bakerRec._id}`, pizza.token)).status, 404);
        assert.equal((await call('GET', `/attendance/${pizzaRec._id}`, pizza.token)).status, 200);
    });
    test('/me is always the caller\'s own history', async () => {
        await seedDay(A, packer, { date: daysBack(1), checkIn: '08:00 AM', checkOut: '04:00 PM' });
        assert.deepEqual(ok(await call('GET', '/attendance/me', packer.token)).map((r) => r.staffId), [packer.staffId]);
        assert.equal(ok(await call('GET', '/attendance/me', pizza.token)).length, 2);
        assert.equal(ok(await call('GET', `/attendance/me?from=${daysBack(1)}`, pizza.token)).length, 1);
        assert.equal(ok(await call('GET', '/attendance/me?status=leave', pizza.token)).length, 1);
    });
    test('kitchen staff read only their own, never write', async () => {
        assert.ok(ok(await call('GET', '/attendance', packer.token)).every((r) => r.staffId === packer.staffId));
        assert.equal((await call('GET', `/attendance/${bakerRec._id}`, packer.token)).status, 404);
        assert.equal((await call('DELETE', `/attendance/${bakerRec._id}`, packer.token)).status, 403);
        assert.equal((await call('DELETE', `/attendance/${pizzaRec._id}`, pizza.token)).status, 403, 'not even their own');
    });
});

describe('dashboard: staff widgets use real clock-in data', () => {
    const widget = async (token, name, qs = '') => { const r = await fx.call('GET', `/v1/store/dashboard/${name}${qs}`, token); assert.equal(r.status, 200, JSON.stringify(r.body)); return r.body.data; };
    before(resetAttendance);

    test('with nobody clocked in: 0 on duty, 0 present, 0 late, 0 absent (active staff are NOT counted as present)', async () => {
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 0 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 0, late: 0, absent: 0 });
    });
    test('clock-ins move the numbers: on duty, present, late', async () => {
        ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Dash late', startTime: clockAgo(90), endTime: '11:59 PM' }), 201);
        const dash = ok(await call('GET', '/shifts', A.managerToken)).find((s) => s.shiftName === 'Dash late');
        ok(await call('POST', `/shifts/${dash._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
        ok(await call('POST', '/attendance/clock-in', packer.token), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
        ok(await call('POST', '/attendance/clock-in', pizza.token), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 2 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 0 });
        ok(await call('POST', '/attendance/clock-out', pizza.token));
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 0 });
    });
    test('absent: approved leave for today, or an account on leave that did not turn up', async () => {
        await approvedLeave(baker, todayKey());
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 1 });
        await fx.models.StoreManager.updateOne({ _id: packer.staffId }, { $set: { status: 'On Leave' } });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 1 }, 'packer already worked today, so not absent');
        await fx.models.StoreManager.updateOne({ _id: packer.staffId }, { $set: { status: 'Active' } });
    });
    test('a finished day (clocked in and out) counts as present but not as on duty', async () => {
        const [baked] = ok(await call('GET', `/attendance?date=${todayKey()}&search=abaker`, A.managerToken));
        ok(await call('DELETE', `/attendance/${baked._id}`, A.managerToken));   // the manager cancels the leave day
        // no shift on this record, so lateness does not depend on the time of day the test runs
        await seedDay(A, baker, { date: todayKey(), checkIn: '12:00 AM', checkOut: '12:30 AM', totalHours: 0.5 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 3, late: 1, absent: 0 });
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
    });
    test('other stores and franchises: own numbers only; kitchen staff do not get the staff widgets', async () => {
        assert.deepEqual(await widget(B.managerToken, 'staff-duty'), { staffOnDuty: 0 });
        assert.deepEqual(await widget(B.managerToken, 'staff-overview'), { present: 0, late: 0, absent: 0 });
        assert.equal((await fx.call('GET', `/v1/store/dashboard/staff-duty?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.deepEqual(await widget(A.adminToken, 'staff-duty', `?storeId=${A.storeId}`), { staffOnDuty: 1 });
        assert.equal((await fx.call('GET', `/v1/store/dashboard/staff-duty?storeId=${A.storeId}`, B.adminToken)).status, 404);
        for (const t of [packer.token, pizza.token]) assert.equal((await fx.call('GET', '/v1/store/dashboard/staff-overview', t)).status, 403);
    });
    test('yesterday\'s attendance does not count today', async () => {
        await resetAttendance();
        await seedDay(A, pizza, { date: daysBack(1) });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 0, late: 0, absent: 0 });
    });
});
