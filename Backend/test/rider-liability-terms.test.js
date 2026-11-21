// Client rule: a rider's accident recovery / treatment cost falls on the franchisee outlet, and the store owner (not the company)
// answers for any mishap. The clause is part of every Terms & Conditions page and cannot be edited away.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx;
const KEYS = ['terms', 'terms_user', 'terms_franchise'];
const ADMIN = (k) => `/v1/food/admin/pages-social-media/${k}`;
const page = async (k) => (await fx.call('GET', `/v1/food/pages/${k}`)).body.data;
const count = (s) => (String(s).match(/Delivery Rider Safety and Liability/g) || []).length;

before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

describe('rider liability clause in the terms', () => {
    for (const k of KEYS) {
        test(`public ${k} carries the clause once, saying the outlet pays and the company does not`, async () => {
            const d = await page(k);
            assert.equal(count(d.content), 1);
            assert.match(d.content, /recovery and treatment is borne by the franchisee outlet/);
            assert.match(d.content, /store \/ outlet owner is responsible\. The company is not responsible/);
        });
    }
    test('delivery terms with no page of their own stay empty so the app falls back to the general terms (which carry the clause)', async () => {
        const d = await page('terms_delivery');
        assert.ok(!d || !d.content);
    });
    test('an admin who saves a page without the clause still serves it; saving what they read back never doubles it', async () => {
        for (const k of ['terms_delivery', 'terms_franchise']) {
            const put = await fx.call('PUT', ADMIN(k), fx.SA, { title: 'Terms', content: '<p>Own rules.</p>' });
            assert.equal(put.status, 200, JSON.stringify(put.body));
            let d = await page(k);
            assert.match(d.content, /Own rules/);
            assert.equal(count(d.content), 1);
            await fx.call('PUT', ADMIN(k), fx.SA, { title: 'Terms', content: d.content });
            d = await page(k);
            assert.equal(count(d.content), 1, 'not doubled');
        }
    });
    test('the super admin panel reads the same text', async () => {
        const r = await fx.call('GET', ADMIN('terms_franchise'), fx.SA);
        assert.equal(r.status, 200);
        assert.equal(count(r.body.data.content), 1);
    });
    test('a customer cannot edit terms pages', async () => {
        const r = await fx.call('PUT', ADMIN('terms_franchise'), fx.F?.A?.customerToken || 'x', { title: 't', content: 'x' });
        assert.ok([401, 403].includes(r.status), String(r.status));
    });
});
