import crypto from 'crypto';
import { FoodPaymentGateway, FoodPaymentGatewayEvent, SUPPORTED_PROVIDERS, CHARGEABLE_PROVIDERS } from '../models/paymentGateway.model.js';
import { FoodTransaction } from '../../orders/models/foodTransaction.model.js';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { config } from '../../../../config/env.js';
import { setRazorpayCredentials, getRazorpayInstance, fetchRazorpayPayment } from '../../orders/helpers/razorpay.helper.js';

// ---- secrets at rest: AES-256-GCM. The key comes from PAYMENT_SECRETS_KEY, else the JWT secret.
const encryptionKey = () => {
    const base = process.env.PAYMENT_SECRETS_KEY || config.jwtAccessSecret || '';
    if (!base) throw new Error('PAYMENT_SECRETS_KEY or JWT secret is required to store gateway secrets');
    return crypto.createHash('sha256').update(`payment-gateway:${base}`).digest();
};

const encrypt = (plain) => {
    if (!plain) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
};

const decrypt = (packed) => {
    if (!packed) return '';
    try {
        const [iv, tag, data] = packed.split('.').map((p) => Buffer.from(p, 'base64'));
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
        return '';
    }
};

const mask = (value, keep = 4) => {
    const v = String(value || '');
    if (!v) return '';
    return v.length <= keep ? '••••' : `••••••••${v.slice(-keep)}`;
};

// What the admin screen gets: everything except the secrets themselves.
const toAdminView = (g) => ({
    _id: String(g._id),
    gatewayName: g.provider,
    displayName: g.displayName || g.provider,
    merchantId: g.merchantId || '',
    keyId: g.keyId,
    // Write-only: the screen only ever gets a masked tail.
    secretKey: mask(decrypt(g.secretKeyEnc)),
    secretKeyMasked: mask(decrypt(g.secretKeyEnc)),
    webhookSecret: g.webhookSecretEnc ? '••••••••' : '',
    hasWebhookSecret: Boolean(g.webhookSecretEnc),
    integrated: CHARGEABLE_PROVIDERS.includes(g.provider),
    createdBy: g.createdBy || '',
    environment: g.environment,
    status: g.status,
    defaultGateway: Boolean(g.defaultGateway),
    updatedBy: g.updatedBy || '',
    updatedAt: g.updatedAt,
    createdAt: g.createdAt
});

// What the customer app gets: names and mode only.
const toPublicView = (g) => ({
    id: String(g._id),
    provider: g.provider,
    displayName: g.displayName || g.provider,
    environment: g.environment,
    isDefault: Boolean(g.defaultGateway)
});

const modeFromKey = (keyId) => (String(keyId || '').startsWith('rzp_live_') ? 'Production' : 'Sandbox');

/**
 * Points the Razorpay helper at the active gateway. Once any gateway is saved here the database decides (no active
 * Razorpay gateway means online payments are off); before that the server's .env keys keep working as they always did.
 */
export async function refreshGatewayCredentials() {
    if ((await FoodPaymentGateway.countDocuments({ provider: 'Razorpay' })) === 0) {
        setRazorpayCredentials(null);
        return;
    }
    const gw = await FoodPaymentGateway.findOne({ provider: 'Razorpay', status: 'Active' }).lean();
    if (!gw) {
        setRazorpayCredentials({ keyId: '', keySecret: '', webhookSecret: '' });
        return;
    }
    setRazorpayCredentials({
        keyId: gw.keyId,
        keySecret: decrypt(gw.secretKeyEnc),
        webhookSecret: decrypt(gw.webhookSecretEnc)
    });
}

async function logEvent(action, desc, user, type = 'info', provider = '', extra = {}) {
    try {
        await FoodPaymentGatewayEvent.create({ action, desc, user, type, provider, ...extra });
    } catch {
        // The history is a convenience; never block a real change because it could not be written.
    }
}

