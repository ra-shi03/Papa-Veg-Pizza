// Push device tokens and who a push reaches:
// - customers and every staff panel account are Users; /fcm-tokens/save stores their token (strict mode used to drop it)
//   and the token never shows in ordinary reads;
// - a STORE push reaches that store's active managers (not one who switched push notifications off);
// - an ADMIN push without a FoodAdmin record ('GLOBAL', notifyAdminsSafely) reaches the super admins.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from './helpers/fixture.js';

let fx; let A; let fb;
const ok = (res, status = 200) => { assert.equal(res.status, status, JSON.stringify(res.body)); return res.body.data; };

before(async () => {
    fx = await createFixture(); A = fx.F.A;
    fb = await import('../src/core/notifications/firebase.service.js');
});
after(async () => { await fx?.teardown(); });

describe('saving a device token', () => {
    test('a customer token is stored, hidden from ordinary reads, and removable', async () => {
        ok(await fx.call('POST', '/v1/fcm-tokens/save', A.customerToken, { token: 'customer-web-token-0001', platform: 'web' }));
        assert.deepEqual(await fb.listOwnerTokens({ ownerType: 'CUSTOMER', ownerId: A.customerId }), ['customer-web-token-0001']);
        const plain = await fx.models.User.findById(A.customerId).lean();
        assert.equal(plain.fcmTokens, undefined);
        ok(await fx.call('DELETE', '/v1/fcm-tokens/remove', A.customerToken, { token: 'customer-web-token-0001' }));
        assert.deepEqual(await fb.listOwnerTokens({ ownerType: 'CUSTOMER', ownerId: A.customerId }), []);
    });
    test('store manager and super admin panel tokens are stored on their User', async () => {
        ok(await fx.call('POST', '/v1/fcm-tokens/save', A.managerToken, { token: 'manager-web-token-0001' }));
        ok(await fx.call('POST', '/v1/fcm-tokens/save', fx.SA, { token: 'super-web-token-0001' }));
        assert.deepEqual(await fb.listOwnerTokens({ ownerType: 'STORE_MANAGER', ownerId: A.managerUserId }), ['manager-web-token-0001']);
        assert.deepEqual(await fb.listOwnerTokens({ ownerType: 'SUPER_ADMIN', ownerId: String(fx.superUser._id) }), ['super-web-token-0001']);
    });
});

describe('who a push reaches', () => {
    test('a store push reaches its manager; a manager who turned push off is left out', async () => {
        assert.ok((await fb.storeManagerUserIds(A.storeId)).includes(String(A.managerUserId)));
        assert.ok(!(await fb.storeManagerUserIds(fx.F.B.storeId)).includes(String(A.managerUserId)));
        await fx.models.StoreManager.updateOne({ userId: A.managerUserId }, { $set: { 'notificationPrefs.pushNotifications': false } });
        try {
            assert.ok(!(await fb.storeManagerUserIds(A.storeId)).includes(String(A.managerUserId)));
        } finally {
            await fx.models.StoreManager.updateOne({ userId: A.managerUserId }, { $set: { 'notificationPrefs.pushNotifications': true } });
        }
    });
    test('an admin push reaches the super admins', async () => {
        assert.deepEqual(await fb.superAdminUserIds(), [String(fx.superUser._id)]);
    });
});
