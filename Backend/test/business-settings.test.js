// The one business settings record: super admin writes, the apps read display fields from the public endpoint. An empty
// contact stays empty (the apps hide it): no developer's or template's details behind it.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { createFixture } from './helpers/fixture.js';

let fx; let A;
const ADMIN = '/v1/food/admin/business-settings';
const PUBLIC = `${ADMIN}/public`;
const pub = async () => (await fx.call('GET', PUBLIC)).body.data;
const patch = (body, token = fx.SA) => fx.call('PATCH', ADMIN, token, body);
const FULL = {
    companyName: '  Papa Veg Foods Pvt Ltd ', supportPhone: '+91 98123 45678', supportEmail: 'help@example.invalid',
    cateringPhone: '+91 98123 45679', cateringEmail: 'party@example.invalid', whatsappNumber: '9812345670', address: '1 Market Road, Pune',
    gstin: '27aaapl1234c1zv', faqContactText: 'We reply within a day.', website: 'https://example.invalid',
};

before(async () => { fx = await createFixture(); A = fx.F.A; });
after(async () => { await fx?.teardown(); });

describe('an empty setting', () => {
    test('nothing is invented: every contact is empty, and reading creates no record', async () => {
        const info = await pub();
        for (const key of ['companyName', 'supportPhone', 'supportEmail', 'cateringPhone', 'cateringEmail', 'whatsappNumber', 'address', 'gstin', 'faqContactText']) {
            assert.equal(info[key], '', key);
        }
        assert.equal(await fx.models.FoodStore.db.collection('foodbusinesssettings').countDocuments(), 0);
    });
    test('the screens that show contacts get empty values too, so they hide the line', async () => {
        const support = (await fx.call('GET', '/v1/food/pages/support')).body.data;
        assert.deepEqual([support.phone, support.email, support.contactInfo.phone, support.contactInfo.email], ['', '', '', '']);
        const bulk = (await fx.call('GET', '/v1/bulk-order/config')).body.data;
        for (const value of [bulk.virtualParty.corporatePhone, bulk.virtualParty.corporateEmail, bulk.egiftVoucher.corporatePhone, bulk.egiftVoucher.corporateEmail,
            bulk.contactPage.feedbackEmail, bulk.contactPage.customerCareNumber, bulk.contactPage.companyName, bulk.contactPage.addressLine1, bulk.contactPage.addressLine2]) {
            assert.equal(value, '');
        }
    });
    test('the old template defaults saved in an existing record read as empty', async () => {
        const col = fx.models.FoodStore.db.collection('foodbusinesssettings');
        const { insertedId } = await col.insertOne({ companyName: 'Appzeto', email: 'admin@appzeto.com', supportEmail: 'support@foodelo.com', supportPhone: '+91 1234567890', supportHours: '24/7 Availability', createdAt: new Date() });
        const { getBusinessInfo, clearBusinessInfoCache } = await import('../src/modules/food/admin/services/businessSettings.service.js');
        clearBusinessInfoCache();
        const info = await getBusinessInfo();
        assert.deepEqual([info.companyName, info.supportEmail, info.supportPhone, info.supportHours], ['', '', '', '']);
        await col.deleteOne({ _id: insertedId });
        clearBusinessInfoCache();
    });
    test('saved numbers on the older pages are never served, whatever they hold', async () => {
        const secret = '+91 9000011111';
        await fx.models.FoodStore.db.collection('food_page_contents').updateOne({ key: 'support' }, { $set: { 'support.contactInfo.phone': secret } }, { upsert: true });
        await fx.models.FoodStore.db.collection('bulkorderconfigs').updateMany({}, { $set: { 'virtualParty.corporatePhone': secret } });
        assert.ok(!JSON.stringify((await fx.call('GET', '/v1/food/pages/support')).body).includes(secret));
        assert.ok(!JSON.stringify((await fx.call('GET', '/v1/bulk-order/config')).body).includes(secret));
    });
});

describe('who may write', () => {
    test('only the super admin; anyone else is refused and nothing changes', async () => {
        const rider = await fx.partner();
        assert.equal((await patch(FULL, null)).status, 401);
        for (const token of [A.adminToken, A.managerToken, A.customerToken, rider.token]) {
            assert.equal((await patch(FULL, token)).status, 403);
            assert.equal((await fx.call('GET', ADMIN, token)).status, 403);
        }
        assert.equal((await pub()).companyName, '');
    });
});

describe('validation', () => {
    for (const [name, body, message] of [
        ['a bad phone', { supportPhone: 'call me' }, /phone/i],
        ['a phone too short', { cateringPhone: '12345' }, /phone/i],
        ['a bad email', { supportEmail: 'nope' }, /email/i],
        ['raw HTML', { address: '<script>alert(1)</script>' }, /HTML/],
        ['HTML in the name', { companyName: '<b>Pizza</b>' }, /HTML/],
        ['too long', { faqContactText: 'x'.repeat(501) }, /too long/],
        ['a bad GSTIN', { gstin: '12345' }, /GSTIN/],
        ['a bad website', { website: 'javascript:alert(1)' }, /Website/],
        ['a bad colour', { primaryColor: 'red;}' }, /colour/i],
        ['not text', { supportPhone: { $ne: '' } }, /text/i],
    ]) {
        test(`refused: ${name}`, async () => {
            const res = await patch(body);
            assert.equal(res.status, 400, JSON.stringify(res.body));
            assert.match(res.body.error || res.body.message, message);
        });
    }
    test('fields outside the list are ignored', async () => {
        const res = await patch({ companyName: 'Safe Name', _id: '64b000000000000000000001', logo: { url: 'https://evil.example/x.png' }, updatedAt: '2000-01-01' });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        assert.equal(res.body.data.logo?.url || '', '');
        assert.notEqual(new Date(res.body.data.updatedAt).getFullYear(), 2000);
    });
});

