// Customer app: the Notifications inbox works for a signed-in customer (token role CUSTOMER, rows saved as USER),
// and the search settings never crash or show invented searches / posters on a fresh database.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx; let A; let FoodNotification; let SearchPageConfig;
const PUBLIC = '/v1/settings/search-config/public';
const ADMIN = '/v1/settings/search-config/admin';

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    ({ FoodNotification } = await import('../src/core/notifications/models/notification.model.js'));
    ({ SearchPageConfig } = await import('../src/modules/food/settings/models/searchPageConfig.model.js'));
});
after(async () => { await fx?.teardown(); });

describe('customer notifications inbox', () => {
    test('a customer sees, reads and dismisses their own notices; another customer\'s stay hidden', async () => {
        const mine = await FoodNotification.create({ ownerType: 'USER', ownerId: new mongoose.Types.ObjectId(A.customerId), title: 'Order placed', message: 'Your pizza is on its way' });
        await FoodNotification.create({ ownerType: 'USER', ownerId: new mongoose.Types.ObjectId(fx.F.B.customerId), title: 'Not yours', message: 'B only' });
        const res = await fx.call('GET', '/v1/food/notifications/inbox', A.customerToken);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const items = res.body.data.items || res.body.data.notifications || res.body.data;
        assert.deepEqual(items.map((n) => n.title), ['Order placed']);
        assert.equal((await fx.call('PATCH', `/v1/food/notifications/${mine._id}/read`, A.customerToken, {})).status, 200);
        assert.equal((await fx.call('DELETE', `/v1/food/notifications/${mine._id}`, A.customerToken)).status, 200);
    });
});

describe('search settings', () => {
    test('a fresh database: no crash (even with no add-ons and many first visits at once), nothing invented', async () => {
        await SearchPageConfig.deleteMany({});
        const all = await Promise.all([1, 2, 3, 4].map(() => fx.call('GET', PUBLIC)));
        for (const r of all) assert.equal(r.status, 200, JSON.stringify(r.body));
        assert.equal(await SearchPageConfig.countDocuments(), 1);
        const { popularSearches, newLaunches } = all[0].body.data;
        assert.deepEqual([popularSearches, newLaunches], [[], []]);
        const admin = await fx.call('GET', ADMIN, fx.SA);
        assert.equal(admin.status, 200, JSON.stringify(admin.body));
        assert.deepEqual([admin.body.data.config.popularSearches, admin.body.data.config.newLaunches], [[], []]);
    });

    test('searches and posters seeded by older builds are removed; the super admin\'s own stay; an emptied list stays empty', async () => {
        await SearchPageConfig.deleteMany({});
        await SearchPageConfig.create({
            popularSearches: [
                { text: 'more chicken', searchQuery: 'chicken', sortOrder: 3 },
                { text: 'Maxxx', searchQuery: 'Maxxx', sortOrder: 1 },
                { text: 'Paneer Tikka', searchQuery: 'paneer tikka', sortOrder: 2 },
            ],
            newLaunches: [
                { title: 'Paneer Maxxx', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80' },
                { title: 'Monsoon Special', image: 'https://cdn.example.com/monsoon.jpg' },
            ],
        });
        const res = await fx.call('GET', PUBLIC);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.data.popularSearches.map((p) => p.text), ['Paneer Tikka']);
        assert.deepEqual(res.body.data.newLaunches.map((l) => l.title), ['Monsoon Special']);
        // the super admin removes the last poster: it is not refilled with invented ones
        const saved = await fx.call('PUT', '/v1/settings/search-config', fx.SA, { newLaunches: [] });
        assert.equal(saved.status, 200, JSON.stringify(saved.body));
        assert.deepEqual((await fx.call('GET', PUBLIC)).body.data.newLaunches, []);
    });
});
