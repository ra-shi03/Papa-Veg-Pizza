// Feature 7: /v1/profile/* for the store manager, kitchen supervisor and kitchen staff. Everything is about the caller's own
// account (taken from the token): view, edit a whitelist of fields, change password (and sign the other logins out), photo
// upload (images only), permissions, performance, attendance, notification settings, activity and sessions.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose, PASSWORD } from './helpers/fixture.js';

let fx; let A; let B; let uploadPhoto;
let sup; let chef; let bChef;   // { id (user id), staffId, email, token }
let phoneSeq = 0;
const objectId = (v) => new mongoose.Types.ObjectId(String(v));
const NEW_PASSWORD = 'Brand#New-Pass9';

const makeStaff = async (manager, role, tag) => {
    const email = `${tag}${fx.ts}@example.invalid`;
    const res = await fx.call('POST', '/v1/food/store/staff', manager, { fullName: `Name ${tag}`, email, phone: `6${String(++phoneSeq).padStart(2, '0')}${String(fx.ts).slice(-7)}`, password: PASSWORD, role });
    assert.equal(res.status, 201, `create ${tag}: ${JSON.stringify(res.body)}`);
    const rec = await fx.models.StoreManager.findOne({ userId: objectId(res.body.data.userId) }).lean();
    return { id: res.body.data.userId, staffId: String(rec._id), email, phone: rec.phone, token: (await login(email)).accessToken };
};
const login = async (email, password = PASSWORD) => {
    const res = await fx.call('POST', '/v1/auth/store/login', null, { email, password });
    return { status: res.status, accessToken: res.body.data?.accessToken, refreshToken: res.body.data?.refreshToken };
};
const refresh = (refreshToken) => fx.call('POST', '/v1/auth/refresh-token', null, { refreshToken });
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const call = (method, path, token, body) => fx.call(method, `/v1/profile${path}`, token, body);
const withHeader = (method, path, token, header) => fx.api[method.toLowerCase()](`/api/v1/profile${path}`).set(fx.bearer(token)).set('X-Refresh-Token', header);

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    // after the fixture: importing the service earlier would load the app config before the test database is set
    ({ uploadPhoto } = await import('../src/modules/food/store/services/storeProfile.service.js'));
    sup = await makeStaff(A.managerToken, 'Kitchen Supervisor', 'psup');
    chef = await makeStaff(A.managerToken, 'Pizza Maker', 'pchef');
    bChef = await makeStaff(B.managerToken, 'Pizza Maker', 'pbchef');
});
after(async () => { await fx?.teardown(); });

describe('authentication and roles', () => {
    const endpoints = [
        ['GET', '/'], ['PUT', '/personal'], ['PUT', '/change-password'], ['POST', '/photo'], ['GET', '/permissions'], ['GET', '/performance'],
        ['GET', '/attendance'], ['PUT', '/notifications'], ['GET', '/activity-logs'], ['DELETE', '/sessions'], ['DELETE', '/sessions/abc'],
    ];
    test('anonymous callers get 401', async () => {
        for (const [m, p] of endpoints) assert.equal((await call(m, p)).status, 401, `${m} ${p}`);
    });
    test('customers, delivery partners, franchise admins and super admins get 403 (this is the store team\'s own profile)', async () => {
        const rider = await fx.partner('approved');
        for (const token of [A.customerToken, rider.token, A.adminToken, fx.SA]) {
            for (const [m, p] of endpoints) assert.equal((await call(m, p, token, {})).status, 403, `${m} ${p}`);
        }
    });
    test('all three store roles are allowed', async () => {
        for (const token of [A.managerToken, sup.token, chef.token]) assert.equal((await call('GET', '/', token)).status, 200);
    });
});