describe('saving and reading back', () => {
    before(async () => {
        const res = await patch(FULL);
        assert.equal(res.status, 200, JSON.stringify(res.body));
    });

    test('strings are trimmed, the GSTIN normalised, and the public read updates at once', async () => {
        const info = await pub();
        assert.equal(info.companyName, 'Papa Veg Foods Pvt Ltd');
        assert.equal(info.gstin, '27AAAPL1234C1ZV');
        assert.equal(info.cateringPhone, FULL.cateringPhone);
    });
    test('one record however many saves', async () => {
        await patch({ supportHours: '10 to 10' });
        assert.equal(await fx.models.FoodStore.db.collection('foodbusinesssettings').countDocuments(), 1);
    });
    test('public: display fields only, and a short cache', async () => {
        const res = await fx.call('GET', PUBLIC);
        assert.match(res.headers['cache-control'], /max-age=60/);
        assert.deepEqual(Object.keys(res.body.data).sort(), [
            'address', 'cateringEmail', 'cateringPhone', 'companyName', 'faqContactText', 'favicon', 'gstin', 'logo', 'pincode', 'primaryColor', 'region',
            'secondaryColor', 'state', 'supportEmail', 'supportHours', 'supportPhone', 'themeMode', 'website', 'whatsappNumber',
        ]);
        const text = JSON.stringify(res.body.data);
        for (const key of ['_id', 'createdAt', 'updatedAt', '__v', 'publicId']) assert.ok(!text.includes(key), key);
    });
    test('the support page and bulk orders show the same details', async () => {
        const support = (await fx.call('GET', '/v1/food/pages/support')).body.data;
        assert.deepEqual([support.phone, support.email, support.description], [FULL.supportPhone, FULL.supportEmail, FULL.faqContactText]);
        const bulk = (await fx.call('GET', '/v1/bulk-order/config')).body.data;
        assert.deepEqual([bulk.virtualParty.corporatePhone, bulk.egiftVoucher.corporateEmail, bulk.contactPage.feedbackEmail, bulk.contactPage.customerCareNumber, bulk.contactPage.addressLine1],
            [FULL.cateringPhone, FULL.cateringEmail, FULL.supportEmail, FULL.supportPhone, FULL.address]);
    });
    test('clearing a contact hides it again', async () => {
        assert.equal((await patch({ whatsappNumber: '' })).status, 200);
        assert.equal((await pub()).whatsappNumber, '');
        await patch({ whatsappNumber: FULL.whatsappNumber });
    });
});

describe('the older screens edit this record', () => {
    test('the support page\'s inputs write through, and invalid values are refused', async () => {
        const save = (body) => fx.call('PUT', '/v1/food/admin/pages-social-media/support', fx.SA, body);
        const ok = await save({ title: 'Help', description: 'x', phone: '+91 98123 40000', email: 'care@example.invalid', hours: '9 to 9' });
        assert.equal(ok.status, 200, JSON.stringify(ok.body));
        assert.equal((await pub()).supportPhone, '+91 98123 40000');
        assert.equal((await save({ phone: 'nope' })).status, 400);
    });
    test('the bulk-order screen writes through; an unchanged value changes nothing', async () => {
        const before = await pub();
        const put = (body) => fx.call('PUT', '/v1/food/admin/bulk-orders/config', fx.SA, body);
        const res = await put({ virtualParty: { corporatePhone: '+91 98123 40001', corporateEmail: before.cateringEmail }, egiftVoucher: { corporatePhone: before.cateringPhone, corporateEmail: before.cateringEmail } });
        assert.equal(res.status, 200, JSON.stringify(res.body));
        const after = await pub();
        assert.equal(after.cateringPhone, '+91 98123 40001');
        assert.equal(after.cateringEmail, before.cateringEmail);
        assert.equal((await put({ virtualParty: { corporatePhone: 'nope' } })).status, 400);
    });
});

describe('no developer details left in the code', () => {
    // The number and the mailbox are not repeated here: only their hashes
    const PHONES = new Set(['4fa0f26b7bb8bd27', 'fae566f04b29bbcb']);
    const MAILBOXES = new Set(['a038d9ef5c8a5e17', '0c5b5cd95d1cec07', '9eb0786d9879dde5']);
    const hash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 16);
    const walk = (dir) => readdirSync(dir).flatMap((name) => {
        const path = `${dir}/${name}`;
        if (['node_modules', 'dist', 'assets'].includes(name)) return [];
        return statSync(path).isDirectory() ? walk(path) : /\.(js|jsx|json|ts|tsx|html)$/.test(name) ? [path] : [];
    });
    test('the backend and frontend sources hold neither', async () => {
        const roots = [new URL('../src', import.meta.url).pathname, new URL('../../Frontend/src', import.meta.url).pathname];
        const found = [];
        for (const file of roots.flatMap(walk)) {
            const text = readFileSync(file, 'utf8');
            for (const number of text.match(/\b\d{10}\b/g) || []) if (PHONES.has(hash(number))) found.push(file);
            for (const mailbox of text.match(/[\w.+-]+@gmail\.com/g) || []) if (MAILBOXES.has(hash(mailbox))) found.push(file);
        }
        assert.deepEqual(found, []);
    });
});
