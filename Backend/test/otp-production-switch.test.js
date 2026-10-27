// Temporary production demo switch: USE_DEFAULT_OTP=true + ALLOW_DEFAULT_OTP_IN_PRODUCTION=true lets phone logins use 123456
// in production (optionally only for TEST_OTP_PHONES). Runs the app in production mode; NODE_ENV must be set before it loads.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://app.example.com';
process.env.USE_DEFAULT_OTP = 'true';
process.env.ALLOW_DEFAULT_OTP_IN_PRODUCTION = 'true';
process.env.TEST_OTP_PHONES = '';

const { createFixture } = await import('./helpers/fixture.js');
const { config } = await import('../src/config/env.js');
const { validateConfig } = await import('../src/config/validateEnv.js');
const { logger } = await import('../src/utils/logger.js');
const { OTPVerification } = await import('../src/core/auth/models/otpVerification.model.js');
const authService = await import('../src/core/auth/auth.service.js');

let fx; let realFetch; let smsCalls = 0;
before(async () => {
    fx = await createFixture();
    realFetch = globalThis.fetch;
    globalThis.fetch = async () => { smsCalls += 1; return { ok: true, text: async () => 'ok' }; }; // never call the SMS provider
});
after(async () => { globalThis.fetch = realFetch; await fx?.teardown(); });

let seq = 0;
const newPhone = () => `9${String(Date.now()).slice(-6)}${String(seq++).padStart(3, '0')}`;
const requestOtp = (phone, who = 'user') => fx.call('POST', `/v1/auth/${who}/request-otp`, null, { phone });
const verifyOtp = (phone, otp, who = 'user') => fx.call('POST', `/v1/auth/${who}/verify-otp`, null, { phone, otp, name: 'Demo Person' });
const storedOtp = async (phone) => (await OTPVerification.findOne({ mobile: phone }).lean())?.otp;

/** Runs fn with the switch set as given, then puts the loaded config back. */
const withSwitch = async ({ use, allow, phones = [] }, fn) => {
    const saved = { use: config.useDefaultOtpRequested, allow: config.allowDefaultOtpInProduction, phones: config.testOtpPhones };
    config.useDefaultOtpRequested = use; config.allowDefaultOtpInProduction = allow; config.testOtpPhones = phones;
    try { return await fn(); } finally {
        config.useDefaultOtpRequested = saved.use; config.allowDefaultOtpInProduction = saved.allow; config.testOtpPhones = saved.phones;
    }
};
const ON = { use: true, allow: true };

describe('configuration', () => {
    test('loaded in production with both flags: switch on, dev default-OTP mode still off', () => {
        assert.equal(config.nodeEnv, 'production');
        assert.equal(config.useDefaultOtp, false);
        assert.equal(config.allowDefaultOtpInProduction, true);
        assert.deepEqual(config.testOtpPhones, []);
    });
    test('only the exact value "true" turns it on; TEST_OTP_PHONES is reduced to 10-digit numbers', async () => {
        const saved = { allow: process.env.ALLOW_DEFAULT_OTP_IN_PRODUCTION, phones: process.env.TEST_OTP_PHONES };
        try {
            for (const [value, expected] of [['true', true], ['TRUE', false], ['1', false], ['yes', false], [' true', false], ['', false]]) {
                process.env.ALLOW_DEFAULT_OTP_IN_PRODUCTION = value;
                process.env.TEST_OTP_PHONES = '+91 98765 43210, 9000000001 ,,';
                const fresh = (await import(`../src/config/env.js?allow=${encodeURIComponent(value)}`)).config;
                assert.equal(fresh.allowDefaultOtpInProduction, expected, `"${value}"`);
                assert.deepEqual(fresh.testOtpPhones, ['9876543210', '9000000001']);
            }
        } finally {
            process.env.ALLOW_DEFAULT_OTP_IN_PRODUCTION = saved.allow; process.env.TEST_OTP_PHONES = saved.phones;
        }
    });
});

describe('switch off in production: exactly as before', () => {
    for (const [label, flags] of [
        ['neither flag', { use: false, allow: false }],
        ['USE_DEFAULT_OTP only', { use: true, allow: false }],
        ['ALLOW_DEFAULT_OTP_IN_PRODUCTION only', { use: false, allow: true }],
    ]) {
        test(`${label}: a random OTP is sent by SMS and 123456 is rejected`, async () => {
            await withSwitch(flags, async () => {
                const phone = newPhone();
                const sms = smsCalls;
                const res = await requestOtp(phone);
                assert.equal(res.status, 200, JSON.stringify(res.body));
                assert.equal(res.body.data?.otp, undefined);
                const otp = await storedOtp(phone);
                assert.match(otp, /^[1-9]\d{5}$/);
                assert.notEqual(otp, '123456');
                assert.equal(smsCalls, sms + 1, 'SMS sent');
                const v = await verifyOtp(phone, '123456');
                assert.notEqual(v.status, 200);
                assert.equal(v.body.data?.accessToken, undefined);
            });
        });
    }
});

