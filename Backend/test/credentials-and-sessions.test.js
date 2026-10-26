// P0 items 5 and 6: password hashing and strength, forgot-password on the User model, staff accounts
// that can log in, access-token lifetime, refresh-token rotation that re-reads role/scope from the
// database, and the public order-history phone requirement.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createFixture, jwt, PASSWORD } from './helpers/fixture.js';

let fx; let A;
before(async () => { fx = await createFixture(); A = fx.F.A; });
after(async () => { await fx?.teardown(); });

const isHash = (v) => /^\$2[aby]\$/.test(String(v));
const rawUser = (id) => fx.models.User.collection.findOne({ _id: new fx.models.User.base.Types.ObjectId(String(id)) });
const login = (path, email, password) => fx.call('POST', path, null, { email, password });
const refresh = (refreshToken) => fx.call('POST', '/v1/auth/refresh-token', null, { refreshToken });
const decode = (t) => jwt.decode(t);

describe('User model', () => {
    test('email is persisted (lower-cased)', async () => {
        const u = await fx.models.User.create({ email: 'MixedCase@Example.INVALID', mobile: '9200000001', password: PASSWORD, loginType: 'PASSWORD' });
        assert.equal((await rawUser(u._id)).email, 'mixedcase@example.invalid');
    });
    test('a plaintext password is hashed on save', async () => {
        const u = await fx.models.User.create({ email: 'hash1@example.invalid', mobile: '9200000002', password: PASSWORD, loginType: 'PASSWORD' });
        const raw = await rawUser(u._id);
        assert.ok(isHash(raw.password));
        assert.ok(await bcrypt.compare(PASSWORD, raw.password));
    });
    test('an already-hashed password is not hashed again, and unrelated saves keep the hash', async () => {
        const u = await fx.models.User.create({ email: 'hash2@example.invalid', mobile: '9200000003', password: PASSWORD, loginType: 'PASSWORD' });
        const preHashed = await bcrypt.hash('another-password-1', 10);
        const doc = await fx.models.User.findById(u._id);
        doc.password = preHashed; await doc.save();
        assert.equal((await rawUser(u._id)).password, preHashed);
        const again = await fx.models.User.findById(u._id); again.lockUntil = null; await again.save();
        assert.equal((await rawUser(u._id)).password, preHashed);
    });
});

describe('franchise create / update passwords', () => {
    const body = (extra = {}) => ({ name: 'Pw Owner', email: `pw${Date.now()}@example.invalid`, phone: `43${String(Date.now()).slice(-8)}`, franchiseName: 'TEST Pw', franchiseCode: `PW${Date.now()}`, city: 'X', state: 'Y', pincode: '110001', address: 'a', ...extra });
    test('a 7-character password is rejected (400) and nothing is created', async () => {
        const b = body({ password: 'short7!' });
        assert.equal((await fx.call('POST', '/v1/food/admin/franchises', fx.SA, b)).status, 400);
        assert.ok(!(await fx.models.FoodFranchise.exists({ franchiseCode: b.franchiseCode })));
    });
    test('a good password is stored as a bcrypt hash and the admin can log in with it', async () => {
        const b = body({ password: PASSWORD });
        const res = await fx.call('POST', '/v1/food/admin/franchises', fx.SA, b);
        assert.equal(res.status, 201);
        const raw = await rawUser(res.body.data.admin._id);
        assert.ok(isHash(raw.password) && !raw.password.includes(PASSWORD));
        assert.equal((await login('/v1/auth/franchise/login', b.email, PASSWORD)).status, 200);
    });
    test('updateFranchise rejects a 7-char password and hashes a good one', async () => {
        assert.equal((await fx.call('PATCH', `/v1/food/admin/franchises/${A.franchiseId}`, fx.SA, { password: 'abc1234' })).status, 400);
        const next = 'Changed#Pass-22';
        assert.equal((await fx.call('PATCH', `/v1/food/admin/franchises/${A.franchiseId}`, fx.SA, { password: next })).status, 200);
        assert.ok(isHash((await rawUser(A.adminUserId)).password));
        assert.equal((await login('/v1/auth/franchise/login', A.email, PASSWORD)).status, 401);
        assert.equal((await login('/v1/auth/franchise/login', A.email, next)).status, 200);
        await fx.call('PATCH', `/v1/food/admin/franchises/${A.franchiseId}`, fx.SA, { password: PASSWORD });
    });
});

