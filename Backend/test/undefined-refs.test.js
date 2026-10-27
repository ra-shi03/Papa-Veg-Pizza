// Model names used without being imported throw "X is not defined" at runtime, and only on the code path that
// reaches them (sidebar badges, store deletion, ticket lists...). A static sweep catches them all; the HTTP
// checks below prove the paths that used to throw now work.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { createFixture, mongoose } from './helpers/fixture.js';

let fx;
before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

const QUERY_METHODS = 'find|findOne|findById|countDocuments|deleteMany|updateMany|aggregate|create|findByIdAndUpdate|findOneAndUpdate|findByIdAndDelete|updateOne|deleteOne|insertMany|distinct|exists|estimatedDocumentCount|bulkWrite';
const GLOBALS = new Set(['Promise', 'Object', 'Array', 'Math', 'Date', 'JSON', 'Number', 'String', 'Buffer', 'Reflect']);
// Known and deliberate: verifyTruecallerAndLogin is dead code behind a disabled route (it trusted the client's
// phone number). Do not "fix" it by importing UserProfile; implement real Truecaller verification instead.
const KNOWN = new Set(['src/core/auth/auth.service.js:UserProfile']);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : n.endsWith('.js') ? [p] : [];
});

function undefinedModelNames(source) {
    const declared = new Set();
    for (const [, name] of source.matchAll(/import\s+(?:\*\s+as\s+)?([A-Z]\w*)/g)) declared.add(name);
    for (const [, list] of source.matchAll(/import\s*\{([^}]*)\}/g)) {
        for (const part of list.split(',')) { const n = part.trim().split(/\s+as\s+/).pop(); if (n) declared.add(n); }
    }
    for (const [, name] of source.matchAll(/(?:const|let|var|function|class)\s+([A-Z]\w*)/g)) declared.add(name);
    for (const [, list] of source.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
        for (const part of list.split(',')) { const n = part.split(':').pop().trim(); if (n) declared.add(n); }
    }
    const used = new Set();
    for (const [, name] of source.matchAll(new RegExp(`(?<![.\\w])([A-Z][A-Za-z0-9]+)\\.(?:${QUERY_METHODS})\\(`, 'g'))) used.add(name);
    // error classes thrown with `new` (e.g. NotFoundError) must be imported too
    for (const [, name] of source.matchAll(/\bnew\s+([A-Z][A-Za-z0-9]*Error)\(/g)) if (!['Error', 'TypeError', 'RangeError', 'SyntaxError'].includes(name)) used.add(name);
    return [...used].filter((n) => !declared.has(n) && !GLOBALS.has(n));
}

test('every model and error class used in src is imported or declared in that file', () => {
    const root = resolve('src');
    const problems = [];
    for (const file of walk(root)) {
        const rel = `src/${relative(root, file)}`;
        for (const name of undefinedModelNames(readFileSync(file, 'utf8'))) {
            if (!KNOWN.has(`${rel}:${name}`)) problems.push(`${rel}: ${name}`);
        }
    }
    assert.deepEqual(problems, []);
});

describe('paths that used to throw "is not defined"', () => {
    test('sidebar badges return real counts (FoodStoreWithdrawal, FoodDeliveryWithdrawal, FoodSupportTicket)', async () => {
        const { FoodStoreWithdrawal } = await import('../src/modules/food/store/models/storeWithdrawal.model.js');
        await FoodStoreWithdrawal.create({ storeId: new mongoose.Types.ObjectId(fx.F.A.storeId), amount: 500 });
        const res = await fx.call('GET', '/v1/food/admin/sidebar-badges', fx.SA);
        assert.equal(res.status, 200);
        assert.equal(res.body.counts.storeWithdrawals, 1, JSON.stringify(res.body));
        for (const key of ['deliveryWithdrawals', 'userSupportTickets', 'storeComplaints']) {
            assert.equal(typeof res.body.counts[key], 'number', key);
        }
    });
    test('store withdrawal list works', async () => {
        const res = await fx.call('GET', '/v1/food/admin/withdrawals', fx.SA);
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
    test('support ticket list works for user, store and all sources (FoodStoreSupportTicket)', async () => {
        for (const source of ['user', 'store', 'all']) {
            assert.equal((await fx.call('GET', `/v1/food/admin/support-tickets?source=${source}`, fx.SA)).status, 200, source);
        }
    });
    test('a store can be deleted (cascade touches withdrawals and store tickets)', async () => {
        const st = await fx.call('POST', '/v1/stores', fx.F.B.adminToken, {
            storeName: 'DELETE ME', storeCode: `DEL${Date.now()}`, storeType: 'DELIVERY_CARRYOUT', phone: '9999999999', email: `del${Date.now()}@example.invalid`,
            address: { line1: 'a', city: 'c', state: 's', pincode: '110001', coordinates: [77.2, 28.6] }, status: 'Active',
        });
        assert.equal(st.status, 201);
        const res = await fx.call('DELETE', `/v1/food/admin/stores/${st.body.data._id}`, fx.SA);
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });
    test('public dynamic-home offers work (UiOffer)', async () => {
        assert.equal((await fx.call('GET', '/v1/dynamic-home/offers', null)).status, 200);
    });
    test('pending food approvals list works and names the store (FoodStore)', async () => {
        const { FoodItem } = await import('../src/modules/food/admin/models/food.model.js');
        await FoodItem.create({ storeId: new mongoose.Types.ObjectId(fx.F.A.storeId), name: 'Pending Pizza', price: 100, approvalStatus: 'pending', requestedAt: new Date() });
        const res = await fx.call('GET', '/v1/food/admin/foods/pending-approvals', fx.SA);
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.match(JSON.stringify(res.body), /TEST STORE A/);
    });
});

describe('Truecaller login is disabled', () => {
    test('it refuses (501) and does not create a user for the number sent', async () => {
        const phone = '9123401234';
        const res = await fx.call('POST', '/v1/auth/user/verify-truecaller', null, { payload: { phone, firstName: 'X' } });
        assert.equal(res.status, 501);
        assert.ok(!res.body.data?.accessToken);
        assert.equal(await fx.models.User.countDocuments({ mobile: phone }), 0);
    });
});
