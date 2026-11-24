// Rate limiting on login and OTP, and the shared counter that keeps limits right behind a load balancer.
//   - per caller (IP): AUTH_RATE_LIMIT_MAX on every auth route, whatever account is named
//   - per account: failed passwords (LOGIN_FAIL_MAX), wrong OTP codes (OTP_VERIFY_FAIL_MAX) and reset requests
//     (FORGOT_OTP_MAX) are limited per email / phone from any IP; a successful sign-in does not count
//   - SharedRateLimitStore: two "processes" counting through the same Redis share one count; no Redis = per-process memory
// A small express app with the real limiters keeps this fast and independent of the database.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.AUTH_RATE_LIMIT_MAX = '8';
process.env.AUTH_RATE_LIMIT_WINDOW = '15';
process.env.LOGIN_FAIL_MAX = '3';
process.env.OTP_VERIFY_FAIL_MAX = '3';
process.env.FORGOT_OTP_MAX = '2';

let rl; let StoreCls; let rateLimit;
before(async () => {
    rl = await import('../src/middleware/rateLimit.js');
    StoreCls = (await import('../src/middleware/rateLimitStore.js')).SharedRateLimitStore;
    rateLimit = (await import('express-rate-limit')).default;
});

/** A tiny app wired the way auth.routes.js wires the real routes. 'good' signs in; anything else is a 401. */
const makeApp = () => {
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    const handler = (req, res) => (req.body.password === 'good' || req.body.otp === '111111'
        ? res.status(200).json({ success: true })
        : res.status(401).json({ success: false, message: 'wrong' }));
    app.post('/login', rl.authRateLimiter, rl.loginAccountLimiter, handler);
    app.post('/verify', rl.authRateLimiter, rl.otpVerifyAccountLimiter, handler);
    app.post('/forgot', rl.authRateLimiter, rl.forgotRequestAccountLimiter, (_req, res) => res.status(200).json({ success: true }));
    return app;
};
const ip = (n) => ({ 'X-Forwarded-For': `10.0.0.${n}` });

describe('per account (from any IP)', () => {
    test('wrong passwords for one email stop after LOGIN_FAIL_MAX, even from different IPs; another account is untouched', async () => {
        const app = makeApp();
        const codes = [];
        for (let i = 1; i <= 5; i++) codes.push((await request(app).post('/login').set(ip(i)).send({ email: 'Victim@Example.com', password: 'bad' })).status);
        assert.deepEqual(codes, [401, 401, 401, 429, 429]);
        assert.equal((await request(app).post('/login').set(ip(50)).send({ email: 'someone@else.com', password: 'bad' })).status, 401);
        const blocked = await request(app).post('/login').set(ip(60)).send({ email: 'victim@example.com', password: 'bad' });
        assert.equal(blocked.status, 429);
        assert.match(blocked.body.message, /Too many failed sign-in attempts/);
    });
    test('successful sign-ins never count against the account', async () => {
        const app = makeApp();
        for (let i = 1; i <= 6; i++) assert.equal((await request(app).post('/login').set(ip(i)).send({ email: 'real@user.com', password: 'good' })).status, 200);
        assert.equal((await request(app).post('/login').set(ip(9)).send({ email: 'real@user.com', password: 'bad' })).status, 401);
    });
    test('wrong OTP codes stop per phone number (any formatting of the number)', async () => {
        const app = makeApp();
        const codes = [];
        for (const [i, phone] of ['9876543210', '+91 98765 43210', '098765-43210', '9876543210'].entries()) {
            codes.push((await request(app).post('/verify').set(ip(i + 1)).send({ phone, otp: '000000' })).status);
        }
        assert.deepEqual(codes, [401, 401, 401, 429]);
        assert.equal((await request(app).post('/verify').set(ip(7)).send({ phone: '9123456780', otp: '000000' })).status, 401);
    });
    test('password reset requests are limited per email, every request counts', async () => {
        const app = makeApp();
        const codes = [];
        for (let i = 1; i <= 3; i++) codes.push((await request(app).post('/forgot').set(ip(i)).send({ email: 'owner@shop.com' })).status);
        assert.deepEqual(codes, [200, 200, 429]);
    });
    test('a request that names no account is left to the per-IP limit and validation', async () => {
        const app = makeApp();
        for (let i = 0; i < 4; i++) assert.equal((await request(app).post('/login').set(ip(1)).send({ password: 'bad' })).status, 401);
    });
});