describe('switch on (no allowlist): 123456 works for every number, never shown in the response', () => {
    test('customer: request has no OTP in the response, no SMS is sent, 123456 signs in', async () => {
        await withSwitch(ON, async () => {
            const phone = newPhone();
            const sms = smsCalls;
            const res = await requestOtp(phone);
            assert.equal(res.status, 200);
            assert.equal(res.body.data?.otp, undefined);
            assert.ok(!JSON.stringify(res.body).includes('123456'), 'OTP is not in the response');
            assert.equal(smsCalls, sms, 'no SMS');
            const v = await verifyOtp(phone, '123456');
            assert.equal(v.status, 200, JSON.stringify(v.body));
            assert.ok(v.body.data?.accessToken);
        });
    });
    test('delivery partner: same, for an approved partner', async () => {
        await withSwitch(ON, async () => {
            const rider = await fx.partner('approved');
            const { phone } = await fx.models.User.db.collection('food_delivery_partners').findOne({ _id: new (await import('mongoose')).default.Types.ObjectId(rider.id) });
            const res = await requestOtp(phone, 'delivery');
            assert.equal(res.status, 200, JSON.stringify(res.body));
            assert.ok(!JSON.stringify(res.body).includes('123456'), 'OTP is not in the response');
            const v = await verifyOtp(phone, '123456', 'delivery');
            assert.equal(v.status, 200, JSON.stringify(v.body));
            assert.ok(!v.body.data?.needsRegistration);
        });
    });
    test('the 6-digit rule is unchanged', async () => {
        await withSwitch(ON, async () => {
            const phone = newPhone();
            await requestOtp(phone);
            for (const otp of ['1234', '12345', '1234567', '12345a']) assert.equal((await verifyOtp(phone, otp)).status, 400, otp);
        });
    });
    test('the attempt limit is unchanged: after 5 wrong tries even 123456 is refused', async () => {
        await withSwitch(ON, async () => {
            const phone = newPhone();
            await requestOtp(phone);
            for (let i = 0; i < config.otpMaxAttempts; i += 1) assert.notEqual((await verifyOtp(phone, '111111')).status, 200);
            const v = await verifyOtp(phone, '123456');
            assert.notEqual(v.status, 200);
            assert.equal(v.body.data?.accessToken, undefined);
        });
    });
    test('the per-number OTP request limit is unchanged', async () => {
        await withSwitch(ON, async () => {
            const phone = newPhone();
            for (let i = 0; i < config.otpRateLimit; i += 1) assert.equal((await requestOtp(phone)).status, 200);
            assert.equal((await requestOtp(phone)).status, 400);
        });
    });
    test('admin password-reset OTPs are not affected (still random)', async () => {
        await withSwitch(ON, async () => {
            await authService.requestAdminForgotPasswordOtp(fx.F.A.email);
            const rec = await fx.models.AdminResetOtp.findOne({ email: fx.F.A.email.toLowerCase() }).lean();
            assert.ok(rec);
            assert.notEqual(rec.otp, '123456');
        });
    });
});

describe('switch on with TEST_OTP_PHONES: only those numbers', () => {
    test('a listed number gets 123456; any other number is refused an OTP (403) and 123456 does not sign it in', async () => {
        const listed = newPhone(); const other = newPhone();
        await withSwitch({ ...ON, phones: [listed.slice(-10)] }, async () => {
            const sms = smsCalls;
            assert.equal((await requestOtp(listed)).status, 200);
            assert.equal((await verifyOtp(listed, '123456')).status, 200);

            const res = await requestOtp(other);
            assert.equal(res.status, 403);
            assert.equal(res.body.success, false);
            assert.equal(await storedOtp(other), undefined, 'nothing stored for the other number');
            assert.notEqual((await verifyOtp(other, '123456')).status, 200);
            assert.equal((await requestOtp(other, 'delivery')).status, 403, 'delivery login too');
            assert.equal(smsCalls, sms, 'no SMS for anyone');
        });
    });
});

describe('startup warning', () => {
    const warningsFor = async (flags) => withSwitch(flags, async () => {
        const seen = []; const realWarn = logger.warn; const realExit = process.exit;
        logger.warn = (msg) => { seen.push(String(msg)); };
        process.exit = (code) => { throw new Error(`process.exit(${code})`); };
        try { validateConfig(); } finally { logger.warn = realWarn; process.exit = realExit; }
        return seen.join('\n');
    });
    test('switch on, all numbers: loud warning that anyone can sign in', async () => {
        const out = await warningsFor(ON);
        assert.match(out, /DEFAULT OTP 123456 IS ACTIVE IN PRODUCTION/);
        assert.match(out, /EVERY phone number/);
        assert.match(out, /Remove this switch before the real launch/);
    });
    test('switch on with an allowlist: the warning names how many numbers', async () => {
        assert.match(await warningsFor({ ...ON, phones: ['9000000001', '9000000002'] }), /Only for the 2 number\(s\) in TEST_OTP_PHONES/);
    });
    test('switch off: no "active" warning', async () => {
        const out = await warningsFor({ use: true, allow: false });
        assert.doesNotMatch(out, /IS ACTIVE IN PRODUCTION/);
        assert.match(out, /USE_DEFAULT_OTP=true is ignored in production/);
        assert.doesNotMatch(await warningsFor({ use: false, allow: true }), /IS ACTIVE IN PRODUCTION/);
    });
});
