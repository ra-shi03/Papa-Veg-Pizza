// P0 item 2: uploads need a login, and only real, small files of the right type get through.
// Rejection cases only: no valid file is sent, so nothing ever reaches Cloudinary.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx;
before(async () => { fx = await createFixture(); });
after(async () => { await fx?.teardown(); });

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const upload = (path, token, buffer, filename, contentType) => {
    let r = fx.api.post(`/api${path}`);
    if (token) r = r.set(fx.bearer(token));
    return r.attach('file', buffer, { filename, contentType });
};

describe('authentication', () => {
    for (const path of ['/v1/uploads/image', '/v1/uploads/file', '/v1/uploads/video']) {
        test(`${path} without a token -> 401`, async () => {
            assert.equal((await upload(path, null, PNG_HEADER, 'a.png', 'image/png')).status, 401);
        });
    }
});

describe('/v1/uploads/image', () => {
    test('plain text sent as an image -> 400', async () => {
        assert.equal((await upload('/v1/uploads/image', fx.F.A.customerToken, Buffer.from('hello'), 'a.txt', 'text/plain')).status, 400);
    });
    test('SVG is refused (scriptable) -> 400', async () => {
        assert.equal((await upload('/v1/uploads/image', fx.F.A.customerToken, Buffer.from('<svg onload=alert(1)>'), 'a.svg', 'image/svg+xml')).status, 400);
    });
    test('a script with an image content-type is caught by the magic-byte check -> 400', async () => {
        assert.equal((await upload('/v1/uploads/image', fx.F.A.customerToken, Buffer.from('<?php system($_GET[0]);'), 'a.png', 'image/png')).status, 400);
    });
    test('an image over 5 MB -> 413', async () => {
        const big = Buffer.concat([PNG_HEADER, Buffer.alloc(6 * 1024 * 1024)]);
        assert.equal((await upload('/v1/uploads/image', fx.F.A.customerToken, big, 'big.png', 'image/png')).status, 413);
    });
});

describe('/v1/uploads/file and /v1/uploads/video', () => {
    test('an image sent to the PDF route -> 400', async () => {
        assert.equal((await upload('/v1/uploads/file', fx.F.A.customerToken, PNG_HEADER, 'a.png', 'image/png')).status, 400);
    });
    test('a fake PDF (wrong bytes) -> 400', async () => {
        assert.equal((await upload('/v1/uploads/file', fx.F.A.customerToken, Buffer.from('not really a pdf'), 'a.pdf', 'application/pdf')).status, 400);
    });
    test('an executable sent as a video -> 400', async () => {
        assert.equal((await upload('/v1/uploads/video', fx.F.A.customerToken, Buffer.from('MZ'), 'a.exe', 'application/octet-stream')).status, 400);
    });
});
