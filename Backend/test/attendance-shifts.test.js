// Feature 7: shifts and attendance (/v1/store/shifts, /v1/store/attendance) and the dashboard staff widgets that read them.
// Role and scope come from the token only: store manager manages and marks, kitchen supervisor reads the store and clocks
// itself, kitchen staff clocks itself and reads only its own records, franchise admin reads one of its own stores, and
// anything of another store or franchise is 404.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';
import { formatClock, dateKeyOf } from '../src/modules/food/store/services/attendanceTime.js';

let fx; let A; let B;
let sup; let pizza; let baker; let bSup; let bStaff;   // { id (user id), staffId (StoreManager id), token }
let phoneSeq = 0;
const objectId = (v) => new mongoose.Types.ObjectId(String(v));

const login = async (email) => (await fx.call('POST', '/v1/auth/store/login', null, { email, password: PASSWORD })).body.data.accessToken;
const makeStaff = async (manager, role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', manager, { fullName: `Name ${tag}`, email, phone: `7${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    const rec = await fx.models.StoreManager.findOne({ userId: objectId(res.body.data.userId) }).lean();
    return { id: res.body.data.userId, staffId: String(rec._id), token: await login(email) };
};
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const call = (method, path, token, body) => fx.call(method, `/v1/store${path}`, token, body);
const todayKey = () => dateKeyOf(new Date());
const daysBack = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateKeyOf(d); };
/** "hh:mm AM" for `minutes` minutes ago */
const clockAgo = (minutes) => { const d = new Date(Date.now() - minutes * 60000); return formatClock(d.getHours() * 60 + d.getMinutes()); };
const resetAttendance = () => fx.models.FoodOrder.db.collection('food_store_attendance').deleteMany({});

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'asup');
    pizza = await makeStaff(A.managerToken, 'Pizza Maker', 'apizza');
    baker = await makeStaff(A.managerToken, 'Baker', 'abaker');
    bSup = await makeStaff(B.managerToken, 'Kitchen Supervisor', 'bsup');
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
        ['POST', '/attendance'], ['POST', '/attendance/bulk'], ['PUT', `/attendance/${ID}`], ['DELETE', `/attendance/${ID}`],
    ];
    test('anonymous callers get 401 everywhere', async () => {
        for (const [m, p] of endpoints) assert.equal((await call(m, p)).status, 401, `${m} ${p}`);
    });
    test('customers and delivery partners get 403 everywhere', async () => {
        const rider = await fx.partner('approved');
        for (const token of [A.customerToken, rider.token]) for (const [m, p] of endpoints) assert.equal((await call(m, p, token)).status, 403, `${m} ${p}`);
    });
    test('supervisor and kitchen staff cannot change shifts or attendance', async () => {
        const writes = [['POST', '/shifts'], ['PUT', `/shifts/${ID}`], ['DELETE', `/shifts/${ID}`], ['POST', `/shifts/${ID}/assign`],
            ['POST', '/attendance'], ['POST', '/attendance/bulk'], ['PUT', `/attendance/${ID}`], ['DELETE', `/attendance/${ID}`]];
        for (const token of [sup.token, pizza.token]) for (const [m, p] of writes) assert.equal((await call(m, p, token, {})).status, 403, `${m} ${p}`);
    });
    test('the store manager, franchise admin and super admin do not clock in', async () => {
        for (const token of [A.managerToken, A.adminToken, fx.SA]) {
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
        const a = ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [sup.staffId, pizza.staffId] }));
        assert.deepEqual(a.assignedStaff.sort(), [sup.staffId, pizza.staffId].sort());
        const rec = await fx.models.StoreManager.findById(pizza.staffId).lean();
        assert.equal(rec.personalDetails.shiftType, 'Morning');
        assert.equal(rec.personalDetails.startTime, '09:00 AM');

        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [sup.staffId, pizza.staffId, baker.staffId] })).status, 400, 'maxStaff 2');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [bStaff.staffId] })).status, 404, 'another store\'s staff');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [A.managerId] })).status, 404, 'the manager is not kitchen staff');
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: ['x'] })).status, 400);
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, {})).status, 400);

        // moving pizza to the evening takes them off the morning
        const e = ok(await call('POST', `/shifts/${evening._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
        assert.deepEqual(e.assignedStaff, [pizza.staffId]);
        assert.deepEqual(ok(await call('GET', `/shifts/${morning._id}`, A.managerToken)).assignedStaff, [sup.staffId]);
        assert.equal((await fx.models.StoreManager.findById(pizza.staffId).lean()).personalDetails.shiftType, 'Evening');
        // an empty list clears the shift and the staff record
        ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [] }));
        assert.equal((await fx.models.StoreManager.findById(sup.staffId).lean()).personalDetails.shiftType, undefined);
        ok(await call('POST', `/shifts/${morning._id}/assign`, A.managerToken, { staffIds: [sup.staffId, baker.staffId] }));
    });
    test('delete: assignments are cleared and attendance history keeps its record', async () => {
        const temp = ok(await call('POST', '/shifts', A.managerToken, { shiftName: 'Temp', startTime: '06:00 AM', endTime: '07:00 AM' }), 201);
        ok(await call('POST', `/shifts/${temp._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
        const rec = ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, shiftId: temp._id, date: daysBack(5), checkIn: '06:02 AM', checkOut: '07:00 AM', status: 'present' }), 201);
        ok(await call('DELETE', `/shifts/${temp._id}`, A.managerToken));
        assert.equal((await call('GET', `/shifts/${temp._id}`, A.managerToken)).status, 404);
        assert.equal((await fx.models.StoreManager.findById(pizza.staffId).lean()).personalDetails.shiftType, undefined);
        assert.equal(ok(await call('GET', `/attendance/${rec._id}`, A.managerToken)).shiftId, null);
        ok(await call('DELETE', `/attendance/${rec._id}`, A.managerToken));
        ok(await call('POST', `/shifts/${evening._id}/assign`, A.managerToken, { staffIds: [pizza.staffId] }));
    });
});

