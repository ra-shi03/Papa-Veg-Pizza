import { config } from '../../../../config/env.js';

// Pet Pooja "online ordering" adapter: the only file that knows Pet Pooja's field names and status codes.
//
// IMPORTANT: Pet Pooja gives its API documentation, base URL and keys to each integration partner on request
// (support@petpooja.com). Until they arrive this follows the publicly described shape of the API:
//   - save order:   POST <PETPOOJA_API_BASE_URL>/save_order, keys (app_key, app_secret, access_token) in the body,
//                   the order in `orderinfo` (restaurant restID, customer, order, items, taxes, discounts)
//   - status push:  Pet Pooja calls our callback URL with restID, orderID, clientorderID and a numeric status
// When the real documents arrive, check the field names, the endpoint paths and STATUS_CODES below; nothing else in the
// app needs to change. With PETPOOJA_API_BASE_URL unset nothing is sent: every send is recorded as skipped (never as a
// fake success).

export const PROVIDER = 'petpooja';

// Pet Pooja order status codes -> what they mean for us (confirm against the Pet Pooja documents).
export const STATUS_CODES = {
    '-1': 'cancelled',
    1: 'accepted',
    2: 'accepted',
    3: 'accepted',
    4: 'dispatched',
    5: 'food_ready',
    10: 'delivered',
};

const apiBase = () => String(process.env.PETPOOJA_API_BASE_URL || config.petpoojaApiBaseUrl || '').trim().replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.PETPOOJA_TIMEOUT_MS) || 15000;

/** Is the server set up to talk to Pet Pooja at all (its API address is known)? HTTPS only, except outside production
 *  (a local test double). */
export const apiReady = () => /^https:\/\//i.test(apiBase()) || (config.nodeEnv !== 'production' && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(apiBase()));

/** What a store still needs before orders can be sent: [] when ready. */
export function missingSetup(keys) {
    const missing = [];
    if (!keys.restaurantId) missing.push('restaurant ID');
    if (!keys.appKey) missing.push('app key');
    if (!keys.appSecret) missing.push('app secret');
    if (!keys.accessToken) missing.push('access token');
    return missing;
}

const money = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const two = (n) => String(n).padStart(2, '0');
const stamp = (d) => {
    const x = new Date(d || Date.now());
    return `${x.getFullYear()}-${two(x.getMonth() + 1)}-${two(x.getDate())} ${two(x.getHours())}:${two(x.getMinutes())}:${two(x.getSeconds())}`;
};

/**
 * Our order -> Pet Pooja's save-order body. `itemMap` turns our item ids into Pet Pooja item ids (unmapped lines are sent
 * with our id and listed in `unmapped`, so the manager can see which items still need mapping).
 */
