import { config } from '../../../../config/env.js';

// Pet Pooja "Online Ordering APIs" v2.1.0 adapter: the only file that knows Pet Pooja's field names, endpoints and status
// codes (petpooja-api-docs.pdf in the project root).
//
// Calls we make (all POST, JSON):
//   save_order            Save Order: keys (app_key, app_secret, access_token) in the body, the order in orderinfo.OrderInfo
//   update_order_status   Update Order Status: cancel only (status -1), keys in the body
//   fetch_menu            Fetch Menu (mapped_restaurant_menus): keys as headers (app-key, app-secret, access-token), { restID }
// Calls Pet Pooja makes to us: order status callback (per store link), push menu, item stock on/off, get / update store
// status (one set of links for the whole app, see posPartnerHooks.service.js).
//
// Where each call goes is set by the store manager on the Pet Pooja page (saved with the store, `conf` below):
//   apiEnv 'staging'     Pet Pooja's staging URLs from the docs
//   apiEnv 'production'  apiBaseUrl (the production address Pet Pooja gives) + the path below
// A store that has not chosen falls back to the server's environment (PETPOOJA_<NAME>_URL, PETPOOJA_API_BASE_URL + path,
// PETPOOJA_ENV=staging). With none of these nothing is sent: every send is recorded as skipped (never as a fake success).

export const PROVIDER = 'petpooja';

// Order status codes in the callback (docs: -1 cancelled, 1/2/3 accepted, 4 dispatch, 5 food ready, 10 delivered)
export const STATUS_CODES = {
    '-1': 'cancelled',
    1: 'accepted',
    2: 'accepted',
    3: 'accepted',
    4: 'dispatched',
    5: 'food_ready',
    10: 'delivered',
};

const ENDPOINTS = {
    save_order: { env: 'PETPOOJA_SAVE_ORDER_URL', path: 'save_order', staging: 'https://47pfzh5sf2.execute-api.ap-southeast-1.amazonaws.com/V1/save_order' },
    update_order_status: { env: 'PETPOOJA_UPDATE_ORDER_STATUS_URL', path: 'update_order_status', staging: 'https://qle1yy2ydc.execute-api.ap-southeast-1.amazonaws.com/V1/update_order_status' },
    fetch_menu: { env: 'PETPOOJA_FETCH_MENU_URL', path: 'mapped_restaurant_menus', staging: 'https://qle1yy2ydc.execute-api.ap-southeast-1.amazonaws.com/V1/mapped_restaurant_menus' },
};

const apiBase = () => String(process.env.PETPOOJA_API_BASE_URL || config.petpoojaApiBaseUrl || '').trim().replace(/\/+$/, '');
const TIMEOUT_MS = Number(process.env.PETPOOJA_TIMEOUT_MS) || 15000;
// Pet Pooja sends local restaurant times without a zone (e.g. "2020-02-24 18:00")
const TZ_OFFSET = process.env.PETPOOJA_TZ_OFFSET || '+05:30';

/** HTTPS only, except outside production (a local test double on 127.0.0.1 / localhost). */
const allowed = (url) => /^https:\/\//i.test(url) || (config.nodeEnv !== 'production' && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(url));

/** Is this a production address the store may save? (HTTPS; a local address only outside production) */
export const validApiBaseUrl = (url) => allowed(String(url || '').trim());

/** The URL of one Pet Pooja call for a store (`conf` = its { apiEnv, apiBaseUrl }), or '' when unknown / not allowed. */
export function endpointUrl(name, conf = {}) {
    const ep = ENDPOINTS[name];
    if (!ep) return '';
    let url = '';
    if (conf?.apiEnv === 'staging') url = ep.staging;
    else if (conf?.apiEnv === 'production') {
        const base = String(conf.apiBaseUrl || '').trim().replace(/\/+$/, '');
        url = base ? `${base}/${ep.path}` : '';
    } else {
        url = String(process.env[ep.env] || '').trim();
        if (!url && apiBase()) url = `${apiBase()}/${ep.path}`;
        if (!url && String(process.env.PETPOOJA_ENV || '').toLowerCase() === 'staging') url = ep.staging;
    }
    return allowed(url) ? url : '';
}