describe('change password', () => {
    test('a new password under 8 characters is rejected (400)', async () => {
        const res = await fx.call('PATCH', '/v1/auth/admin/change-password', A.adminToken, { currentPassword: PASSWORD, newPassword: 'abc1234', confirmPassword: 'abc1234' });
        assert.equal(res.status, 400);
    });
});

describe('forgot password (on the User model)', () => {
    const reqOtp = (email) => fx.call('POST', '/v1/auth/admin/forgot-password/request-otp', null, { email });
    const reset = (email, otp, newPassword) => fx.call('POST', '/v1/auth/admin/forgot-password/reset', null, { email, otp, newPassword });

    test('unknown email and non-admin accounts are refused', async () => {
        assert.equal((await reqOtp('nobody@example.invalid')).status, 401);
        const cust = await fx.models.User.create({ email: 'cust-fp@example.invalid', mobile: '9200000010', loginType: 'OTP', primaryRole: fx.roles.CUSTOMER._id });
        assert.equal((await reqOtp(cust.email)).status, 401);
    });
    test('full flow: request OTP, weak/wrong OTP refused, reset works once, sessions revoked', async () => {
        assert.equal((await reqOtp(A.email)).status, 200);
        const record = await fx.models.AdminResetOtp.findOne({ email: A.email }).lean();
        assert.ok(record, 'an OTP record exists for the admin');
        const sessionToken = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;

        assert.equal((await reset(A.email, record.otp, 'abc1234')).status, 400, 'password under 8 characters');
        assert.equal((await reset(A.email, '000000', 'Brand#NewPass9')).status, 401, 'wrong OTP');
        const ok = await reset(A.email, record.otp, 'Brand#NewPass9');
        assert.equal(ok.status, 200);

        assert.ok(isHash((await rawUser(A.adminUserId)).password));
        assert.equal((await login('/v1/auth/franchise/login', A.email, 'Brand#NewPass9')).status, 200);
        assert.equal((await login('/v1/auth/franchise/login', A.email, PASSWORD)).status, 401);
        assert.equal((await refresh(sessionToken)).status, 401, 'refresh tokens from before the reset are revoked');
        assert.equal((await reset(A.email, record.otp, 'Another#Pass99')).status, 401, 'the OTP is single use');
        await fx.models.User.findById(A.adminUserId).then(async (u) => { u.password = PASSWORD; await u.save(); });
    });
});

describe('staff accounts can log in (no default password)', () => {
    let managerToken;
    test('a store manager created by a franchise admin gets a temporary password that works', async () => {
        const email = `staff-sm${Date.now()}@example.invalid`;
        const res = await fx.call('POST', '/v1/food/admin/staff', A.adminToken, { role: 'store-manager', email, name: 'Staff SM', phone: `44${String(Date.now()).slice(-8)}`, storeId: A.storeId });
        assert.equal(res.status, 201);
        const temp = res.body.data.temporaryPassword;
        assert.ok(temp && temp.length >= 12, 'a random temporary password is returned once');
        assert.ok(isHash((await rawUser(res.body.data.id)).password));
        const lg = await login('/v1/auth/store/login', email, temp);
        assert.equal(lg.status, 200);
        assert.equal(decode(lg.body.data.accessToken).storeId, A.storeId);
        assert.equal(decode(lg.body.data.accessToken).franchiseId, A.franchiseId);
        assert.equal((await login('/v1/auth/store/login', email, '12345678')).status, 401, 'the old default password does not work');
        managerToken = lg.body.data.accessToken;
    });
    test('the staff endpoint rejects a 7-char password and cross-franchise stores', async () => {
        assert.equal((await fx.call('POST', '/v1/food/admin/staff', A.adminToken, { role: 'store-manager', email: 'x1@example.invalid', phone: '4500000001', storeId: A.storeId, password: 'short7!' })).status, 400);
        assert.equal((await fx.call('POST', '/v1/food/admin/staff', A.adminToken, { role: 'store-manager', email: 'x2@example.invalid', phone: '4500000002', storeId: fx.F.B.storeId })).status, 400);
    });
    test('role creation rules: super admin cannot create a store manager; store manager cannot create a franchise admin', async () => {
        assert.equal((await fx.call('POST', '/v1/food/admin/staff', fx.SA, { role: 'store-manager', email: 'x3@example.invalid', phone: '4500000003', franchiseId: A.franchiseId })).status, 403);
        assert.equal((await fx.call('POST', '/v1/food/admin/staff', managerToken, { role: 'franchise-admin', email: 'x4@example.invalid', phone: '4500000004', franchiseId: A.franchiseId })).status, 403);
    });
    test('kitchen staff creation rejects a 7-char password and stores a hash otherwise', async () => {
        const mk = (password, phone, email) => fx.call('POST', '/v1/food/store/staff', A.managerToken, { fullName: 'Kitchen', email, phone, password, role: 'Kitchen Staff' });
        assert.equal((await mk('short7!', '4600000001', 'k0@example.invalid')).status, 400);
        const ok = await mk(PASSWORD, '4600000002', 'k1@example.invalid');
        assert.equal(ok.status, 201);
        assert.ok(isHash((await rawUser(ok.body.data.userId)).password));
        const lg = await login('/v1/auth/store/login', 'k1@example.invalid', PASSWORD);
        assert.equal(lg.status, 200);
        assert.equal(decode(lg.body.data.accessToken).storeId, A.storeId);
    });
});

