// M6: login OTPs are 6 digits (random in production, 123456 only in dev default mode).
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let config; let otpService; let realFetch;
before(async () => {
    fx = await createFixture();
    ({ config } = await import('../src/config/env.js'));
    otpService = await import('../src/core/otp/otp.service.js');
    realFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, text: async () => 'ok' }); // never call the SMS provider
});
after(async () => { globalThis.fetch = realFetch; await fx?.teardown(); });

const withDefaultOtp = async (value, fn) => {
    const before = config.useDefaultOtp;
    config.useDefaultOtp = value;
    try { return await fn(); } finally { config.useDefaultOtp = before; }
};

describe('generated OTPs', () => {
    test('random OTPs are always exactly 6 digits and do not start with 0', async () => {
        await withDefaultOtp(false, async () => {
            for (let i = 0; i < 60; i += 1) {
                const otp = await otpService.createOrUpdateOtp(`7${String(fx.ts).slice(-6)}${String(i).padStart(3, '0')}`);
                assert.match(otp, /^[1-9]\d{5}$/);
            }
        });
    });
    test('the fixed dev OTP is 123456 and only exists in default-OTP mode', async () => {
        await withDefaultOtp(true, async () => assert.equal(await otpService.createOrUpdateOtp('8000000001'), '123456'));
        await withDefaultOtp(false, async () => assert.notEqual(await otpService.createOrUpdateOtp('8000000002'), '123456'));
    });
});

describe('OTP verify endpoints only accept 6 digits', () => {
    const verify = (path, otp, extra = {}) => fx.call('POST', path, null, { phone: '9876501234', otp, name: 'Test Person', ...extra });
    for (const path of ['/v1/auth/user/verify-otp', '/v1/auth/delivery/verify-otp']) {
        test(`${path}: 4, 5, 7 digits and non-digits -> 400`, async () => {
            for (const otp of ['1234', '12345', '1234567', '12345a', '']) {
                assert.equal((await verify(path, otp)).status, 400, `otp "${otp}"`);
            }
        });
    }
    test('the user flow works end to end with a 6-digit OTP', async () => {
        await withDefaultOtp(true, async () => {
            const phone = `9${String(fx.ts).slice(-9)}`;
            assert.equal((await fx.call('POST', '/v1/auth/user/request-otp', null, { phone })).status, 200);
            const res = await fx.call('POST', '/v1/auth/user/verify-otp', null, { phone, otp: '123456', name: 'Test Person' });
            assert.equal(res.status, 200, JSON.stringify(res.body));
            assert.ok(res.body.data?.accessToken);
        });
    });
    test('the old 4-digit dev OTP no longer logs anyone in', async () => {
        await withDefaultOtp(true, async () => {
            const phone = `9${String(fx.ts + 1).slice(-9)}`;
            await fx.call('POST', '/v1/auth/user/request-otp', null, { phone });
            assert.equal((await fx.call('POST', '/v1/auth/user/verify-otp', null, { phone, otp: '1234', name: 'Test Person' })).status, 400);
        });
    });
});