// First visit: bring the keys already in .env into the database so this screen shows what the server really uses.
async function adoptEnvGateway() {
    if ((await FoodPaymentGateway.countDocuments({ provider: 'Razorpay' })) > 0) return;
    const keyId = config.razorpayKeyId || '';
    const secret = config.razorpayKeySecret || '';
    if (!keyId || !secret) return;
    await FoodPaymentGateway.create({
        provider: 'Razorpay',
        displayName: 'Razorpay',
        keyId,
        secretKeyEnc: encrypt(secret),
        webhookSecretEnc: encrypt(config.razorpayWebhookSecret || ''),
        environment: modeFromKey(keyId),
        status: 'Active',
        defaultGateway: true,
        createdBy: 'system (from server .env)',
        updatedBy: 'system (from server .env)'
    });
    await logEvent('Gateway Imported', 'Razorpay keys found on the server were added to this screen', 'System', 'info', 'Razorpay');
}

export async function listGateways() {
    await adoptEnvGateway();
    const list = await FoodPaymentGateway.find().sort({ createdAt: 1 }).lean();
    return list.map(toAdminView);
}

export async function listPublicGateways() {
    const list = await FoodPaymentGateway.find({ status: 'Active', provider: { $in: CHARGEABLE_PROVIDERS } }).sort({ defaultGateway: -1, createdAt: 1 }).lean();
    // Before any gateway is saved, the keys in .env still drive Razorpay, so it is offered as the one method.
    if (list.length === 0 && (await FoodPaymentGateway.countDocuments({ provider: 'Razorpay' })) === 0 && config.razorpayKeyId && config.razorpayKeySecret) {
        return [{ id: 'razorpay-env', provider: 'Razorpay', displayName: 'Razorpay', environment: modeFromKey(config.razorpayKeyId), isDefault: true }];
    }
    return list.map(toPublicView);
}

function cleanInput(body, { creating }) {
    const out = {};
    const text = (v) => String(v ?? '').trim();
    if (creating || body.provider !== undefined || body.gatewayName !== undefined) {
        const provider = text(body.provider || body.gatewayName);
        if (!SUPPORTED_PROVIDERS.includes(provider)) throw new ValidationError(`Only these providers are supported: ${SUPPORTED_PROVIDERS.join(', ')}`);
        out.provider = provider;
    }
    if (body.displayName !== undefined) out.displayName = text(body.displayName).slice(0, 40);
    if (body.merchantId !== undefined) out.merchantId = text(body.merchantId).slice(0, 80);
    if (body.keyId !== undefined) {
        out.keyId = text(body.keyId);
        if (!out.keyId) throw new ValidationError('Key ID is required');
    } else if (creating) throw new ValidationError('Key ID is required');
    if (body.environment !== undefined) {
        if (!['Sandbox', 'Production'].includes(body.environment)) throw new ValidationError('Environment must be Sandbox or Production');
        out.environment = body.environment;
    }
    if (body.status !== undefined) {
        if (!['Active', 'Inactive'].includes(body.status)) throw new ValidationError('Status must be Active or Inactive');
        out.status = body.status;
    }
    if (body.defaultGateway !== undefined) out.defaultGateway = Boolean(body.defaultGateway);
    // A secret is only changed when one is sent; leaving the field empty keeps the stored one.
    const secret = text(body.secretKey);
    if (secret) out.secretKeyEnc = encrypt(secret);
    else if (creating) throw new ValidationError('Secret Key is required');
    const hook = text(body.webhookSecret);
    if (hook) out.webhookSecretEnc = encrypt(hook);
    return out;
}

// Exactly one default among active gateways.
async function settleDefault(preferredId) {
    const active = await FoodPaymentGateway.find({ status: 'Active' }).sort({ defaultGateway: -1, createdAt: 1 });
    const chosen = active.find((g) => String(g._id) === String(preferredId)) || active.find((g) => g.defaultGateway) || active[0];
    await FoodPaymentGateway.updateMany({}, { $set: { defaultGateway: false } });
    if (chosen) await FoodPaymentGateway.updateOne({ _id: chosen._id }, { $set: { defaultGateway: true } });
}