/** Does this store know where to send orders? */
export const apiReady = (conf = {}) => !!endpointUrl('save_order', conf);

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
/** "yyyy-mm-dd HH:mm:ss" in the restaurant's time zone (Pet Pooja's date format). */
const stamp = (d) => {
    const [, sign, hh, mm] = /^([+-])(\d{2}):(\d{2})$/.exec(TZ_OFFSET) || [null, '+', '05', '30'];
    const offsetMin = (sign === '-' ? -1 : 1) * (Number(hh) * 60 + Number(mm));
    const x = new Date(new Date(d || Date.now()).getTime() + offsetMin * 60000);
    return `${x.getUTCFullYear()}-${two(x.getUTCMonth() + 1)}-${two(x.getUTCDate())} ${two(x.getUTCHours())}:${two(x.getUTCMinutes())}:${two(x.getUTCSeconds())}`;
};
/** Pet Pooja's local "yyyy-MM-dd HH:mm[:ss]" -> Date, or null. */
export function parseLocalTime(text) {
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?$/.exec(String(text || '').trim());
    if (!m) return null;
    const d = new Date(`${m[1]}T${m[2]}${m[3] || ':00'}${TZ_OFFSET}`);
    return Number.isNaN(d.getTime()) ? null : d;
}

// ----- item mapping keys (StorePosIntegration.itemMap) -----
// key:   "<our product / combo id>" or "<our product id>|<size>"  ->  value "<PP item id>" or "<PP item id>|<PP variation id>"
//        "addon:<our add-on id>"                                  ->  value "<PP addon item id>|<PP addon group id>"
// (Map keys may not hold "." or "$", so sizes are normalised.)
export const sizeKey = (s) => String(s || '').trim().toLowerCase().replace(/[.$]/g, '_').slice(0, 60);
export const itemKey = (itemId, size) => (sizeKey(size) ? `${itemId}|${sizeKey(size)}` : String(itemId));
export const addonKey = (addonId) => `addon:${addonId}`;
const mapGet = (map, k) => (typeof map?.get === 'function' ? map.get(k) : map?.[k]) || '';
const splitPair = (v) => { const [a = '', b = ''] = String(v || '').split('|'); return [a, b]; };

/** The GST parts to report: CGST + SGST from the store's Pet Pooja tax list when it has them, else one GST line. */
export function taxParts(taxes = [], gstRate = 0) {
    const active = (taxes || []).filter((t) => t && t.id && t.active !== false);
    const find = (rx) => active.find((t) => rx.test(String(t.name || '')));
    const cgst = find(/\bcgst\b/i);
    const sgst = find(/\bsgst\b/i);
    if (cgst && sgst) return [{ id: cgst.id, title: cgst.name, rate: gstRate / 2 }, { id: sgst.id, title: sgst.name, rate: gstRate / 2 }];
    const gst = find(/gst/i);
    return [{ id: gst?.id || 'GST', title: gst?.name || 'GST', rate: gstRate }];
}

/**
 * Our order -> Pet Pooja's Save Order body. `itemMap` turns our ids into Pet Pooja item / variation / add-on ids
 * (unmapped lines are sent with our id and listed in `unmapped`, so the manager can see which items still need mapping).
 * `menu` ({ variations: Map id->name, addonGroups: Map id->name, taxes: [{ id, name }] }) comes from the store's last
 * Pet Pooja menu and fills variation names, add-on group names and tax ids.
 */
