// Nutrition Information page (/v1/settings/nutrition/*): the customer app reads it, only the super admin edits it.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A;
const N = '/v1/settings/nutrition';

before(async () => { fx = await createFixture(); A = fx.F.A; });
after(async () => { await fx?.teardown(); });

const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };
const pub = async () => ok(await fx.call('GET', `${N}/public`));

describe('who can edit', () => {
    test('anyone reads the public page; only the super admin reads the admin list or writes', async () => {
        const empty = await pub();
        assert.deepEqual(empty.items, []);
        assert.ok(empty.page.headline);
        for (const token of [null, A.customerToken, A.adminToken, A.managerToken]) {
            const want = token ? 403 : 401;
            assert.equal((await fx.call('GET', `${N}/admin`, token)).status, want);
            assert.equal((await fx.call('POST', `${N}/items`, token, { name: 'X' })).status, want);
            assert.equal((await fx.call('POST', `${N}/items/starter`, token, {})).status, want);
            assert.equal((await fx.call('PUT', `${N}/page`, token, { headline: 'X' })).status, want);
        }
        assert.deepEqual((await pub()).items, []);
    });
});

describe('super admin', () => {
    test('add, validate, hide, edit and delete an item', async () => {
        assert.equal((await fx.call('POST', `${N}/items`, fx.SA, { calories: 100 })).status, 400, 'name required');
        assert.equal((await fx.call('POST', `${N}/items`, fx.SA, { name: 'Bad', calories: -5 })).status, 400);
        assert.equal((await fx.call('POST', `${N}/items`, fx.SA, { name: 'Bad', protein: 'lots' })).status, 400);

        const item = ok(await fx.call('POST', `${N}/items`, fx.SA, {
            name: 'Farmhouse', category: 'Pizzas', servingSize: '1 slice', calories: '250', protein: 10, allergens: ['Gluten', 'Dairy'],
        }), 201);
        assert.equal(item.calories, 250, 'numbers from form strings');
        const hidden = ok(await fx.call('POST', `${N}/items`, fx.SA, { name: 'Secret', isActive: false, allergens: ['Soy'] }), 201);

        let page = await pub();
        assert.deepEqual(page.items.map((i) => i.name), ['Farmhouse']);
        assert.deepEqual(page.allergens, ['Dairy', 'Gluten'], 'allergens of active items only');
        assert.equal(ok(await fx.call('GET', `${N}/admin`, fx.SA)).items.length, 2);

        ok(await fx.call('PUT', `${N}/items/${item._id}`, fx.SA, { calories: 260, allergens: ['Gluten'] }));
        ok(await fx.call('PUT', `${N}/items/${hidden._id}`, fx.SA, { isActive: true }));
        page = await pub();
        assert.equal(page.items.find((i) => i.name === 'Farmhouse').calories, 260);
        assert.deepEqual(page.allergens, ['Gluten', 'Soy']);

        assert.equal((await fx.call('PUT', `${N}/items/not-an-id`, fx.SA, { calories: 1 })).status, 404);
        ok(await fx.call('DELETE', `${N}/items/${hidden._id}`, fx.SA));
        assert.equal((await fx.call('DELETE', `${N}/items/${hidden._id}`, fx.SA)).status, 404);
        ok(await fx.call('DELETE', `${N}/items/${item._id}`, fx.SA));
    });
    test('starter items are added once; page copy is editable', async () => {
        assert.equal(ok(await fx.call('POST', `${N}/items/starter`, fx.SA, {})).added, 7);
        assert.equal(ok(await fx.call('POST', `${N}/items/starter`, fx.SA, {})).added, 0);
        const page = await pub();
        assert.equal(page.items.length, 7);
        assert.equal(page.items[0].name, 'Classic Margherita Pizza');

        ok(await fx.call('PUT', `${N}/page`, fx.SA, { headline: 'Eat smart', disclaimer: 'Values are approximate.' }));
        const after = (await pub()).page;
        assert.equal(after.headline, 'Eat smart');
        assert.equal(after.disclaimer, 'Values are approximate.');
        assert.ok(after.intro, 'untouched fields keep their default');
    });
});