export async function createGateway(body, actor) {
    const data = cleanInput(body, { creating: true });
    if (await FoodPaymentGateway.exists({ provider: data.provider })) throw new ValidationError(`${data.provider} is already configured. Edit it instead.`);
    const doc = await FoodPaymentGateway.create({ ...data, createdBy: actor, updatedBy: actor });
    await settleDefault(data.defaultGateway ? doc._id : null);
    await refreshGatewayCredentials();
    await logEvent('Gateway Created', `${data.provider} (${doc.environment}) registered`, actor, 'success', data.provider);
    return toAdminView(await FoodPaymentGateway.findById(doc._id).lean());
}

export async function updateGateway(id, body, actor) {
    const data = cleanInput(body, { creating: false });
    delete data.provider; // a gateway never changes provider
    const doc = await FoodPaymentGateway.findByIdAndUpdate(id, { $set: { ...data, updatedBy: actor } }, { new: true });
    if (!doc) throw new NotFoundError('Gateway not found');
    await settleDefault(data.defaultGateway ? doc._id : null);
    await refreshGatewayCredentials();
    await logEvent('Gateway Modified', `${doc.provider} properties updated${data.secretKeyEnc ? ' (secret key replaced)' : ''}`, actor, 'info', doc.provider);
    return toAdminView(await FoodPaymentGateway.findById(id).lean());
}

export async function setGatewayStatus(id, status, actor) {
    const view = await updateGateway(id, { status }, actor);
    await logEvent(status === 'Active' ? 'Gateway Enabled' : 'Gateway Disabled', `${view.gatewayName} status set to ${status}`, actor, status === 'Active' ? 'success' : 'warning', view.gatewayName);
    return view;
}

export async function makeDefault(id, actor) {
    const doc = await FoodPaymentGateway.findById(id);
    if (!doc) throw new NotFoundError('Gateway not found');
    if (doc.status !== 'Active') throw new ValidationError('Only an active gateway can be the default');
    await settleDefault(id);
    await FoodPaymentGateway.updateOne({ _id: id }, { $set: { updatedBy: actor } });
    await refreshGatewayCredentials();
    await logEvent('Default Changed', `${doc.provider} designated as default gateway`, actor, 'info', doc.provider);
    return toAdminView(await FoodPaymentGateway.findById(id).lean());
}

export async function deleteGateway(id, actor) {
    const doc = await FoodPaymentGateway.findByIdAndDelete(id);
    if (!doc) throw new NotFoundError('Gateway not found');
    await settleDefault(null);
    await refreshGatewayCredentials();
    await logEvent('Gateway Removed', `${doc.provider} removed and its saved keys deleted`, actor, 'warning', doc.provider);
    return { deleted: true };
}

// Asks the provider to confirm the saved keys work (reads one order; charges nothing).
export async function testGateway(id, actor = '') {
    const doc = await FoodPaymentGateway.findById(id).lean();
    if (!doc) throw new NotFoundError('Gateway not found');
    const startedAt = Date.now();
    let result;
    if (!CHARGEABLE_PROVIDERS.includes(doc.provider)) {
        result = { ok: false, message: `${doc.provider} is saved here but is not connected to the server yet, so it cannot be tested or used for payments.`, latencyMs: 0, notIntegrated: true };
    } else {
        try {
            const instance = getRazorpayInstance({ keyId: doc.keyId, keySecret: decrypt(doc.secretKeyEnc) });
            if (!instance) throw new Error('Razorpay SDK is not available on this server');
            await instance.orders.all({ count: 1 });
            result = { ok: true, message: 'Connection verified: the provider accepted these keys.', latencyMs: Date.now() - startedAt };
        } catch (err) {
            result = { ok: false, message: err?.error?.description || err?.message || 'Connection failed', latencyMs: Date.now() - startedAt };
        }
    }
    result.environment = doc.environment;
    result.gateway = doc.provider;
    result.testedAt = new Date().toISOString();
    if (!result.notIntegrated) {
        await logEvent('Connection Test', `${doc.provider} (${doc.environment}): ${result.ok ? 'passed' : `failed - ${result.message}`}`, actor || 'Admin', result.ok ? 'success' : 'error', doc.provider, { ok: result.ok, latencyMs: result.latencyMs });
    }
    return result;
}