describe('access + refresh tokens', () => {
    test('the access token lasts 15 minutes', async () => {
        const t = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.accessToken;
        assert.equal(decode(t).exp - decode(t).iat, 900);
    });
    test('refresh rotates the refresh token; the new one works', async () => {
        const first = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;
        const r1 = await refresh(first);
        assert.equal(r1.status, 200);
        assert.ok(r1.body.data.refreshToken && r1.body.data.refreshToken !== first);
        assert.equal((await refresh(r1.body.data.refreshToken)).status, 200);
    });
    test('the previous token survives a short overlap (parallel tabs), then dies', async () => {
        const first = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;
        assert.equal((await refresh(first)).status, 200);
        assert.equal((await refresh(first)).status, 200, 'still inside the overlap window');
        await fx.models.RefreshToken.updateOne({ tokenHash: fx.models.RefreshToken.hashToken(first) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
        assert.equal((await refresh(first)).status, 401, 'rejected once the overlap has passed');
    });
    test('scope is re-read from the database on refresh', async () => {
        const rt = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;
        const other = new fx.models.User.base.Types.ObjectId();
        await fx.models.UserRole.updateOne({ userId: A.adminUserId, roleId: fx.roles.FRANCHISE_ADMIN._id }, { $set: { franchiseId: other } });
        try {
            const r = await refresh(rt);
            assert.equal(r.status, 200);
            assert.equal(decode(r.body.data.accessToken).franchiseId, String(other));
        } finally {
            await fx.models.UserRole.updateOne({ userId: A.adminUserId, roleId: fx.roles.FRANCHISE_ADMIN._id }, { $set: { franchiseId: A.franchiseId } });
        }
    });
    test('role is re-read from the database: an admin who lost the admin role cannot refresh', async () => {
        const rt = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;
        await fx.models.User.updateOne({ _id: A.adminUserId }, { $set: { primaryRole: fx.roles.CUSTOMER._id } });
        try {
            assert.equal((await refresh(rt)).status, 401);
        } finally {
            await fx.models.User.updateOne({ _id: A.adminUserId }, { $set: { primaryRole: fx.roles.FRANCHISE_ADMIN._id } });
        }
    });
    test('a deactivated account cannot refresh', async () => {
        const rt = (await login('/v1/auth/franchise/login', A.email, PASSWORD)).body.data.refreshToken;
        await fx.models.User.updateOne({ _id: A.adminUserId }, { $set: { isActive: false } });
        try {
            assert.equal((await refresh(rt)).status, 401);
        } finally {
            await fx.models.User.updateOne({ _id: A.adminUserId }, { $set: { isActive: true } });
        }
    });
    test('an unknown or garbage refresh token is refused', async () => {
        assert.equal((await refresh('garbage')).status, 401);
    });
});

describe('public order history requires the phone number', () => {
    const history = (b) => fx.call('POST', '/v1/food/orders/history', null, b);
    test('no phone -> 400 (POST and GET)', async () => {
        assert.equal((await history({ orderId: A.orderId })).status, 400);
        assert.equal((await fx.call('GET', `/v1/food/orders/history?orderId=${A.orderId}`)).status, 400);
    });
    test('wrong phone -> 404, right phone -> 200', async () => {
        assert.equal((await history({ orderId: A.orderId, phone: '9000000000' })).status, 404);
        assert.equal((await history({ orderId: A.orderId, phone: A.phone })).status, 200);
    });
    test('another franchise\'s phone cannot read this order', async () => {
        assert.equal((await history({ orderId: A.orderId, phone: fx.F.B.phone })).status, 404);
    });
});
