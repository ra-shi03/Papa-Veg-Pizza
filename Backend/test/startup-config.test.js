// Startup configuration: production refuses to start without FRONTEND_URL, and sockets never fall back to '*'.
// Each case runs in a fresh Node process so the env is read exactly as it would be at boot.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const run = (code, env) => spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
        PATH: process.env.PATH,
        MONGO_URI: 'mongodb://127.0.0.1:1/unused', JWT_ACCESS_SECRET: 'a'.repeat(32), JWT_REFRESH_SECRET: 'b'.repeat(32),
        SOCKET_CORS_ORIGIN: '', FRONTEND_URL: '', ...env,
    },
    encoding: 'utf8',
});
const validate = "const { validateConfig } = await import('./src/config/validateEnv.js'); validateConfig(); console.log('STARTED_OK');";
const socketOrigin = "const { config } = await import('./src/config/env.js'); console.log('ORIGIN=' + JSON.stringify(config.socketCorsOrigin.map(String)));";

describe('production start-up', () => {
    test('an empty FRONTEND_URL stops the server with a clear message', () => {
        const r = run(validate, { NODE_ENV: 'production' });
        assert.equal(r.status, 1);
        assert.match(r.stdout + r.stderr, /FRONTEND_URL is not set/);
        assert.doesNotMatch(r.stdout, /STARTED_OK/);
    });
    test('with FRONTEND_URL set it starts', () => {
        const r = run(validate, { NODE_ENV: 'production', FRONTEND_URL: 'https://app.example.com' });
        assert.equal(r.status, 0, r.stdout + r.stderr);
        assert.match(r.stdout, /STARTED_OK/);
    });
    test('an empty FRONTEND_URL is fine outside production', () => {
        assert.equal(run(validate, { NODE_ENV: 'development' }).status, 0);
    });
});

describe('socket CORS never falls back to *', () => {
    test('production with no origins allows nobody', () => {
        const r = run(socketOrigin, { NODE_ENV: 'production' });
        assert.match(r.stdout, /ORIGIN=\[\]/);
    });
    test('development with nothing set allows local/LAN origins only, not "*"', () => {
        const r = run(socketOrigin, { NODE_ENV: 'development' });
        assert.doesNotMatch(r.stdout, /"\*"/);
        assert.match(r.stdout, /localhost/);
    });
    test('FRONTEND_URL and SOCKET_CORS_ORIGIN become exact allow-lists', () => {
        assert.match(run(socketOrigin, { NODE_ENV: 'production', FRONTEND_URL: 'https://a.example.com/, https://b.example.com' }).stdout, /ORIGIN=\["https:\/\/a\.example\.com","https:\/\/b\.example\.com"\]/);
        assert.match(run(socketOrigin, { NODE_ENV: 'production', FRONTEND_URL: 'https://a.example.com', SOCKET_CORS_ORIGIN: 'https://s.example.com' }).stdout, /ORIGIN=\["https:\/\/s\.example\.com"\]/);
    });
});
