// P0 item 6, production mode: CORS allow-list from FRONTEND_URL, default OTP ignored,
// access tokens default to 15 minutes. NODE_ENV must be set before the app is loaded.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.FRONTEND_URL = 'https://admin.example.com/, https://app.example.com';
process.env.USE_DEFAULT_OTP = 'true';
process.env.JWT_ACCESS_EXPIRES = '';
process.env.SOCKET_CORS_ORIGIN = '';

const { createFixture } = await import('./helpers/fixture.js');
const { config } = await import('../src/config/env.js');

let fx;
before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

const allowOrigin = async (origin) => {
    const res = await fx.api.get('/api/v1/health').set(origin ? { Origin: origin } : {});
    return { status: res.status, acao: res.headers['access-control-allow-origin'] ?? null };
};

describe('production configuration', () => {
    test('USE_DEFAULT_OTP=true is ignored in production', () => {
        assert.equal(config.nodeEnv, 'production');
        assert.equal(config.useDefaultOtp, false);
    });
    test('access tokens default to 15 minutes', () => assert.equal(config.jwtAccessExpiresIn, '15m'));
    test('FRONTEND_URL becomes a trimmed allow-list; sockets use the same list', () => {
        assert.deepEqual(config.corsOrigins, ['https://admin.example.com', 'https://app.example.com']);
        assert.deepEqual(config.socketCorsOrigin, config.corsOrigins);
    });
});

describe('CORS', () => {
    test('listed origins are allowed', async () => {
        assert.equal((await allowOrigin('https://admin.example.com')).acao, 'https://admin.example.com');
        assert.equal((await allowOrigin('https://app.example.com')).acao, 'https://app.example.com');
    });
    test('other sites get no CORS headers', async () => {
        assert.equal((await allowOrigin('https://evil.example.com')).acao, null);
    });
    test('look-alike origins are blocked', async () => {
        assert.equal((await allowOrigin('https://admin.example.com.evil.com')).acao, null);
        assert.equal((await allowOrigin('http://admin.example.com')).acao, null);
    });
    test('localhost and LAN origins are NOT allowed in production', async () => {
        assert.equal((await allowOrigin('http://localhost:5173')).acao, null);
        assert.equal((await allowOrigin('http://192.168.1.5:5173')).acao, null);
    });
    test('requests without an Origin header (mobile apps, webhooks) are still served', async () => {
        assert.equal((await allowOrigin(null)).status, 200);
    });
});