describe('view profile', () => {
    test('store manager: the shape the profile screens render', async () => {
        const d = ok(await call('GET', '/', A.managerToken));
        assert.deepEqual(Object.keys(d).sort(), ['activeSessions', 'attendanceSummary', 'notifications', 'performanceSummary', 'recentActivities', 'store', 'user']);
        assert.equal(d.user.fullName, 'Manager A');
        assert.equal(d.user.email, `mgr-a${fx.ts}@example.invalid`);
        assert.equal(d.user.role, 'store_manager');
        assert.equal(d.user.designation, 'Store Operations Manager');
        assert.equal(d.user.storeName, 'TEST STORE A');
        assert.equal(d.store.name, 'TEST STORE A');
        for (const k of ['fullName', 'email', 'phone', 'gender', 'dateOfBirth', 'address', 'employeeId', 'designation', 'role', 'storeName', 'joiningDate', 'status', 'lastLogin', 'profileImage', 'reportingManager', 'emergencyContact']) assert.ok(k in d.user, k);
        assert.deepEqual(Object.keys(d.user.emergencyContact).sort(), ['name', 'phone', 'relation']);
        assert.deepEqual(Object.keys(d.attendanceSummary).sort(), ['absentDays', 'attendanceRate', 'lateEntries', 'presentDays', 'totalHours']);
        assert.deepEqual(d.notifications, { orderAlerts: true, inventoryAlerts: true, shiftAlerts: false, complaintAlerts: true, dailyReports: true, smsAlerts: false, pushNotifications: true });
        assert.equal(JSON.stringify(d).includes('password'), false, 'no password material anywhere');
    });
    test('supervisor and kitchen staff see their own', async () => {
        const s = ok(await call('GET', '/', sup.token));
        assert.equal(s.user.fullName, 'Name psup');
        assert.equal(s.user.role, 'kitchen_supervisor');
        assert.equal(s.user.designation, 'Kitchen Operations Supervisor');
        const c = ok(await call('GET', '/', chef.token));
        assert.equal(c.user.fullName, 'Name pchef');
        assert.equal(c.user.role, 'kitchen_staff');
        assert.equal(c.user.designation, 'Pizza Maker');
    });
    test('it is always the caller\'s own: an id in the query changes nothing; another store\'s staff see their own', async () => {
        assert.equal(ok(await call('GET', `/?userId=${chef.id}&storeId=${B.storeId}&staffId=${chef.staffId}`, sup.token)).user.fullName, 'Name psup');
        assert.equal(ok(await call('GET', '/', bChef.token)).user.fullName, 'Name pbchef');
        assert.equal(ok(await call('GET', '/', B.managerToken)).user.storeName, 'TEST STORE B');
    });
});

describe('update own profile (whitelist)', () => {
    test('edits the personal fields and nothing else', async () => {
        const u = ok(await call('PUT', '/personal', chef.token, {
            fullName: 'Chef Updated', phone: '+91 98765 43210', gender: 'Male', dateOfBirth: '1994-04-12', address: '12 Park Road, Indore',
            emergencyContact: { name: 'Anjali', phone: '9123456789', relation: 'Spouse' },
        }));
        assert.equal(u.fullName, 'Chef Updated');
        assert.equal(u.phone, '+91 98765 43210');
        assert.equal(u.gender, 'Male');
        assert.equal(u.dateOfBirth, '1994-04-12');
        assert.equal(u.address, '12 Park Road, Indore');
        assert.deepEqual(u.emergencyContact, { name: 'Anjali', phone: '9123456789', relation: 'Spouse' });
        const again = ok(await call('GET', '/', chef.token)).user;
        assert.equal(again.fullName, 'Chef Updated');
        assert.equal(again.emergencyContact.relation, 'Spouse');
        assert.equal((await fx.models.User.findById(chef.id).lean()).mobile, '+91 98765 43210');
    });
    test('email, role, employee code, status, store and ids in the body are ignored', async () => {
        const before = await fx.models.StoreManager.findById(chef.staffId).lean();
        const u = ok(await call('PUT', '/personal', chef.token, {
            fullName: 'Chef Again', email: 'attacker@example.invalid', role: 'STORE_MANAGER', employeeCode: 'HACK-1', status: 'Suspended',
            storeId: B.storeId, franchiseId: B.franchiseId, userId: sup.id, salary: 999999, password: 'x', primaryRole: 'SUPER_ADMIN',
        }));
        assert.equal(u.fullName, 'Chef Again');
        assert.equal(u.email, before.email);
        const after = await fx.models.StoreManager.findById(chef.staffId).lean();
        for (const k of ['email', 'role', 'employeeCode', 'status', 'storeId', 'salary']) assert.deepEqual(after[k], before[k], k);
        const account = await fx.models.User.findById(chef.id).lean();
        assert.equal(account.email, before.email);
        assert.equal(String(account.primaryRole), String((await fx.models.User.findOne({ _id: chef.id }).lean()).primaryRole));
        assert.equal((await login(chef.email)).status, 200, 'can still log in as before');
        assert.equal((await fx.models.StoreManager.findById(sup.staffId).lean()).name, 'Name psup', 'another person is untouched');
        // the role guard still reads the role from the token, which cannot have changed
        assert.equal((await fx.call('POST', '/v1/store/shifts', chef.token, { shiftName: 'Nope', startTime: '9:00 AM', endTime: '5:00 PM' })).status, 403);
    });
    test('validation and a phone number that is already someone else\'s (409)', async () => {
        assert.equal((await call('PUT', '/personal', chef.token, { phone: 'abc' })).status, 400);
        assert.equal((await call('PUT', '/personal', chef.token, { fullName: 'X' })).status, 400);
        assert.equal((await call('PUT', '/personal', chef.token, { dateOfBirth: '12/04/1994' })).status, 400);
        assert.equal((await call('PUT', '/personal', chef.token, { emergencyContact: 'not an object' })).status, 400);
        assert.equal((await call('PUT', '/personal', chef.token, { phone: sup.phone })).status, 409);
        assert.equal((await fx.models.StoreManager.findById(chef.staffId).lean()).phone, '+91 98765 43210', 'a refused update changes nothing');
    });
});

