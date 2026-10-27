// Operating hours (/v1/operating-hours/*, /v1/stores/:id/hours, /v1/stores/:id/status): role and scope from the
// token, the schedule round trip in both screen formats, and the customer side respecting the hours
// (store resolve at checkout and order placement).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let B; let sup; let staff; let pizza;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

before(async () => {
    fx = await createFixture(); A = fx.F.A; B = fx.F.B;
    sup = fx.claim('KITCHEN_SUPERVISOR', { franchiseId: A.franchiseId, storeId: A.storeId });
    staff = fx.claim('KITCHEN_STAFF', { franchiseId: A.franchiseId, storeId: A.storeId });
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 200 });
});
after(async () => { await fx?.teardown(); });

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const OH = '/v1/operating-hours';
const pad = (n) => String(n).padStart(2, '0');
/** "hh:mm AM" at now + minutes (server local time), the Operating Hours screens' format */
const at = (minutes) => {
    const d = new Date(Date.now() + minutes * 60000);
    return `${pad(((d.getHours() + 11) % 12) + 1)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
};
const everyDay = (day) => Object.fromEntries(DAYS.map((d) => [d, day]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const resolve = () => fx.call('GET', '/v1/food/stores/resolve');
const order = (store) => fx.call('POST', '/v1/food/orders', store.customerToken, {
    storeId: store.storeId, address: { street: '1 Test St', city: 'Indore', state: 'MP' }, paymentMethod: 'cash',
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 1, quantity: 1, kind: 'product' }],
});

describe('who sees what', () => {
    test('franchise admin and super admin: read and write; each franchise sees only its own stores', async () => {
        const a = ok(await fx.call('GET', OH, A.adminToken));
        assert.deepEqual(a.list.map((r) => r.storeId), [A.storeId]);
        assert.equal(a.totalCount, 1);
        assert.equal(ok(await fx.call('GET', OH, fx.SA)).totalCount, 2);
        assert.equal(ok(await fx.call('GET', `${OH}?franchiseId=${B.franchiseId}`, fx.SA)).list[0].storeId, B.storeId);
        ok(await fx.call('GET', `${OH}/${B.storeId}`, fx.SA));
    });
    test('store manager: reads its own store, cannot write', async () => {
        ok(await fx.call('GET', OH, A.managerToken));
        ok(await fx.call('GET', `${OH}/dashboard`, A.managerToken));
        ok(await fx.call('GET', `${OH}/${A.storeId}`, A.managerToken));
        ok(await fx.call('GET', `/v1/stores/${A.storeId}/hours`, A.managerToken));
        assert.equal((await fx.call('GET', `${OH}/${B.storeId}`, A.managerToken)).status, 404);
        assert.equal((await fx.call('PATCH', `${OH}/${A.storeId}`, A.managerToken, { monday: { open: '10:00 AM', close: '10:00 PM' } })).status, 403);
        assert.equal((await fx.call('PATCH', `${OH}/${A.storeId}/holidays`, A.managerToken, { holidaySchedule: [] })).status, 403);
        assert.equal((await fx.call('PATCH', `/v1/stores/${A.storeId}/hours`, A.managerToken, { hours: {} })).status, 403);
        assert.equal((await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.managerToken, { status: 'Closed' })).status, 403);
        assert.equal((await fx.call('PATCH', `${OH}/bulk-update`, A.managerToken, { storeIds: [A.storeId], weekdays: ['Monday'], open: '9 AM', close: '9 PM' })).status, 403);
    });
    test('kitchen roles and customers 403; anonymous 401', async () => {
        for (const token of [sup, staff, A.customerToken]) {
            assert.equal((await fx.call('GET', OH, token)).status, 403);
            assert.equal((await fx.call('GET', `${OH}/${A.storeId}`, token)).status, 403);
            assert.equal((await fx.call('GET', `/v1/stores/${A.storeId}/hours`, token)).status, 403);
        }
        assert.equal((await fx.call('GET', OH)).status, 401);
    });
    test('another franchise\'s store is 404', async () => {
        assert.equal((await fx.call('GET', `${OH}/${B.storeId}`, A.adminToken)).status, 404);
        assert.equal((await fx.call('PATCH', `${OH}/${B.storeId}`, A.adminToken, { monday: { open: '9 AM', close: '9 PM' } })).status, 404);
        assert.equal((await fx.call('GET', `/v1/stores/${B.storeId}/hours`, A.adminToken)).status, 404);
        assert.equal((await fx.call('PATCH', `/v1/stores/${B.storeId}/status`, A.adminToken, { status: 'Closed' })).status, 404);
        assert.equal((await fx.call('PATCH', `${OH}/bulk-update`, A.adminToken, { storeIds: [A.storeId, B.storeId], weekdays: ['Monday'], open: '9 AM', close: '9 PM' })).status, 404);
        assert.equal((await fx.call('POST', `${OH}/copy`, A.adminToken, { sourceStoreId: A.storeId, destStoreId: B.storeId })).status, 404);
        assert.equal((await fx.call('GET', `${OH}/not-a-store`, A.adminToken)).status, 404);
    });
});

describe('schedule', () => {
    test('a store without hours is open all day, every day', async () => {
        const s = ok(await fx.call('GET', `${OH}/${A.storeId}`, A.adminToken));
        assert.deepEqual(s.monday, { open: '12:00 AM', close: '12:00 AM', isClosed: false });
        assert.equal(s.isOpen, true);
        assert.deepEqual(ok(await fx.call('GET', `${OH}/dashboard`, A.adminToken)), { storesOpenNow: 1, storesClosed: 0, stores24x7: 1, holidayClosures: 0, upcomingChanges: 0 });
    });
    test('weekly hours: the Operating Hours format in, both formats out', async () => {
        const s = ok(await fx.call('PATCH', `${OH}/${A.storeId}`, A.adminToken, { monday: { open: '09:00 AM', close: '11:00 PM', isClosed: false }, sunday: { open: '11:00 AM', close: '11:00 PM', isClosed: true } }));
        assert.deepEqual(s.monday, { open: '09:00 AM', close: '11:00 PM', isClosed: false });
        assert.equal(s.sunday.isClosed, true);
        assert.equal(s.auditLogs[0].action, 'Updated Weekly Hours');
        assert.equal(s.auditLogs[0].updatedBy, 'Franchise Admin');
        const h = ok(await fx.call('GET', `/v1/stores/${A.storeId}/hours`, A.adminToken));
        assert.deepEqual(h.operatingHours[0], { day: 'Monday', openTime: '09:00', closeTime: '23:00', isHoliday: false });
        assert.equal(h.operatingHours[6].isHoliday, true);
    });
    test('the Hours modal: { hours: {} } only reads; an array saves', async () => {
        const read = ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/hours`, A.adminToken, { hours: {} }));
        assert.equal(read.operatingHours[0].openTime, '09:00');
        const saved = ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/hours`, A.adminToken, { hours: [{ day: 'Tuesday', openTime: '11:00', closeTime: '23:30', isHoliday: false }] }));
        assert.deepEqual(saved.operatingHours[1], { day: 'Tuesday', openTime: '11:00', closeTime: '23:30', isHoliday: false });
        assert.equal(ok(await fx.call('GET', `${OH}/${A.storeId}`, A.adminToken)).tuesday.close, '11:30 PM');
    });
    test('holidays, bulk update and copy', async () => {
        const s = ok(await fx.call('PATCH', `${OH}/${A.storeId}/holidays`, A.adminToken, { holidaySchedule: [
            { date: '2099-08-15', reason: 'Independence Day', isClosed: true },
            { date: '2099-10-22', reason: 'Diwali', isClosed: false, open: '11:00 AM', close: '05:00 PM' },
        ] }));
        assert.equal(s.holidaySchedule.length, 2);
        assert.deepEqual(s.holidaySchedule[1], { date: '2099-10-22', reason: 'Diwali', isClosed: false, open: '11:00 AM', close: '05:00 PM' });
        const kpi = ok(await fx.call('GET', `${OH}/dashboard`, A.adminToken));
        assert.equal(kpi.holidayClosures, 1);
        assert.equal(kpi.upcomingChanges, 1);
        assert.equal(kpi.stores24x7, 0);

        ok(await fx.call('PATCH', `${OH}/bulk-update`, fx.SA, { storeIds: [A.storeId, B.storeId], weekdays: ['Friday', 'Saturday'], open: '10:00 AM', close: '01:00 AM', isClosed: false }));
        for (const store of [A, B]) assert.deepEqual(ok(await fx.call('GET', `${OH}/${store.storeId}`, fx.SA)).friday, { open: '10:00 AM', close: '01:00 AM', isClosed: false });

        ok(await fx.call('POST', `${OH}/copy`, fx.SA, { sourceStoreId: A.storeId, destStoreId: B.storeId }));
        const b = ok(await fx.call('GET', `${OH}/${B.storeId}`, fx.SA));
        assert.deepEqual(b.monday, { open: '09:00 AM', close: '11:00 PM', isClosed: false });
        assert.equal(b.holidaySchedule.length, 0, 'copy takes the weekly hours, not the holidays');
        assert.equal(b.auditLogs[0].action, 'Copied Timings');
    });
    test('export lists every store in scope with its hours', async () => {
        const d = ok(await fx.call('GET', `${OH}/export?format=csv`, A.adminToken));
        assert.equal(d.rows.length, 1);
        assert.equal(d.rows[0].monday, '09:00 AM - 11:00 PM');
        assert.equal(d.rows[0].sunday, 'Closed');
    });
    test('bad input is a 400', async () => {
        assert.equal((await fx.call('PATCH', `${OH}/${A.storeId}`, A.adminToken, { monday: { open: '25:00', close: '10 PM' } })).status, 400);
        assert.equal((await fx.call('PATCH', `${OH}/${A.storeId}`, A.adminToken, {})).status, 400);
        assert.equal((await fx.call('PATCH', `${OH}/${A.storeId}/holidays`, A.adminToken, { holidaySchedule: [{ date: 'someday', isClosed: true }] })).status, 400);
        assert.equal((await fx.call('PATCH', `${OH}/bulk-update`, A.adminToken, { storeIds: [A.storeId], weekdays: ['Funday'], open: '9 AM', close: '9 PM' })).status, 400);
        assert.equal((await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Closed', startDate: '2099-02-10', endDate: '2099-02-01' })).status, 400);
    });
});

describe('the customer side follows the hours', () => {
    const setAll = async (store, day) => ok(await fx.call('PATCH', `${OH}/${store.storeId}`, fx.SA, everyDay(day)));
    const setAllBoth = async (day) => { for (const s of [A, B]) assert.equal((await fx.call('PATCH', `${OH}/${s.storeId}`, fx.SA, everyDay(day))).status, 200); };

    test('open now: checkout finds a store and the order goes through', async () => {
        await setAllBoth({ open: at(-60), close: at(60), isClosed: false });
        ok(await resolve());
        ok(await order(A), 201);
        assert.equal(ok(await fx.call('GET', `${OH}/${A.storeId}`, A.adminToken)).isOpen, true);
    });
    test('outside the hours: no store at checkout, and the order is refused', async () => {
        await setAllBoth({ open: at(60), close: at(120), isClosed: false });
        const r = await resolve();
        assert.equal(r.status, 400);
        assert.match(r.body.error, /closed/i);
        const o = await order(A);
        assert.equal(o.status, 400);
        assert.match(o.body.error, /closed/i);
        assert.equal(ok(await fx.call('GET', `${OH}/dashboard`, fx.SA)).storesOpenNow, 0);
    });
    test('only one store open: checkout picks it; the closed one still refuses orders', async () => {
        await setAll(B, { open: at(-60), close: at(60), isClosed: false });
        assert.equal(ok(await resolve()).storeId, B.storeId);
        assert.equal((await order(A)).status, 400);
        ok(await order(B), 201);
    });
    test('a closed day, a holiday today, and a temporary closure each close the store', async () => {
        await setAllBoth({ open: at(-60), close: at(60), isClosed: false });
        ok(await order(A), 201);

        await setAll(A, { isClosed: true });
        assert.equal((await order(A)).status, 400);
        await setAll(A, { open: at(-60), close: at(60), isClosed: false });

        ok(await fx.call('PATCH', `${OH}/${A.storeId}/holidays`, A.adminToken, { holidaySchedule: [{ date: today(), reason: 'Festival', isClosed: true }] }));
        assert.equal((await order(A)).status, 400);
        ok(await fx.call('PATCH', `${OH}/${A.storeId}/holidays`, A.adminToken, { holidaySchedule: [] }));
        ok(await order(A), 201);

        const closed = ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Closed', isOpen: false, reason: 'Maintenance', startDate: today(), comments: 'Oven repair' }));
        assert.deepEqual(closed, { storeId: A.storeId, status: 'Closed', isOpen: false });
        assert.equal((await order(A)).status, 400);
        const row = ok(await fx.call('GET', OH, A.adminToken)).list[0];
        assert.equal(row.status, 'Closed');
        assert.equal(row.schedule.temporaryClosure.reason, 'Maintenance');

        assert.deepEqual(ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Active', isOpen: true, reason: 'Reopened' })), { storeId: A.storeId, status: 'Active', isOpen: true });
        ok(await order(A), 201);
    });
    test('a closure that starts tomorrow does not close the store today', async () => {
        const tomorrow = new Date(Date.now() + 86400000);
        const day = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
        ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Closed', reason: 'Renovation', startDate: day }));
        ok(await order(A), 201);
        assert.equal(ok(await fx.call('GET', `${OH}/dashboard`, A.adminToken)).upcomingChanges, 1);
        ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Active' }));
    });
    test('inactive stops orders; active brings them back', async () => {
        assert.equal(ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Inactive', reason: 'Licence' })).status, 'Inactive');
        assert.equal((await order(A)).status, 400);
        ok(await fx.call('PATCH', `/v1/stores/${A.storeId}/status`, A.adminToken, { status: 'Active' }));
        ok(await order(A), 201);
    });
});