export function buildSaveOrder(order, store, keys, { callbackUrl, itemMap = new Map(), menu = {} } = {}) {
    const p = order.pricing || {};
    const a = order.deliveryAddress || {};
    const unmapped = [];
    const variationName = (id) => menu.variations?.get?.(id) || '';
    const groupName = (id) => menu.addonGroups?.get?.(id) || '';

    const gstRate = Number(p.gstRate) || 0;
    const taxTotal = Number(p.tax) || 0;
    const parts = taxParts(menu.taxes, gstRate);
    const partShare = (t) => (gstRate > 0 ? t.rate / gstRate : 1 / parts.length);
    const lines = (order.items || []).map((it) => ({ it, total: (Number(it.price) || 0) * (Number(it.quantity) || 1) }));
    const linesTotal = lines.reduce((s, l) => s + l.total, 0);

    const items = lines.map(({ it, total }) => {
        const size = it.size || it.variantName || '';
        const value = mapGet(itemMap, itemKey(it.itemId, size)) || mapGet(itemMap, itemKey(it.itemId));
        if (!value) unmapped.push(String(it.itemId));
        const [ppId, ppVariation] = splitPair(value);
        const lineTax = linesTotal > 0 ? (taxTotal * total) / linesTotal : 0;
        return {
            id: String(ppId || it.itemId || ''),
            name: it.name,
            tax_inclusive: false,
            item_tax: lineTax > 0 ? parts.map((t) => ({ id: t.id, name: t.title, amount: money(lineTax * partShare(t)) })) : [],
            item_discount: '0.00',
            price: money(it.price),   // one unit, with its size and add-ons (as our cart prices it)
            final_price: money(total),
            quantity: String(it.quantity || 1),
            description: [it.crust, it.notes, ...(it.components || []).map((c) => `${c.quantity || 1} x ${c.name}`)].filter(Boolean).join(', '),
            variation_name: ppVariation ? (variationName(ppVariation) || size) : '',
            variation_id: ppVariation || '',
            AddonItem: {
                details: (it.selectedAddons || []).map((ad) => {
                    const mapped = ad.id ? mapGet(itemMap, addonKey(ad.id)) : '';
                    if (!mapped) unmapped.push(`addon:${ad.id || ad.name}`);
                    const [addonId, groupId] = splitPair(mapped);
                    return { id: String(addonId || ad.id || ad.name || ''), name: ad.name, group_name: groupName(groupId), group_id: groupId, price: money(ad.price), quantity: '1' };
                }),
            },
        };
    });

    const extras = (Number(p.handlingFee) || 0) + (Number(p.platformFee) || 0);
    const description = [
        order.note || '',
        order.scheduledAt ? `Scheduled for ${stamp(order.scheduledAt).slice(0, 16)}` : '',
        extras > 0 ? `Total includes platform / handling fee ${money(extras)}` : '',
    ].filter(Boolean).join(' | ');
    const created = stamp(order.createdAt);
    const phone = String(order.customerPhone || a.phone || '').replace(/\D/g, '').slice(-10);

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
                        phone,
                        email: order.customerEmail || '',
                        address: [a.street, a.additionalDetails, a.city, a.state, a.zipCode].filter(Boolean).join(', '),
                        latitude: a.location?.coordinates?.[1] != null ? String(a.location.coordinates[1]) : '',
                        longitude: a.location?.coordinates?.[0] != null ? String(a.location.coordinates[0]) : '',
                    },
                },
                Order: {
                    details: {
                        orderID: String(order.order_id || order._id),
                        // "Order creation date / time" (a later date is refused: SO_105); a scheduled time goes in the description
                        preorder_date: created.slice(0, 10),
                        preorder_time: created.slice(11),
                        service_charge: '0.00',
                        sc_tax_amount: '0.00',
                        delivery_charges: money(p.deliveryFee),
                        dc_tax_percentage: '0.00',   // GST is charged on the food only (orders/services/order-pricing.service.js)
                        dc_tax_amount: '0.00',
                        packing_charges: money(p.packagingFee),
                        pc_tax_amount: '0.00',
                        pc_tax_percentage: '0.00',
                        order_type: order.isPickup ? 'P' : 'H',   // P parcel (pickup), H home delivery
                        advanced_order: order.scheduledAt ? 'Y' : 'N',
                        payment_type: order.payment?.method === 'cash' ? 'COD' : 'ONLINE',
                        discount_total: money(p.discount),
                        discount_type: 'F',
                        tax_total: money(taxTotal),
                        total: money(p.total),
                        description,
                        created_on: created,
                        enable_delivery: 0,   // 0 = third-party rider: our riders deliver, Pet Pooja must not dispatch its own
                        callback_url: callbackUrl || '',
                    },
                },
                OrderItem: { details: items },
                Tax: { details: taxTotal > 0 ? parts.map((t) => ({ id: t.id, title: t.title, type: 'P', price: String(t.rate), tax: money(taxTotal * partShare(t)) })) : [] },
                Discount: { details: Number(p.discount) > 0 ? [{ id: p.couponCode || 'DISCOUNT', title: p.couponCode || 'Discount', type: 'F', price: money(p.discount) }] : [] },
            },
        },
        udid: '',
        device_type: 'Web',
    };
    return { body, unmapped: [...new Set(unmapped)] };
}