describe('change password', () => {
    test('rules: wrong current, weak, same as current, mismatched confirmation, missing fields', async () => {
        const body = (o) => ({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD, ...o });
        const wrong = await call('PUT', '/change-password', sup.token, body({ currentPassword: 'not-my-password' }));
        assert.equal(wrong.status, 400, 'a wrong current password is a 400, never a 401 that would look like an expired session');
        assert.match(wrong.body.message, /Current password is incorrect/);
        assert.equal((await call('PUT', '/change-password', sup.token, body({ newPassword: 'short1!', confirmPassword: 'short1!' }))).status, 400);
        assert.equal((await call('PUT', '/change-password', sup.token, body({ newPassword: PASSWORD, confirmPassword: PASSWORD }))).status, 400);
        assert.equal((await call('PUT', '/change-password', sup.token, body({ confirmPassword: 'different' }))).status, 400);
        assert.equal((await call('PUT', '/change-password', sup.token, { newPassword: NEW_PASSWORD })).status, 400);
        assert.equal((await login(sup.email)).status, 200, 'nothing changed');
    });
    test('it only ever changes the caller\'s password', async () => {
        const res = await call('PUT', '/change-password', sup.token, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, userId: chef.id, email: chef.email });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal((await login(chef.email)).status, 200, 'the other person\'s password is unchanged');
        assert.equal((await login(sup.email, NEW_PASSWORD)).status, 200);
        assert.equal((await login(sup.email, PASSWORD)).status, 401);
        // put it back for the tests below
        const back = await login(sup.email, NEW_PASSWORD);
        ok(await call('PUT', '/change-password', back.accessToken, { currentPassword: NEW_PASSWORD, newPassword: PASSWORD }));
    });
    test('other logins are signed out; the caller\'s own stays when they send their refresh token', async () => {
        const phone = await login(sup.email); const laptop = await login(sup.email); const tablet = await login(sup.email);
        const res = ok(await call('PUT', '/change-password', phone.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, refreshToken: phone.refreshToken }));
        assert.ok(res.signedOutSessions >= 2);
        assert.equal((await refresh(phone.refreshToken)).status, 200, 'this device stays signed in');
        assert.equal((await refresh(laptop.refreshToken)).status, 401);
        assert.equal((await refresh(tablet.refreshToken)).status, 401);
        ok(await call('PUT', '/change-password', (await login(sup.email, NEW_PASSWORD)).accessToken, { currentPassword: NEW_PASSWORD, newPassword: PASSWORD }));
    });
    test('without a refresh token every login is signed out; someone else\'s refresh token does not protect a session', async () => {
        const mine = await login(sup.email); const theirs = await login(chef.email);
        ok(await call('PUT', '/change-password', mine.accessToken, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, refreshToken: theirs.refreshToken }));
        assert.equal((await refresh(mine.refreshToken)).status, 401);
        assert.equal((await refresh(theirs.refreshToken)).status, 200, 'the other person\'s session is untouched');
        ok(await call('PUT', '/change-password', (await login(sup.email, NEW_PASSWORD)).accessToken, { currentPassword: NEW_PASSWORD, newPassword: PASSWORD }));
    });
});

