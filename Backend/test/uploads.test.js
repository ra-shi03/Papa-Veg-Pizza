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

// ---- M5: the Cloudinary folder is chosen on the server -------------------------------------------------
// Cloudinary is stubbed (shared SDK singleton), so these record the folder each upload would go to.
describe('M5: upload folder is chosen by the server', () => {
    const folders = [];
    let restore;
    before(async () => {
        const { v2: cloudinary } = await import('cloudinary');
        const original = cloudinary.uploader.upload_stream;
        cloudinary.uploader.upload_stream = (options, cb) => {
            folders.push(options.folder);
            return { end: () => cb(null, { secure_url: `https://res.cloudinary.test/${options.folder}/x` }) };
        };
        restore = () => { cloudinary.uploader.upload_stream = original; };
    });
    after(() => restore?.());

    const PDF = Buffer.from('%PDF-1.4 test');
    const send = async (path, token, folder, file = PNG_HEADER, name = 'a.png', type = 'image/png') => {
        const before = folders.length;
        const res = await fx.api.post(`/api${path}`).set(fx.bearer(token)).field('folder', folder).attach('file', file, { filename: name, contentType: type });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(folders.length, before + 1);
        return folders.at(-1);
    };
    const A = () => fx.F.A;
    const manager = () => fx.tokenFor(A().managerUserId, 'STORE_MANAGER', { franchiseId: A().franchiseId, storeId: A().storeId });
    let riderToken;
    before(async () => { riderToken = (await fx.partner()).token; });
    const rider = () => riderToken;

    test('a customer cannot write into an admin folder', async () => {
        assert.equal(await send('/v1/uploads/image', A().customerToken, 'store-approvals/documents'), 'customers/uploads');
        assert.equal(await send('/v1/uploads/file', A().customerToken, 'uploads', PDF, 'a.pdf', 'application/pdf'), 'customers/uploads/files');
    });
    test('a franchise admin and a store manager land in their own scoped folder', async () => {
        assert.equal(await send('/v1/uploads/image', A().adminToken, 'welcome/images'), `franchises/${A().franchiseId}/uploads`);
        assert.equal(await send('/v1/uploads/image', manager(), '../other'), `stores/${A().storeId}/uploads`);
    });
    test('a super admin may use the panel folders, nothing else', async () => {
        assert.equal(await send('/v1/uploads/image', fx.SA, 'search/tabs'), 'search/tabs');
        assert.equal(await send('/v1/uploads/image', fx.SA, 'store-approvals/documents'), 'uploads');
        assert.equal(await send('/v1/uploads/file', fx.SA, 'bulk-orders', PDF, 'a.pdf', 'application/pdf'), 'bulk-orders');
    });
    test('a rider keeps the pickup-bill folder but nothing else', async () => {
        assert.equal(await send('/v1/uploads/image', rider(), 'appzeto/delivery/bills'), 'appzeto/delivery/bills');
        assert.equal(await send('/v1/uploads/image', rider(), 'welcome/images'), 'delivery/uploads');
    });
});

// ---- M4: public delivery-partner registration ----------------------------------------------------------
describe('M4: /v1/food/delivery/register only takes small, real images', () => {
    const register = (field, buffer, filename, contentType) =>
        fx.api.post('/api/v1/food/delivery/register').field('name', 'Rider').attach(field, buffer, { filename, contentType });

    test('an image over 5 MB -> 413', async () => {
        const big = Buffer.concat([PNG_HEADER, Buffer.alloc(6 * 1024 * 1024)]);
        assert.equal((await register('aadharPhoto', big, 'big.png', 'image/png')).status, 413);
    });
    test('a non-image file -> 400', async () => {
        assert.equal((await register('panPhoto', Buffer.from('%PDF-1.4'), 'a.pdf', 'application/pdf')).status, 400);
    });
    test('a script labelled as an image -> 400', async () => {
        assert.equal((await register('profilePhoto', Buffer.from('<?php system($_GET[0]);'), 'a.png', 'image/png')).status, 400);
    });
    test('a file in an unexpected field -> 400', async () => {
        assert.equal((await register('payload', PNG_HEADER, 'a.png', 'image/png')).status, 400);
    });
    test('two files in a one-file field -> 400', async () => {
        const res = await fx.api.post('/api/v1/food/delivery/register')
            .attach('aadharPhoto', PNG_HEADER, { filename: 'a.png', contentType: 'image/png' })
            .attach('aadharPhoto', PNG_HEADER, { filename: 'b.png', contentType: 'image/png' });
        assert.equal(res.status, 400);
    });
});