/** Cancel an order we already sent (the customer or an admin cancelled it here). Pet Pooja's own orderID is deprecated: blank. */
export const buildCancelOrder = (order, keys, reason) => ({
    app_key: keys.appKey,
    app_secret: keys.appSecret,
    access_token: keys.accessToken,
    restID: keys.restaurantId,
    orderID: '',
    clientorderID: String(order.order_id || order._id),
    cancelReason: String(reason || 'Cancelled').slice(0, 200),
    status: '-1',
});

/**
 * POSTs one Pet Pooja call. -> { ok, skipped?, retry?, posOrderId?, message, data }. Never throws for a Pet Pooja answer;
 * a network failure, a timeout or a 5xx is { ok: false, retry: true }.
 */
export async function send(name, body, { headers = {}, conf = {} } = {}) {
    const url = endpointUrl(name, conf);
    if (!url) return { ok: false, skipped: true, message: 'The Pet Pooja server is not chosen yet (Pet Pooja page: Staging or Production).' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
            body: JSON.stringify(body),
            signal: ctrl.signal,
        });
        let data = {};
        try { data = await res.json(); } catch { /* not JSON */ }
        const ok = res.ok && (data.success === '1' || data.success === 1 || data.success === true);
        const detail = data.validation_errors && typeof data.validation_errors === 'object'
            ? Object.values(data.validation_errors).flat().filter(Boolean).join(' ') : '';
        return {
            ok,
            retry: !ok && res.status >= 500,
            posOrderId: String(data.orderID || data.orderId || ''),
            message: String([data.message || data.error || (ok ? 'Accepted by Pet Pooja' : `Pet Pooja answered ${res.status}`), data.errorCode, detail].filter(Boolean).join(' ')).slice(0, 300),
            data,
        };
    } catch (err) {
        return { ok: false, retry: true, message: err.name === 'AbortError' ? 'Pet Pooja did not answer in time' : 'Could not reach Pet Pooja' };
    } finally {
        clearTimeout(timer);
    }
}

export const saveOrder = (body, conf) => send('save_order', body, { conf });
export const cancelOrder = (body, conf) => send('update_order_status', body, { conf });
/** Fetch Menu: the keys go as headers. */
export const fetchMenu = (keys, conf) => send('fetch_menu', { restID: keys.restaurantId }, {
    conf,
    headers: { 'app-key': keys.appKey, 'app-secret': keys.appSecret, 'access-token': keys.accessToken },
});

/**
 * An order status callback -> { restaurantId, refs, code, meaning, reason, prepMinutes }. `refs` are the order ids it
 * names: per the docs `orderID` is OUR order id; older callbacks also carry clientorderID (ours) with orderID being Pet
 * Pooja's. Both are matched. `meaning` is null for a code we do not know.
 */
export function parseCallback(body = {}) {
    const code = String(body.status ?? body.order_status ?? '').trim();
    const refs = [body.clientorderID, body.clientOrderID, body.clientOrderId, body.orderID, body.orderId]
        .map((v) => String(v ?? '').trim()).filter(Boolean).slice(0, 4);
    return {
        restaurantId: String(body.restID ?? body.restId ?? body.rest_id ?? '').trim(),
        refs: [...new Set(refs)],
        posOrderId: String(body.orderID ?? body.orderId ?? '').trim(),
        code,
        meaning: STATUS_CODES[code] || null,
        reason: String(body.cancel_reason ?? body.cancelReason ?? '').trim().slice(0, 200),
        prepMinutes: Math.max(0, Math.min(240, parseInt(body.minimum_prep_time ?? body.prep_time, 10) || 0)),
        modified: /^(yes|1|true)$/i.test(String(body.is_modified ?? '')),
    };
}