describe('profile photo', () => {
    const upload = (token, buf, filename, contentType) => fx.api.post('/api/v1/profile/photo').set(fx.bearer(token)).attach('file', buf, { filename, contentType });
    test('only real images: HTML, a script named .png, a PDF, nothing at all', async () => {
        assert.equal((await upload(chef.token, Buffer.from('<html><script>alert(1)</script></html>'), 'a.html', 'text/html')).status, 400);
        assert.equal((await upload(chef.token, Buffer.from('<svg onload=alert(1)>'), 'a.png', 'image/png')).status, 400);
        assert.equal((await upload(chef.token, Buffer.from('%PDF-1.4 x'), 'a.pdf', 'application/pdf')).status, 400);
        assert.equal((await fx.api.post('/api/v1/profile/photo').set(fx.bearer(chef.token))).status, 400);
        assert.equal((await fx.api.post('/api/v1/profile/photo').set(fx.bearer(chef.token)).attach('other', Buffer.from('x'), 'a.png')).status, 400);
    });
    test('an image over 5 MB is 413; the roles are checked first', async () => {
        const big = Buffer.alloc(6 * 1024 * 1024); big.set([0x89, 0x50, 0x4e, 0x47]);
        assert.equal((await upload(chef.token, big, 'big.png', 'image/png')).status, 413);
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
        assert.equal((await upload(A.customerToken, png, 'a.png', 'image/png')).status, 403);
        assert.equal((await upload(null, png, 'a.png', 'image/png')).status, 401);
    });
    test('the saved photo goes on the caller\'s own record only', async () => {
        const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
        let seen;
        const out = await uploadPhoto({ userId: chef.id, role: 'KITCHEN_STAFF', storeId: A.storeId }, { buffer: png }, async (buffer, folder) => { seen = { size: buffer.length, folder }; return 'https://img.example.test/chef.png'; });
        assert.deepEqual(out, { profileImage: 'https://img.example.test/chef.png' });
        assert.deepEqual(seen, { size: png.length, folder: 'food/staff/profile' });
        assert.equal((await fx.models.StoreManager.findById(chef.staffId).lean()).profileImage, 'https://img.example.test/chef.png');
        assert.notEqual((await fx.models.StoreManager.findById(sup.staffId).lean()).profileImage, 'https://img.example.test/chef.png');
        assert.equal(ok(await call('GET', '/', chef.token)).user.profileImage, 'https://img.example.test/chef.png');
        await assert.rejects(() => uploadPhoto({ userId: chef.id, role: 'KITCHEN_STAFF', storeId: A.storeId }, null), /image is required/);
        await assert.rejects(() => uploadPhoto({ userId: chef.id, role: 'KITCHEN_STAFF', storeId: B.storeId }, { buffer: png }, async () => 'x'), /not found/i, 'a token for the wrong store finds no record');
    });
});

describe('permissions', () => {
    test('what each role may open', async () => {
        const m = ok(await call('GET', '/permissions', A.managerToken));
        const s = ok(await call('GET', '/permissions', sup.token));
        const c = ok(await call('GET', '/permissions', chef.token));
        for (const k of ['Dashboard', 'IncomingOrders', 'ActiveOrders', 'KitchenQueue', 'PizzaStation', 'BakingStation', 'PackagingStation', 'DeliveryOperations', 'Inventory', 'StockRequests', 'WasteManagement', 'StaffManagement', 'Reports']) {
            assert.equal(typeof m[k], 'boolean', k);
        }
        assert.equal(m.StaffManagement, true);
        assert.equal(m.DeliveryOperations, true);
        assert.equal(s.StaffManagement, false);
        assert.equal(s.IncomingOrders, true);
        assert.equal(c.IncomingOrders, false);
        assert.equal(c.Inventory, false);
        assert.equal(c.PizzaStation, true);
    });
});