export function buildSaveOrder(order, store, keys, { callbackUrl, itemMap = new Map() } = {}) {
    const p = order.pricing || {};
    const a = order.deliveryAddress || {};
    const unmapped = [];
    const posIdOf = (id) => {
        const mapped = itemMap.get?.(String(id)) || itemMap[String(id)];
        if (!mapped) unmapped.push(String(id));
        return String(mapped || id || '');
    };
    const items = (order.items || []).map((it) => ({
        id: posIdOf(it.itemId),
        name: it.name,
        price: money(it.price),
        final_price: money((Number(it.price) || 0) * (Number(it.quantity) || 1)),
        quantity: String(it.quantity || 1),
        variation_name: it.variantName || it.size || '',
        variation_id: it.variantId || '',
        description: [it.crust, it.notes, ...(it.components || []).map((c) => `${c.quantity || 1} x ${c.name}`)].filter(Boolean).join(', '),
        AddonItem: { details: (it.selectedAddons || []).map((ad) => ({ id: posIdOf(ad.id || ad.name), name: ad.name, price: money(ad.price), quantity: '1' })) },
    }));
    const body = {
        app_key: keys.appKey,
        app_secret: keys.appSecret,
        access_token: keys.accessToken,
        orderinfo: {
            OrderInfo: {
                Restaurant: { details: { res_name: store?.storeName || '', address: store?.address || '', contact_information: store?.phone || '', restID: keys.restaurantId } },
                Customer: {
                    details: {
                        name: order.customerName || a.fullName || a.name || 'Customer',
                        phone: order.customerPhone || a.phone || '',
                        email: order.customerEmail || '',
                        address: [a.street, a.additionalDetails, a.city, a.state, a.zipCode].filter(Boolean).join(', '),
                        latitude: a.location?.coordinates?.[1] != null ? String(a.location.coordinates[1]) : '',
                        longitude: a.location?.coordinates?.[0] != null ? String(a.location.coordinates[0]) : '',
                    },
                },
                Order: {
                    details: {
                        orderID: String(order.order_id || order._id),
                        preorder_date: order.scheduledAt ? stamp(order.scheduledAt).slice(0, 10) : '',
                        preorder_time: order.scheduledAt ? stamp(order.scheduledAt).slice(11) : '',
                        advanced_order: order.scheduledAt ? 'Y' : 'N',
                        order_type: order.isPickup ? 'P' : 'H',   // P pickup, H home delivery
                        payment_type: order.payment?.method === 'cash' ? 'COD' : 'ONLINE',
                        delivery_charges: money(p.deliveryFee),
                        packing_charges: money(p.packagingFee),
                        discount_total: money(p.discount),
                        tax_total: money(p.tax),
                        total: money(p.total),
                        description: order.note || '',
                        created_on: stamp(order.createdAt),
                        enable_delivery: 0,   // our riders deliver: Pet Pooja must not dispatch its own
                        callback_url: callbackUrl || '',
                    },
                },
                OrderItem: { details: items },
                Tax: { details: p.tax ? [{ id: 'GST', title: 'GST', type: 'P', price: String(p.gstRate || ''), tax: money(p.tax) }] : [] },
                Discount: { details: p.discount ? [{ id: p.couponCode || 'DISCOUNT', title: p.couponCode || 'Discount', type: 'F', price: money(p.discount) }] : [] },
            },
        },
        udid: '',
        device_type: 'Web',
    };
    return { body, unmapped: [...new Set(unmapped)] };
}

/** Cancel an order we already sent (the customer or an admin cancelled it here). */
export const buildCancelOrder = (order, keys, reason) => ({
    app_key: keys.appKey,
    app_secret: keys.appSecret,
    access_token: keys.accessToken,
    restID: keys.restaurantId,
    orderID: String(order.pos?.posOrderId || ''),
    clientorderID: String(order.order_id || order._id),
    cancelReason: String(reason || 'Cancelled').slice(0, 200),
    status: '-1',
});

/**
 * POSTs to Pet Pooja. -> { ok, skipped?, posOrderId?, message }. Never throws for a Pet Pooja answer; a network failure
 * or timeout is { ok: false, retry: true }.
 */
export async function send(path, body) {
    if (!apiReady()) return { ok: false, skipped: true, message: 'The Pet Pooja API address is not set on the server (PETPOOJA_API_BASE_URL).' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${apiBase()}/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
            signal: ctrl.signal,
        });
        let data = {};
        try { data = await res.json(); } catch { /* not JSON */ }
        const ok = res.ok && (data.success === '1' || data.success === 1 || data.success === true);
        return {
            ok,
            retry: !ok && res.status >= 500,
            posOrderId: String(data.orderID || data.orderId || ''),
            message: String(data.message || data.error || (ok ? 'Accepted by Pet Pooja' : `Pet Pooja answered ${res.status}`)).slice(0, 300),
        };
    } catch (err) {
        return { ok: false, retry: true, message: err.name === 'AbortError' ? 'Pet Pooja did not answer in time' : 'Could not reach Pet Pooja' };
    } finally {
        clearTimeout(timer);
    }
}

export const saveOrder = (body) => send('save_order', body);
export const cancelOrder = (body) => send('update_order_status', body);

/**
 * A status callback from Pet Pooja -> { restaurantId, posOrderId, clientOrderId, code, meaning, reason, prepMinutes }.
 * `meaning` is null for a code we do not know.
 */
export function parseCallback(body = {}) {
    const code = String(body.status ?? body.order_status ?? '').trim();
    return {
        restaurantId: String(body.restID ?? body.restId ?? body.rest_id ?? '').trim(),
        posOrderId: String(body.orderID ?? body.orderId ?? '').trim(),
        clientOrderId: String(body.clientorderID ?? body.clientOrderID ?? body.clientOrderId ?? '').trim(),
        code,
        meaning: STATUS_CODES[code] || null,
        reason: String(body.cancel_reason ?? body.cancelReason ?? '').trim().slice(0, 200),
        prepMinutes: Math.max(0, Math.min(240, parseInt(body.minimum_prep_time ?? body.prep_time, 10) || 0)),
    };
}
