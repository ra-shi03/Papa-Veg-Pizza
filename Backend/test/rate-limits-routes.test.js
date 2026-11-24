// The account limits are wired into the real auth routes (login for every panel role, customer and rider OTP verification,
// forgot password), and /ready tells a load balancer when to stop sending traffic.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.LOGIN_FAIL_MAX = '3';
process.env.OTP_VERIFY_FAIL_MAX = '3';
process.env.FORGOT_OTP_MAX = '2';

let fx;
before(async () => { const { createFixture } = await import('./helpers/fixture.js'); fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

const codes = async (n, send) => { const out = []; for (let i = 0; i < n; i++) out.push((await send(i)).status); return out; };

test('every panel login stops after 3 wrong passwords for one email; the right password works for other accounts', async () => {
    for (const [i, path] of ['/v1/auth/store/login', '/v1/auth/franchise/login', '/v1/auth/admin/login', '/v1/auth/login'].entries()) {
        const email = `nobody-${i}-${fx.ts}@example.invalid`;
        const got = await codes(5, () => fx.call('POST', path, null, { email, password: 'Wrong-pass-1' }));
        assert.deepEqual(got.map((s) => s === 429), [false, false, false, true, true], `${path}: ${got}`);
    }
    const { PASSWORD } = await import('./helpers/fixture.js');
    const ok = await fx.call('POST', '/v1/auth/store/login', null, { email: fx.F.A.managerEmail, password: PASSWORD });
    assert.equal(ok.status, 200, 'an unrelated account is not locked');
    // and the same account is shared by every login route: wrong passwords on one route count on the others
    const shared = `shared-${fx.ts}@example.invalid`;
    await codes(3, () => fx.call('POST', '/v1/auth/store/login', null, { email: shared, password: 'Wrong-pass-1' }));
    assert.equal((await fx.call('POST', '/v1/auth/franchise/login', null, { email: shared, password: 'Wrong-pass-1' })).status, 429);
});

test('wrong OTP codes stop per phone for customers and riders', async () => {
    for (const [path, phone] of [['/v1/auth/user/verify-otp', '9811111111'], ['/v1/auth/delivery/verify-otp', '9822222222']]) {
        const got = await codes(5, () => fx.call('POST', path, null, { phone, otp: '000000' }));
        assert.deepEqual(got.map((s) => s === 429), [false, false, false, true, true], `${path}: ${got}`);
    }
});

test('password reset codes: 2 requests per email, then 429', async () => {
    const email = `owner-${fx.ts}@example.invalid`;
    const got = await codes(4, () => fx.call('POST', '/v1/auth/admin/forgot-password/request-otp', null, { email }));
    assert.deepEqual(got.map((s) => s === 429), [false, false, true, true], String(got));
});

test('/ready is 200 when MongoDB is connected and 503 while the server is shutting down', async () => {
    const { default: app } = await import('../src/app.js');
    assert.equal((await fx.api.get('/ready')).status, 200);
    app.locals.shuttingDown = true;
    try {
        assert.equal((await fx.api.get('/ready')).status, 503);
        assert.equal((await fx.api.get('/health')).status, 200, '/health stays up');
    } finally {
        app.locals.shuttingDown = false;
    }
});