describe('per caller (IP)', () => {
    test('AUTH_RATE_LIMIT_MAX requests from one IP, whatever accounts they name, then 429; other IPs are fine', async () => {
        const app = makeApp();
        const codes = [];
        for (let i = 1; i <= 10; i++) codes.push((await request(app).post('/login').set(ip(200)).send({ email: `u${i}@x.com`, password: 'bad' })).status);
        assert.deepEqual(codes, [401, 401, 401, 401, 401, 401, 401, 401, 429, 429]);
        assert.match((await request(app).post('/login').set(ip(200)).send({ email: 'z@x.com', password: 'bad' })).body.message, /Too many authentication attempts/);
        assert.equal((await request(app).post('/login').set(ip(201)).send({ email: 'z@x.com', password: 'bad' })).status, 401);
    });
});

/** The slice of the redis v4 client the store uses, backed by a Map, shared by every "process" that is given it. */
const fakeRedis = () => {
    const data = new Map();
    const alive = (k) => data.has(k) && (data.get(k).exp === null || data.get(k).exp > Date.now());
    return {
        isReady: true,
        async incr(k) { if (!alive(k)) data.set(k, { n: 0, exp: null }); const e = data.get(k); e.n += 1; return e.n; },
        async decr(k) { if (alive(k)) data.get(k).n -= 1; },
        async pExpire(k, ms) { if (alive(k)) data.get(k).exp = Date.now() + ms; },
        async pTTL(k) { if (!alive(k)) return -2; const e = data.get(k); return e.exp === null ? -1 : e.exp - Date.now(); },
        async del(k) { data.delete(k); },
    };
};
const limiterOn = (store) => {
    const app = express();
    app.use(rateLimit({ windowMs: 60000, max: 5, store, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'limit' } }));
    app.get('/x', (_req, res) => res.json({ ok: true }));
    return app;
};

describe('SharedRateLimitStore (load balancing)', () => {
    test('two processes sharing Redis share ONE count: 5 allowed in total, not 5 each', async () => {
        const redis = fakeRedis();
        const a = limiterOn(new StoreCls('shared', () => redis));
        const b = limiterOn(new StoreCls('shared', () => redis));
        const codes = [];
        for (let i = 0; i < 8; i++) codes.push((await request(i % 2 ? a : b).get('/x')).status);
        assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429, 429]);
    });
    test('without Redis each process counts in its own memory (limits still work)', async () => {
        const a = limiterOn(new StoreCls('mem', () => null));
        const codes = [];
        for (let i = 0; i < 7; i++) codes.push((await request(a).get('/x')).status);
        assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
    });
    test('a Redis that errors never blocks a request: it falls back to memory', async () => {
        const broken = { isReady: true, incr: async () => { throw new Error('boom'); }, pExpire: async () => {}, pTTL: async () => 1, decr: async () => {}, del: async () => {} };
        const a = limiterOn(new StoreCls('broken', () => broken));
        const codes = [];
        for (let i = 0; i < 6; i++) codes.push((await request(a).get('/x')).status);
        assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
    });
    test('the counter resets after the window and a key that lost its expiry is repaired', async () => {
        const redis = fakeRedis();
        const store = new StoreCls('ttl', () => redis);
        store.init({ windowMs: 50 });
        await store.increment('k');
        await new Promise((r) => setTimeout(r, 80));
        assert.equal((await store.increment('k')).totalHits, 1, 'a new window starts at 1');
        await redis.incr('rl:ttl:orphan');                 // a key with no expiry (e.g. a crash between INCR and EXPIRE)
        const hit = await store.increment('orphan');
        assert.equal(hit.totalHits, 2);
        assert.ok(await redis.pTTL('rl:ttl:orphan') > 0, 'it now expires');
    });
});

describe('job worker role', () => {
    test('a plain process and PVP_JOB_WORKER=1 run the once-only jobs; 0 does not', async () => {
        const { isJobWorker } = await import('../src/config/jobRole.js');
        const was = process.env.PVP_JOB_WORKER;
        try {
            delete process.env.PVP_JOB_WORKER; assert.equal(isJobWorker(), true);
            process.env.PVP_JOB_WORKER = '1'; assert.equal(isJobWorker(), true);
            process.env.PVP_JOB_WORKER = '0'; assert.equal(isJobWorker(), false);
        } finally {
            if (was === undefined) delete process.env.PVP_JOB_WORKER; else process.env.PVP_JOB_WORKER = was;
        }
    });
});