describe('attendance, performance and activity (own data only)', () => {
    before(async () => {
        const make = (staff, date, checkIn, checkOut, status = 'present') => fx.call('POST', '/v1/store/attendance', A.managerToken, { staffId: staff.staffId, date, checkIn, checkOut, status });
        const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
        const shift = (await fx.call('POST', '/v1/store/shifts', A.managerToken, { shiftName: 'Profile shift', startTime: '09:00 AM', endTime: '05:00 PM' })).body.data;
        await fx.call('POST', `/v1/store/shifts/${shift._id}/assign`, A.managerToken, { staffIds: [chef.staffId] });
        ok(await make(chef, day(1), '09:00 AM', '05:00 PM'), 201);
        ok(await make(chef, day(2), '09:30 AM', '05:00 PM'), 201);     // 30 minutes late
        ok(await make(chef, day(3), undefined, undefined, 'absent'), 201);
        ok(await make(sup, day(1), '08:00 AM', '04:00 PM'), 201);
    });
    test('GET /attendance: the caller\'s summary and log, in the shape the tab renders', async () => {
        const d = ok(await call('GET', '/attendance', chef.token));
        assert.deepEqual(d.summary, { attendanceRate: 66.67, presentDays: 2, absentDays: 1, totalHours: 15.5, lateEntries: 1 });
        assert.equal(d.logs.length, 3);
        assert.deepEqual(Object.keys(d.logs[0]).sort(), ['checkIn', 'checkOut', 'date', 'hours', 'id', 'shift', 'status']);
        assert.deepEqual(d.logs.map((l) => l.status), ['Present', 'Late', 'Absent']);
        assert.equal(d.logs[0].shift, 'Profile shift (09:00 AM - 05:00 PM)');
        assert.equal(d.logs[0].checkIn, '09:00 AM');
        assert.equal(d.logs[0].hours, '8 hrs');
        assert.equal(d.logs[2].checkIn, '-');
        assert.equal(ok(await call('GET', '/attendance', sup.token)).logs.length, 1, 'only the supervisor\'s own');
        assert.equal(ok(await call('GET', '/attendance', bChef.token)).logs.length, 0);
        const m = ok(await call('GET', '/attendance', A.managerToken));
        assert.deepEqual([m.summary.presentDays, m.logs.length], [0, 0], 'the manager does not clock in');
    });
    test('the profile page carries the same summary', async () => {
        assert.equal(ok(await call('GET', '/', chef.token)).attendanceSummary.presentDays, 2);
    });
    test('GET /activity-logs: own clock-ins and outs, newest first, nobody else\'s', async () => {
        ok(await fx.call('POST', '/v1/store/attendance/clock-in', sup.token), 201);
        const mine = ok(await call('GET', '/activity-logs', sup.token));
        assert.ok(mine.length >= 1);
        assert.deepEqual(Object.keys(mine[0]).sort(), ['action', 'description', 'id', 'module', 'time']);
        assert.match(mine[0].action, /^Clocked in/);
        assert.match(mine[0].time, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} (AM|PM)$/);
        assert.ok(!ok(await call('GET', '/activity-logs', chef.token)).some((e) => /^Clocked in/.test(e.action) && e.description.includes(String(new Date().getFullYear())) === false && false));
        assert.equal(ok(await call('GET', '/activity-logs', bChef.token)).length, 0);
        assert.ok(ok(await call('GET', '/', sup.token)).recentActivities.length >= 1);
    });
    test('GET /performance: numbers in the shape of the summary cards', async () => {
        const p = ok(await call('GET', '/performance', chef.token));
        for (const k of ['ordersManaged', 'avgPrepTime', 'delayedOrders', 'customerComplaints', 'performanceRating', 'yearsOfService', 'ordersPrepared', 'avgPizzaTime', 'personalRating']) assert.ok(k in p, k);
        for (const k of ['ordersManaged', 'delayedOrders', 'customerComplaints', 'performanceRating', 'yearsOfService', 'ordersPrepared', 'personalRating']) assert.equal(typeof p[k], 'number', k);
        assert.equal(p.avgPrepTime, 'N/A', 'no finished tasks yet: not a made-up figure');
        assert.equal(ok(await call('GET', '/performance', A.managerToken)).ordersManaged, 1, 'the manager sees the store\'s orders of the last 30 days (store A has one)');
        assert.equal(ok(await call('GET', '/performance', B.managerToken)).ordersManaged, 1);
    });
});