// ----- menu (Push Menu / Fetch Menu share one shape) -----
const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isOn = (v) => v === true || v === 1 || /^(1|true|yes)$/i.test(String(v ?? ''));
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const MAX_ITEMS = 3000;

/** A Pet Pooja menu body -> what we keep of it (ids, names, prices, on/off). Unknown fields are dropped. */
export function parseMenu(body = {}) {
    const restaurants = list(body.restaurants, 20);
    const first = restaurants[0] || {};
    const categories = new Map(list(body.categories, 500).map((c) => [str(c.categoryid, 40), str(c.categoryname)]));
    const items = list(body.items, MAX_ITEMS).filter((i) => str(i?.itemid, 40)).map((i) => {
        const variations = list(i.variation, 50).filter((v) => str(v?.id, 40)).map((v) => ({
            id: str(v.id, 40), variationId: str(v.variationid, 40), name: str(v.name, 120), group: str(v.groupname, 60),
            price: num(v.price), active: v.active == null ? true : isOn(v.active),
            addonGroupIds: list(v.addon, 30).map((ad) => str(ad?.addon_group_id, 40)).filter(Boolean),
        }));
        return {
            id: str(i.itemid, 40),
            name: str(i.itemname),
            category: categories.get(str(i.item_categoryid, 40)) || '',
            price: num(i.price),
            active: i.active == null ? true : isOn(i.active),
            inStock: i.in_stock == null ? true : !/^(0|false)$/i.test(String(i.in_stock)),
            variations,
            addonGroupIds: [...new Set([...list(i.addon, 30).map((ad) => str(ad?.addon_group_id, 40)), ...variations.flatMap((v) => v.addonGroupIds)].filter(Boolean))],
        };
    });
    const addonGroups = list(body.addongroups, 500).filter((g) => str(g?.addongroupid, 40)).map((g) => ({
        id: str(g.addongroupid, 40),
        name: str(g.addongroup_name),
        active: g.active == null ? true : isOn(g.active),
        items: list(g.addongroupitems, 200).filter((a) => str(a?.addonitemid, 40)).map((a) => ({
            id: str(a.addonitemid, 40), name: str(a.addonitem_name), price: num(a.addonitem_price), active: a.active == null ? true : isOn(a.active),
        })),
    }));
    const taxes = list(body.taxes, 50).filter((t) => str(t?.taxid, 40)).map((t) => ({
        id: str(t.taxid, 40), name: str(t.taxname, 60), rate: num(t.tax), active: t.active == null ? true : isOn(t.active),
    }));
    return {
        restaurantIds: [...new Set(restaurants.flatMap((r) => [str(r?.restaurantid, 60), str(r?.details?.menusharingcode, 60)]).filter(Boolean))],
        restaurantName: str(first.details?.restaurantname),
        items,
        addonGroups,
        taxes,
    };
}

/** Item stock on / off body -> { restaurantId, type, inStock, ids, turnOnAt }. */
export function parseStock(body = {}) {
    const inStock = body.inStock === true || /^(true|1)$/i.test(String(body.inStock ?? ''));
    const turnOnAt = !inStock && String(body.autoTurnOnTime || '').toLowerCase() === 'custom' ? parseLocalTime(body.customTurnOnTime) : null;
    return {
        restaurantId: str(body.restID ?? body.restId, 60),
        type: String(body.type || 'item').toLowerCase() === 'addon' ? 'addon' : 'item',
        inStock,
        ids: [...new Set(list(body.itemID, 500).map((v) => str(v, 40)).filter(Boolean))],
        turnOnAt,
    };
}

/** Update store status body -> { restaurantId, open, turnOnAt, reason }. */
export const parseStoreStatus = (body = {}) => ({
    restaurantId: str(body.restID ?? body.restId, 60),
    open: String(body.store_status ?? '').trim() === '1',
    turnOnAt: parseLocalTime(body.turn_on_time),
    reason: str(body.reason, 200),
});