describe('shifts: who sees what, and other stores', () => {
    test('manager and supervisor see every shift of the store; kitchen staff only the one they are on', async () => {
        assert.equal(ok(await call('GET', '/shifts', A.managerToken)).length, 2);
        assert.equal(ok(await call('GET', '/shifts', sup.token)).length, 2);
        const mine = ok(await call('GET', '/shifts', pizza.token));
        assert.deepEqual(mine.map((s) => s.shiftName), ['Evening']);
        const morning = ok(await call('GET', '/shifts', A.managerToken)).find((s) => s.shiftName === 'Morning');
        assert.equal((await call('GET', `/shifts/${morning._id}`, pizza.token)).status, 404, 'a shift they are not on');
        assert.equal((await call('GET', `/shifts/${morning._id}`, baker.token)).status, 200);
        assert.equal((await call('GET', '/shifts', bStaff.token)).body.data.length, 0);
    });
    test('another store\'s manager and staff cannot read or change these shifts (404)', async () => {
        const [morning] = ok(await call('GET', '/shifts', A.managerToken));
        for (const token of [B.managerToken, bSup.token, bStaff.token]) assert.equal((await call('GET', `/shifts/${morning._id}`, token)).status, 404);
        assert.equal((await call('PUT', `/shifts/${morning._id}`, B.managerToken, { shiftName: 'Hijacked' })).status, 404);
        assert.equal((await call('DELETE', `/shifts/${morning._id}`, B.managerToken)).status, 404);
        assert.equal((await call('POST', `/shifts/${morning._id}/assign`, B.managerToken, { staffIds: [bStaff.staffId] })).status, 404);
        assert.deepEqual(ok(await call('GET', '/shifts', B.managerToken)).map((s) => s.shiftName), ['Morning']);   // B's own, not A's
        assert.equal(ok(await call('GET', '/shifts', B.managerToken))[0].storeId, B.storeId);
        assert.equal((await call('GET', `/shifts?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.equal((await call('GET', `/shifts?storeId=${B.storeId}`, sup.token)).status, 404);
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

describe('attendance: store manager marks and edits', () => {
    let rec;
    test('mark present: hours and overtime are worked out by the server; markedBy is the manager; client numbers and ids are ignored', async () => {
        const [morning] = ok(await call('GET', '/shifts', A.managerToken));   // 09:00 AM - 05:00 PM (8 h)
        rec = ok(await call('POST', '/attendance', A.managerToken, {
            staffId: baker.staffId, shiftId: morning._id, date: daysBack(1), checkIn: '09:05 AM', checkOut: '06:05 PM', status: 'present', notes: 'Stayed late',
            totalHours: 99, overtimeHours: 50, markedBy: 'Someone Else', storeId: B.storeId, userId: bStaff.id, late: false,
        }), 201);
        assert.equal(rec.totalHours, 9);
        assert.equal(rec.overtimeHours, 1);
        assert.equal(rec.checkIn, '09:05 AM');
        assert.equal(rec.checkOut, '06:05 PM');
        assert.equal(rec.markedBy, 'Manager A');
        assert.equal(rec.source, 'manager');
        assert.equal(rec.storeId, A.storeId);
        assert.equal(rec.staffName, 'Name abaker');
        assert.equal(rec.late, false, '5 minutes is inside the grace period');
        assert.equal(rec.notes, 'Stayed late');
        const stored = await fx.models.FoodOrder.db.collection('food_store_attendance').findOne({ _id: objectId(rec._id) });
        assert.equal(String(stored.userId), baker.id, 'the person\'s user id comes from their staff record');
        for (const k of ['_id', 'storeId', 'staffId', 'shiftId', 'date', 'checkIn', 'checkOut', 'totalHours', 'overtimeHours', 'status', 'markedBy', 'notes', 'createdAt']) assert.ok(k in rec, k);
    });
    test('late: more than 10 minutes after the shift start', async () => {
        const [morning] = ok(await call('GET', '/shifts', A.managerToken));
        const r = ok(await call('POST', '/attendance', A.managerToken, { staffId: sup.staffId, shiftId: morning._id, date: daysBack(2), checkIn: '09:40 AM', checkOut: '05:00 PM', status: 'present' }), 201);
        assert.equal(r.late, true);
        assert.equal(r.lateMinutes, 40);
    });
    test('the same person and day cannot be recorded twice (409); another store\'s staff, shift and ids are 404', async () => {
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: daysBack(1), checkIn: '09:00 AM', status: 'present' })).status, 409);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: bStaff.staffId, date: daysBack(1), checkIn: '09:00 AM', status: 'present' })).status, 404);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: A.managerId, date: daysBack(1), checkIn: '09:00 AM', status: 'present' })).status, 404, 'the manager is not marked here');
        const [bShift] = ok(await call('GET', '/shifts', B.managerToken));
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, shiftId: bShift._id, date: daysBack(3), checkIn: '09:00 AM', status: 'present' })).status, 404);
        assert.equal((await call('POST', `/attendance?storeId=${B.storeId}`, A.managerToken, { staffId: pizza.staffId, date: daysBack(3), checkIn: '09:00 AM', status: 'present' })).status, 404);
    });
    test('validation: present needs a check-in, no future days, no unknown status', async () => {
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(4), status: 'present' })).status, 400);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: '2999-01-01', checkIn: '09:00 AM', status: 'present' })).status, 400);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(4), checkIn: '09:00 AM', status: 'late' })).status, 400);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: '25-06-2026', checkIn: '09:00 AM', status: 'present' })).status, 400);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: 'abc', date: daysBack(4), status: 'absent' })).status, 400);
    });
    test('absent and leave carry no times or hours; an overnight check-out is the next day', async () => {
        const a = ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(3), checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'absent' }), 201);
        assert.deepEqual([a.checkIn, a.checkOut, a.totalHours, a.overtimeHours, a.late], ['', '', 0, 0, false]);
        const night = ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(6), checkIn: '11:00 PM', checkOut: '07:00 AM', status: 'present' }), 201);
        assert.equal(night.totalHours, 8);
    });
    test('list: filters by date, status, search, role and shift; newest first', async () => {
        const all = ok(await call('GET', '/attendance', A.managerToken));
        assert.ok(all.length >= 4);
        assert.deepEqual(all.map((r) => r.date), [...all.map((r) => r.date)].sort().reverse());
        assert.equal(ok(await call('GET', `/attendance?date=${daysBack(1)}`, A.managerToken)).length, 1);
        assert.ok(ok(await call('GET', '/attendance?status=absent', A.managerToken)).every((r) => r.status === 'absent'));
        assert.deepEqual(ok(await call('GET', '/attendance?search=abaker', A.managerToken)).map((r) => r.staffName), ['Name abaker']);
        assert.equal(ok(await call('GET', '/attendance?search=.*', A.managerToken)).length, 0, 'search text is literal');
        assert.ok(ok(await call('GET', '/attendance?role=Baker', A.managerToken)).every((r) => r.role === 'Baker'));
        assert.equal(ok(await call('GET', `/attendance?shiftId=${rec.shiftId}`, A.managerToken)).filter((r) => r.shiftId !== rec.shiftId).length, 0);
        assert.equal((await call('GET', '/attendance?status[$ne]=x', A.managerToken)).status, 400);
        assert.equal((await call('GET', '/attendance?status=bogus', A.managerToken)).status, 400);
        assert.equal((await call('GET', '/attendance?date=yesterday', A.managerToken)).status, 400);
    });
    test('edit: corrections recompute the hours; the id and store cannot be changed', async () => {
        const u = ok(await call('PUT', `/attendance/${rec._id}`, A.managerToken, { checkOut: '05:05 PM', notes: 'Fixed', storeId: B.storeId, staffId: pizza.staffId, totalHours: 1 }));
        assert.equal(u.totalHours, 8);
        assert.equal(u.overtimeHours, 0);
        assert.equal(u.notes, 'Fixed');
        assert.equal(u.storeId, A.storeId);
        assert.equal(u.staffId, baker.staffId);
        const off = ok(await call('PUT', `/attendance/${rec._id}`, A.managerToken, { status: 'leave' }));
        assert.deepEqual([off.status, off.checkIn, off.totalHours], ['leave', '', 0]);
        const back = ok(await call('PUT', `/attendance/${rec._id}`, A.managerToken, { status: 'present', checkIn: '09:00 AM', checkOut: '05:00 PM' }));
        assert.equal(back.totalHours, 8);
        // moving a record onto a day where the same person already has one is refused
        const other = ok(await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: daysBack(7), checkIn: '09:00 AM', status: 'present' }), 201);
        assert.equal((await call('PUT', `/attendance/${other._id}`, A.managerToken, { date: daysBack(1) })).status, 409);
        ok(await call('DELETE', `/attendance/${other._id}`, A.managerToken));
    });
    test('bulk: one status per person for the day; running it again replaces', async () => {
        const date = daysBack(8);
        const r = ok(await call('POST', '/attendance/bulk', A.managerToken, { date, attendances: [{ staffId: pizza.staffId, status: 'present' }, { staffId: baker.staffId, status: 'absent' }], storeId: B.storeId }), 201);
        assert.equal(r.length, 2);
        assert.deepEqual(r.map((x) => x.status).sort(), ['absent', 'present']);
        assert.ok(r.every((x) => x.date === date && x.storeId === A.storeId && x.markedBy === 'Manager A'));
        const again = ok(await call('POST', '/attendance/bulk', A.managerToken, { date, attendances: [{ staffId: pizza.staffId, status: 'leave' }, { staffId: baker.staffId, status: 'present' }] }), 201);
        assert.equal(again.length, 2);
        assert.equal(ok(await call('GET', `/attendance?date=${date}`, A.managerToken)).length, 2, 'replaced, not duplicated');
        assert.deepEqual(ok(await call('GET', `/attendance?date=${date}&status=leave`, A.managerToken)).map((x) => x.staffId), [pizza.staffId]);
        assert.equal((await call('POST', '/attendance/bulk', A.managerToken, { date, attendances: [{ staffId: bStaff.staffId, status: 'present' }] })).status, 404);
        assert.equal((await call('POST', '/attendance/bulk', A.managerToken, { date, attendances: [{ staffId: pizza.staffId, status: 'present' }, { staffId: pizza.staffId, status: 'absent' }] })).status, 400);
        assert.equal((await call('POST', '/attendance/bulk', A.managerToken, { date, attendances: [] })).status, 400);
    });
    test('delete', async () => {
        const r = ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(9), checkIn: '09:00 AM', status: 'present' }), 201);
        ok(await call('DELETE', `/attendance/${r._id}`, A.managerToken));
        assert.equal((await call('GET', `/attendance/${r._id}`, A.managerToken)).status, 404);
        assert.equal((await call('DELETE', `/attendance/${r._id}`, A.managerToken)).status, 404);
    });
});

describe('attendance: other stores and franchises', () => {
    test('another store\'s manager, supervisor and staff see none of it and cannot touch it', async () => {
        const [one] = ok(await call('GET', '/attendance', A.managerToken));
        for (const token of [B.managerToken, bSup.token, bStaff.token]) {
            assert.equal((await call('GET', `/attendance/${one._id}`, token)).status, 404);
        }
        assert.equal(ok(await call('GET', '/attendance', B.managerToken)).length, 0);
        assert.equal(ok(await call('GET', '/attendance', bSup.token)).length, 0);
        assert.equal((await call('PUT', `/attendance/${one._id}`, B.managerToken, { notes: 'x' })).status, 404);
        assert.equal((await call('DELETE', `/attendance/${one._id}`, B.managerToken)).status, 404);
        assert.equal((await call('GET', `/attendance?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.equal((await fx.models.FoodOrder.db.collection('food_store_attendance').findOne({ _id: objectId(one._id) })).notes !== 'x', true);
    });
    test('franchise admin reads one of its own stores, never writes; another franchise gets 404', async () => {
        const [one] = ok(await call('GET', '/attendance', A.managerToken));
        assert.equal((await call('GET', '/attendance', A.adminToken)).status, 400);
        assert.ok(ok(await call('GET', `/attendance?storeId=${A.storeId}`, A.adminToken)).length >= 4);
        assert.equal((await call('GET', `/attendance?storeId=${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await call('GET', `/attendance?storeId=${A.storeId}`, B.adminToken)).status, 404);
        assert.equal((await call('GET', `/attendance/${one._id}?storeId=${A.storeId}`, A.adminToken)).status, 200);
        assert.equal((await call('GET', `/attendance/${one._id}?storeId=${A.storeId}`, B.adminToken)).status, 404);
        for (const [m, p, b] of [['POST', '/attendance', { staffId: pizza.staffId, date: daysBack(2), status: 'absent' }], ['POST', '/attendance/bulk', { date: daysBack(2), attendances: [{ staffId: pizza.staffId, status: 'absent' }] }],
            ['PUT', `/attendance/${one._id}`, { notes: 'x' }], ['DELETE', `/attendance/${one._id}`, {}]]) {
            assert.equal((await call(m, `${p}${p.includes('?') ? '&' : '?'}storeId=${A.storeId}`, A.adminToken, b)).status, 403, `${m} ${p}`);
        }
    });
});

describe('attendance: clocking in and out (kitchen supervisor and staff)', () => {
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
        ok(await call('POST', `/shifts/${sched._id}/assign`, A.managerToken, { staffIds: [sup.staffId] }));
        const onTime = ok(await call('POST', '/attendance/clock-in', sup.token), 201);
        assert.equal(onTime.late, false);
        assert.equal(onTime.lateMinutes, 0);
    });
    test('an account on leave or suspended cannot clock in (403)', async () => {
        await fx.models.FoodOrder.db.collection('food_store_attendance').deleteMany({ staffId: objectId(sup.staffId) });
        for (const status of ['On Leave', 'Suspended']) {
            await fx.models.StoreManager.updateOne({ _id: sup.staffId }, { $set: { status } });
            assert.equal((await call('POST', '/attendance/clock-in', sup.token)).status, 403, status);
        }
        await fx.models.StoreManager.updateOne({ _id: sup.staffId }, { $set: { status: 'Active' } });
        assert.equal((await call('POST', '/attendance/clock-in', sup.token)).status, 201);
    });
    test('a day the manager already marked cannot be clocked in over', async () => {
        await resetAttendance();
        ok(await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: todayKey(), status: 'absent' }), 201);
        assert.equal((await call('POST', '/attendance/clock-in', baker.token)).status, 409);
        await resetAttendance();
    });
    test('another store\'s staff clock in to their own store', async () => {
        const rec = ok(await call('POST', '/attendance/clock-in', bStaff.token), 201);
        assert.equal(rec.storeId, B.storeId);
        assert.equal(ok(await call('GET', '/attendance', A.managerToken)).length, 0, 'store A does not see it');
    });
});

describe('attendance: kitchen staff read only their own; the supervisor reads the store', () => {
    let pizzaRec; let bakerRec;
    before(async () => {
        await resetAttendance();
        pizzaRec = ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(1), checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present' }), 201);
        bakerRec = ok(await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: daysBack(1), checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present' }), 201);
        ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(2), status: 'leave' }), 201);
    });
    test('kitchen staff: list is their own whatever the query says; another person\'s record is 404', async () => {
        const own = ok(await call('GET', '/attendance', pizza.token));
        assert.deepEqual(own.map((r) => r.staffId), [pizza.staffId, pizza.staffId]);
        assert.equal(ok(await call('GET', '/attendance?search=abaker', pizza.token)).every((r) => r.staffId === pizza.staffId), true);
        assert.equal(ok(await call('GET', '/attendance?role=Baker', pizza.token)).every((r) => r.staffId === pizza.staffId), true, 'filters never widen what they can see');
        assert.equal((await call('GET', `/attendance/${bakerRec._id}`, pizza.token)).status, 404);
        assert.equal((await call('GET', `/attendance/${pizzaRec._id}`, pizza.token)).status, 200);
    });
    test('/me is always the caller\'s own history, supervisors included', async () => {
        assert.equal(ok(await call('POST', '/attendance', A.managerToken, { staffId: sup.staffId, date: daysBack(1), checkIn: '08:00 AM', checkOut: '04:00 PM', status: 'present' }), 201).staffId, sup.staffId);
        assert.deepEqual(ok(await call('GET', '/attendance/me', sup.token)).map((r) => r.staffId), [sup.staffId]);
        assert.equal(ok(await call('GET', '/attendance/me', pizza.token)).length, 2);
        assert.equal(ok(await call('GET', `/attendance/me?from=${daysBack(1)}`, pizza.token)).length, 1);
        assert.equal(ok(await call('GET', '/attendance/me?status=leave', pizza.token)).length, 1);
    });
    test('supervisor reads the whole store\'s attendance but cannot write', async () => {
        assert.equal(ok(await call('GET', '/attendance', sup.token)).length, 4);
        assert.equal((await call('GET', `/attendance/${bakerRec._id}`, sup.token)).status, 200);
        assert.equal((await call('PUT', `/attendance/${bakerRec._id}`, sup.token, { notes: 'x' })).status, 403);
        assert.equal((await call('DELETE', `/attendance/${bakerRec._id}`, sup.token)).status, 403);
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
        ok(await call('POST', '/attendance/clock-in', sup.token), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
        ok(await call('POST', '/attendance/clock-in', pizza.token), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 2 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 0 });
        ok(await call('POST', '/attendance/clock-out', pizza.token));
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 0 });
    });
    test('absent and leave: marked by the manager, or an account on leave that did not turn up', async () => {
        ok(await call('POST', '/attendance', A.managerToken, { staffId: baker.staffId, date: todayKey(), status: 'absent' }), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 1 });
        await fx.models.StoreManager.updateOne({ _id: sup.staffId }, { $set: { status: 'On Leave' } });
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 2, late: 1, absent: 1 }, 'sup already worked today, so not absent');
        await fx.models.StoreManager.updateOne({ _id: sup.staffId }, { $set: { status: 'Active' } });
    });
    test('a manager-marked present day counts as present but not as on duty', async () => {
        const baked = ok(await call('GET', `/attendance?date=${todayKey()}&search=abaker`, A.managerToken))[0];
        // no shift on this record, so lateness does not depend on the time of day the test runs
        ok(await call('PUT', `/attendance/${baked._id}`, A.managerToken, { status: 'present', shiftId: '', checkIn: '09:00 AM', checkOut: '10:00 AM' }));
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 3, late: 1, absent: 0 });
        assert.deepEqual(await widget(A.managerToken, 'staff-duty'), { staffOnDuty: 1 });
    });
    test('other stores and franchises: own numbers only; supervisors and staff do not get the staff widgets', async () => {
        assert.deepEqual(await widget(B.managerToken, 'staff-duty'), { staffOnDuty: 0 });
        assert.deepEqual(await widget(B.managerToken, 'staff-overview'), { present: 0, late: 0, absent: 0 });
        assert.equal((await fx.call('GET', `/v1/store/dashboard/staff-duty?storeId=${A.storeId}`, B.managerToken)).status, 404);
        assert.deepEqual(await widget(A.adminToken, 'staff-duty', `?storeId=${A.storeId}`), { staffOnDuty: 1 });
        assert.equal((await fx.call('GET', `/v1/store/dashboard/staff-duty?storeId=${A.storeId}`, B.adminToken)).status, 404);
        for (const t of [sup.token, pizza.token]) assert.equal((await fx.call('GET', '/v1/store/dashboard/staff-overview', t)).status, 403);
    });
    test('yesterday\'s attendance does not count today', async () => {
        await resetAttendance();
        ok(await call('POST', '/attendance', A.managerToken, { staffId: pizza.staffId, date: daysBack(1), checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'present' }), 201);
        assert.deepEqual(await widget(A.managerToken, 'staff-overview'), { present: 0, late: 0, absent: 0 });
    });
});
