// Attendance for the whole store team, and who may act on it:
//   - the store manager clocks in and out too, and work (any write in the store panel) is refused until they have
//   - the store manager marks kitchen staff absent or on leave (never present: staff clock in themselves), never themselves
//   - the franchise admin sees every record of its stores (managers too) and marks present / absent / leave on behalf,
//     with a reason; that unblocks a manager who could not clock in
//   - the person is told (in-app record; push is sent to their saved devices)
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let chef; let bBaker;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const call = (method, path, token, body) => fx.call(method, `/v1/store${path}`, token, body);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// a start time a few minutes ago, as "hh:mm AM" (the same day)
const minutesAgo = (n) => { const d = new Date(Date.now() - n * 60000); const h = d.getHours(); return `${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const workAsB = () => fx.call('PUT', '/v1/food/store/open-status', B.managerToken, { open: true });

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    chef = await fx.staff('A', 'Pizza Maker', 'arole', { clockIn: false });
    bBaker = await fx.staff('B', 'Baker', 'brole', { clockIn: false });   // made before B's manager clocks out below
});
after(async () => { await fx?.teardown(); });

describe('the store manager marks attendance first', () => {
    test('a clocked-in manager works; after clocking out, work is refused with a clear message', async () => {
        ok(await workAsB());
        ok(await call('POST', '/attendance/clock-out', B.managerToken));
        const refused = await workAsB();
        assert.equal(refused.status, 403);
        assert.equal(refused.body.code, 'ATTENDANCE_REQUIRED');
        assert.match(refused.body.message, /Mark your attendance first/);
        assert.equal((await fx.call('GET', '/v1/food/store/open-status', B.managerToken)).status, 200, 'reading stays open');
    });
    test('the manager sees their own day and history', async () => {
        const t = ok(await call('GET', '/attendance/today', B.managerToken));
        assert.equal(t.state, 'clocked_out');
        assert.equal(ok(await call('GET', '/attendance/me', B.managerToken)).length, 1);
    });
});

describe('store manager marks kitchen staff', () => {
    test('absent with a reason (not present, not themselves); the staff member is told', async () => {
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: chef.staffId, date: today(), status: 'present', notes: 'came in' })).status, 403);
        assert.equal((await call('POST', '/attendance', A.managerToken, { staffId: chef.staffId, date: today(), status: 'absent', notes: 'no' })).status, 400, 'a reason');
        const rec = ok(await call('POST', '/attendance', A.managerToken, { staffId: chef.staffId, date: today(), status: 'absent', notes: 'Did not come, no call' }), 201);
        assert.deepEqual([rec.status, rec.source, rec.markedBy], ['absent', 'manager', 'Manager A']);
        assert.equal((await call('POST', '/attendance/clock-in', chef.token)).status, 409, 'an absent day cannot be clocked in');
        const notes = await mongoose.connection.collection('food_task_notifications').find({ userId: new mongoose.Types.ObjectId(chef.id), type: 'attendance' }).toArray();
        assert.equal(notes.length, 1);
        // a mistake can be taken back, then the person clocks in
        ok(await call('DELETE', `/attendance/${rec._id}`, A.managerToken));
        ok(await call('POST', '/attendance/clock-in', chef.token), 201);
    });
    test('another store\'s manager cannot mark this staff member (404)', async () => {
        assert.equal((await call('POST', '/attendance', B.managerToken, { staffId: chef.staffId, date: today(), status: 'absent', notes: 'Not my staff member' })).status, 404);
    });
});

describe('franchise admin', () => {
    test('sees the store manager\'s own records along with the staff', async () => {
        const rows = ok(await call('GET', `/attendance?storeId=${A.storeId}&date=${today()}`, A.adminToken));
        const names = rows.map((r) => r.staffName);
        assert.ok(names.includes('Manager A'), JSON.stringify(names));
    });
    test('marks the store manager present on behalf (a reason and a start time), which unblocks their work', async () => {
        const bRec = ok(await call('GET', `/attendance?storeId=${B.storeId}&date=${today()}`, B.adminToken)).find((r) => r.staffName === 'Manager B');
        assert.ok(bRec, 'the manager clocked in and out themselves today');
        const mine = await call('POST', `/attendance?storeId=${B.storeId}`, B.adminToken, { staffId: bRec.staffId, date: today(), status: 'present', checkIn: '09:00 AM', notes: 'Phone broken, confirmed on call' });
        assert.equal(mine.status, 409, 'a day the manager clocked themselves cannot be replaced');
        assert.equal((await call('POST', `/attendance?storeId=${B.storeId}`, A.adminToken, { staffId: bRec.staffId, date: today(), status: 'absent', notes: 'Not my store at all' })).status, 404, 'another franchise');
        assert.equal((await call('POST', `/attendance?storeId=${B.storeId}`, B.adminToken, { staffId: bRec.staffId, date: today(), status: 'present', notes: 'x' })).status, 400, 'a reason');
    });
    test('marks a kitchen staff member present on behalf; the record says so', async () => {
        const staff = bBaker;
        const rec = ok(await call('POST', `/attendance?storeId=${B.storeId}`, B.adminToken, { staffId: staff.staffId, date: today(), status: 'present', checkIn: minutesAgo(1), notes: 'Clock-in screen was down' }), 201);
        assert.deepEqual([rec.status, rec.source], ['present', 'admin']);
        // on behalf = on duty: the staff member can now work (no new clock-in needed)
        assert.equal(ok(await call('GET', '/attendance/today', staff.token)).clockedIn, true);
        ok(await call('DELETE', `/attendance/${rec._id}?storeId=${B.storeId}`, B.adminToken));
    });
    test('kitchen staff cannot mark anyone', async () => {
        assert.equal((await call('POST', '/attendance', chef.token, { staffId: chef.staffId, date: today(), status: 'absent', notes: 'testing it' })).status, 403);
    });
});