export async function listEvents(limit = 30) {
    const events = await FoodPaymentGatewayEvent.find().sort({ at: -1 }).limit(Math.min(100, Math.max(1, Number(limit) || 30))).lean();
    return events.map((e) => ({ id: String(e._id), action: e.action, desc: e.desc, user: e.user || 'System', type: e.type, provider: e.provider, at: e.at }));
}

// ---- analytics and logs, built from the real payment records (online payments only)
const ONLINE = ['razorpay', 'razorpay_qr'];
const providerOf = (tx) => (ONLINE.includes(tx.paymentMethod) ? 'Razorpay' : null);

export async function listLogs({ gateway = 'All', status = 'All', environment = 'All', limit = 200 } = {}) {
    const txs = await FoodTransaction.find({ paymentMethod: { $in: ONLINE } }).sort({ createdAt: -1 }).limit(Math.min(500, Number(limit) || 200)).lean();
    const env = (await FoodPaymentGateway.findOne({ provider: 'Razorpay' }).lean())?.environment || 'Production';
    const logs = txs.map((tx) => {
        const st = tx.status === 'captured' || tx.status === 'refunded' ? 'Success' : tx.status === 'failed' ? 'Failed' : 'Pending';
        const amount = Number(tx.amounts?.totalCustomerPaid ?? tx.pricing?.total) || 0;
        const rz = tx.payment?.razorpay || {};
        const failNote = [...(tx.history || [])].reverse().find((h) => /fail/i.test(`${h.kind} ${h.note || ''}`));
        return {
            _id: String(tx._id),
            transactionId: rz.paymentId || rz.orderId || String(tx._id),
            orderId: String(tx.orderId),
            gatewayName: providerOf(tx) || 'Razorpay',
            environment: env,
            amount,
            currency: tx.currency || 'INR',
            status: st,
            statusCode: st === 'Success' ? '200 OK' : st === 'Failed' ? 'Payment failed' : 'Awaiting payment',
            apiEndpoint: rz.paymentId ? '/v1/payments' : '/v1/orders',
            timestamp: tx.createdAt,
            errorDetails: st === 'Failed' ? (failNote?.note || 'The provider reported the payment as failed.') : null,
            // What we stored for this payment (the provider's raw request and response are not kept)
            requestPayload: { amount: Math.round(amount * 100), currency: tx.currency || 'INR', receipt: String(tx.orderId), razorpay_order_id: rz.orderId || null },
            responsePayload: { status: tx.status, razorpay_order_id: rz.orderId || null, razorpay_payment_id: rz.paymentId || null, method: tx.paymentMethod, history: (tx.history || []).map((h) => ({ kind: h.kind, at: h.at, note: h.note })) },
            refId: String(tx._id),
            paymentId: rz.paymentId || ''
        };
    });
    return logs.filter((l) => (gateway === 'All' || l.gatewayName === gateway) && (status === 'All' || l.status === status) && (environment === 'All' || l.environment === environment));
}

// Asks the provider what it currently says about a payment (read only; nothing is changed here).
export async function resyncLog(id) {
    const tx = await FoodTransaction.findById(id).select('payment.razorpay status').lean();
    if (!tx) throw new NotFoundError('Transaction not found');
    const paymentId = tx.payment?.razorpay?.paymentId;
    if (!paymentId) return { ok: false, message: 'No payment was made on this order yet, so there is nothing to check with the provider.' };
    try {
        const p = await fetchRazorpayPayment(paymentId);
        return { ok: true, providerStatus: p.status, message: `Razorpay reports this payment as "${p.status}". Our record says "${tx.status}".` };
    } catch (err) {
        return { ok: false, message: err?.error?.description || err?.message || 'Could not reach the provider' };
    }
}
