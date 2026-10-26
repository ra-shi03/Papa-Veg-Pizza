// P0 item 1: no token shortcut may ever authenticate. Only a token signed with JWT_ACCESS_SECRET
// for an existing, active account is accepted.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, jwt } from './helpers/fixture.js';

let fx;
before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

// A route that needs a logged-in admin: if any forged token got through, it would answer 200.
const PROTECTED = '/v1/stores';
const forgedPayload = () => Buffer.from(JSON.stringify({ userId: 'admin-1', role: 'SUPERADMIN' })).toString('base64');

describe('forged / shortcut tokens are rejected (401)', () => {
    const cases = {
        'mock_token': () => 'mock_token',
        'dummy_access_token': () => 'dummy_access_token',
        'mockHeader.<payload>.mockSignature': () => `mockHeader.${forgedPayload()}.mockSignature`,
        'unsigned JWT (alg: none)': () => jwt.sign({ userId: 'admin-1', role: 'SUPERADMIN' }, '', { algorithm: 'none' }),
        'JWT signed with the wrong secret': () => jwt.sign({ userId: 'admin-1', role: 'SUPERADMIN' }, 'guess'),
        'random garbage': () => 'not.a.token',
    };
    for (const [name, make] of Object.entries(cases)) {
        test(name, async () => {
            const res = await fx.call('GET', PROTECTED, make());
            assert.equal(res.status, 401);
        });
    }
    test('the dev-only fallbacks are gone for super-admin claims too', async () => {
        const res = await fx.call('GET', '/v1/food/admin/orders', `mockHeader.${forgedPayload()}.mockSignature`);
        assert.equal(res.status, 401);
    });
    test('missing Authorization header', async () => {
        assert.equal((await fx.call('GET', PROTECTED)).status, 401);
    });
});

describe('a genuine signature is still not enough on its own', () => {
    test('expired token -> 401', async () => {
        const t = jwt.sign({ userId: String(fx.superUser._id), role: 'superadmin' }, process.env.JWT_ACCESS_SECRET, { expiresIn: -60 });
        assert.equal((await fx.call('GET', PROTECTED, t)).status, 401);
    });
    test('signed token for an account that does not exist -> 401 (no "missing user is fine in dev")', async () => {
        const t = jwt.sign({ userId: '64b000000000000000000001', role: 'superadmin' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
        assert.equal((await fx.call('GET', PROTECTED, t)).status, 401);
    });
    test('signed token for a deactivated account -> 401', async () => {
        const { User } = fx.models;
        await User.updateOne({ _id: fx.F.A.adminUserId }, { $set: { isActive: false } });
        try {
            assert.equal((await fx.call('GET', PROTECTED, fx.F.A.adminToken)).status, 401);
        } finally {
            await User.updateOne({ _id: fx.F.A.adminUserId }, { $set: { isActive: true } });
        }
    });
    test('a valid token for a real super admin works (the guard is not simply closed)', async () => {
        assert.equal((await fx.call('GET', PROTECTED, fx.SA)).status, 200);
    });
});
