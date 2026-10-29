// "Order for later": the delivery slots the cart shows (/v1/food/stores/slots) and the matching checks when an order
// with scheduledAt is placed. Slots and checks follow the store's operating hours, holidays and the super admin switch.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let pizza; let StoreHours; let FoodAppConfig;
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Server local date `days` from today at hh:mm */
const on = (days, h, m = 0) => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + days, h, m); };

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    const { Product } = await import('../src/modules/food/admin/models/product.model.js');
    ({ StoreHours } = await import('../src/modules/food/franchise/models/storeHours.model.js'));
    ({ FoodAppConfig } = await import('../src/modules/food/settings/models/appConfig.model.js'));
    pizza = await Product.create({ name: 'Margherita', categoryId: new mongoose.Types.ObjectId(), status: 'Active', price: 200 });
});
after(async () => { await fx?.teardown(); });

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
/** Both stores: 10:00-22:00 every day, closed tomorrow (holiday), plus whatever else is passed. */
const setHours = async (extra = {}) => {
    const week = Object.fromEntries(DAYS.map((d) => [d, { open: '10:00', close: '22:00', isClosed: false }]));
    const holidays = [{ date: ymd(on(1, 0)), isClosed: true }, ...(extra.holidays || [])];
    for (const store of [fx.F.A, fx.F.B]) {
        await StoreHours.findOneAndUpdate({ storeId: store.storeId }, { $set: { week, holidays } }, { upsert: true });
    }
};
const slots = () => fx.call('GET', '/v1/food/stores/slots');
const place = (scheduledAt) => fx.call('POST', '/v1/food/orders', A.customerToken, {
    storeId: A.storeId, address: { street: '1 Test St', city: 'Indore', state: 'MP' }, paymentMethod: 'cash',
    items: [{ itemId: String(pizza._id), name: 'Margherita', price: 1, quantity: 1, kind: 'product' }],
    ...(scheduledAt !== undefined ? { scheduledAt } : {}),
});

describe('delivery slots', () => {
    test('7 days from today; only times the store can deliver; nothing in the past', async () => {
        await setHours();
        const data = ok(await slots());
        assert.ok(data.storeId);
        assert.equal(data.scheduledOrdersEnabled, true);
        assert.equal(data.days.length, 7);
        assert.equal(data.days[0].date, ymd(new Date()));
        assert.deepEqual(data.days[1].slots, [], 'holiday: no slots');
        const day2 = data.days[2].slots.map((s) => s.time);
        assert.equal(day2[0], '10:30', 'first slot leaves 30 minutes to prepare after opening');
        assert.equal(day2.at(-1), '22:00');
        assert.equal(day2.length, 24);
        const earliest = Date.now() + 45 * 60000 - 1000;
        for (const day of data.days) for (const s of day.slots) assert.ok(new Date(s.at).getTime() >= earliest, `${s.at} is too soon`);
    });
    test('a store closed today still offers the next days', async () => {
        await setHours({ holidays: [{ date: ymd(new Date()), isClosed: true }] });
        const data = ok(await slots());
        assert.equal(data.openNow, false);
        assert.deepEqual(data.days[0].slots, []);
        assert.ok(data.days[2].slots.length > 0);
        // resolve: closed now, but a store can deliver at a later slot
        assert.equal((await fx.call('GET', '/v1/food/stores/resolve')).status, 400);
        ok(await fx.call('GET', `/v1/food/stores/resolve?at=${encodeURIComponent(on(2, 12).toISOString())}`));
        assert.equal((await fx.call('GET', `/v1/food/stores/resolve?at=${encodeURIComponent(on(1, 12).toISOString())}`)).status, 400);
        assert.equal((await fx.call('GET', '/v1/food/stores/resolve?at=nonsense')).status, 400);
    });
});

describe('placing a scheduled order', () => {
    test('a valid slot is accepted and stored, even while the store is closed now', async () => {
        await setHours({ holidays: [{ date: ymd(new Date()), isClosed: true }] });
        assert.equal((await place()).status, 400, 'ASAP while closed');
        const at = on(2, 12, 30);
        const order = ok(await place(at.toISOString()), 201).order;
        assert.equal(new Date(order.scheduledAt).getTime(), at.getTime());
    });
    test('past, too soon, too far, holiday and outside hours are refused', async () => {
        await setHours();
        const cases = [
            [new Date(Date.now() - 60 * 60000), /too soon/],
            [new Date(Date.now() + 5 * 60000), /too soon/],
            [on(9, 12), /up to 7 days/],
            [on(1, 12), /closed at that time/],
            [on(2, 9), /closed at that time/],
            [on(2, 22, 30), /closed at that time/],
        ];
        for (const [at, msg] of cases) {
            const res = await place(at.toISOString());
            assert.equal(res.status, 400, `${at.toISOString()}: ${JSON.stringify(res.body)}`);
            assert.match(res.body.message || res.body.error, msg);
        }
        assert.equal((await place('tomorrow at noon')).status, 400);
    });
    test('the super admin switch turns scheduling off', async () => {
        await setHours();
        await FoodAppConfig.findOneAndUpdate({}, { $set: { scheduledOrdersEnabled: false } }, { upsert: true });
        try {
            assert.deepEqual(ok(await slots()).days, []);
            assert.equal((await place(on(2, 12).toISOString())).status, 400);
        } finally {
            await FoodAppConfig.findOneAndUpdate({}, { $set: { scheduledOrdersEnabled: true } });
        }
    });
});