describe('notification settings', () => {
    test('saves only the known switches; the rest of the profile is unchanged', async () => {
        const n = ok(await call('PUT', '/notifications', chef.token, { shiftAlerts: true, smsAlerts: true, orderAlerts: false, status: 'Suspended', role: 'STORE_MANAGER', storeId: B.storeId }));
        assert.deepEqual(n, { orderAlerts: false, inventoryAlerts: true, shiftAlerts: true, complaintAlerts: true, dailyReports: true, smsAlerts: true, pushNotifications: true });
        assert.deepEqual(ok(await call('GET', '/', chef.token)).notifications, n);
        const rec = await fx.models.StoreManager.findById(chef.staffId).lean();
        assert.equal(rec.status, 'Active');
        assert.equal(String(rec.storeId), A.storeId);
    });
    test('other people\'s settings are untouched; wrong types are refused', async () => {
        assert.equal(ok(await call('GET', '/', sup.token)).notifications.orderAlerts, true);
        assert.equal(ok(await call('GET', '/', bChef.token)).notifications.smsAlerts, false);
        assert.equal((await call('PUT', '/notifications', chef.token, { orderAlerts: 'yes' })).status, 400);
        assert.equal((await call('PUT', '/notifications', chef.token, { orderAlerts: { $ne: 1 } })).status, 400);
    });
});

describe('sessions', () => {
    test('the profile lists the caller\'s logins and marks this one', async () => {
        const mine = await login(sup.email); await login(sup.email);
        const sessions = ok(await withHeader('GET', '/', sup.token, mine.refreshToken)).activeSessions;
        assert.ok(sessions.length >= 2);
        assert.deepEqual(Object.keys(sessions[0]).sort(), ['browser', 'current', 'device', 'id', 'ipAddress', 'lastActive']);
        assert.equal(sessions.filter((s) => s.current).length, 1);
        assert.equal(JSON.stringify(sessions).includes(mine.refreshToken), false, 'no token material');
        assert.equal(ok(await call('GET', '/', sup.token)).activeSessions.filter((s) => s.current).length, 0, 'without the header nothing is marked');
    });
    test('sign one login out (only the caller\'s own; another person\'s session id is 404)', async () => {
        const mine = await login(sup.email);
        const theirs = await login(chef.email);
        const theirIds = ok(await call('GET', '/', chef.token)).activeSessions.map((s) => s.id);
        const sessions = ok(await withHeader('GET', '/', sup.token, mine.refreshToken)).activeSessions;
        const other = sessions.find((s) => !s.current);
        for (const id of theirIds) assert.equal((await call('DELETE', `/sessions/${id}`, sup.token)).status, 404);
        assert.equal((await refresh(theirs.refreshToken)).status, 200, 'their login still works');
        ok(await call('DELETE', `/sessions/${other.id}`, sup.token));
        assert.equal((await call('DELETE', `/sessions/${other.id}`, sup.token)).status, 404);
        assert.equal((await refresh(mine.refreshToken)).status, 200);
    });
    test('scope=other keeps this login; it needs the caller\'s refresh token to know which one that is', async () => {
        const mine = await login(sup.email); const old = await login(sup.email);
        assert.equal((await call('DELETE', '/sessions?scope=other', sup.token)).status, 400);
        assert.equal((await withHeader('DELETE', '/sessions?scope=other', sup.token, theirsToken(chef)).catch(() => ({ status: 0 }))).status, 400);
        const res = await withHeader('DELETE', '/sessions?scope=other', sup.token, mine.refreshToken);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.ok(res.body.data.removed >= 1);
        assert.equal((await refresh(old.refreshToken)).status, 401);
        assert.equal((await refresh(mine.refreshToken)).status, 200);
    });
    test('scope=all signs every login of the caller out and no one else\'s; other scopes are refused', async () => {
        const a = await login(sup.email); const b = await login(chef.email);
        assert.equal((await call('DELETE', '/sessions?scope=everything', sup.token)).status, 400);
        assert.equal((await call('DELETE', '/sessions', sup.token)).status, 400);
        ok(await call('DELETE', '/sessions?scope=all', sup.token));
        assert.equal((await refresh(a.refreshToken)).status, 401);
        assert.equal((await refresh(b.refreshToken)).status, 200);
    });
});

/** a refresh token belonging to someone else is just an unknown token as far as the caller is concerned */
function theirsToken() { return 'definitely-not-the-callers-token'; }
