import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { FoodUser } from '../users/user.model.js';
import { FoodStore } from '../../modules/food/store/models/store.model.js';
import { FoodDeliveryPartner } from '../../modules/food/delivery/models/deliveryPartner.model.js';
import { FoodAdmin } from '../admin/admin.model.js';
import { Role } from '../roles/models/role.model.js';
import { UserRole } from '../roles/models/userRole.model.js';
import { StoreManager } from '../../modules/food/franchise/models/storeManager.model.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const FIREBASE_MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SEND_URL = (projectId) =>
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`;
const OWNER_MODELS = {
    USER: FoodUser,
    CUSTOMER: FoodUser,
    STORE: FoodStore,
    DELIVERY_PARTNER: FoodDeliveryPartner,
    ADMIN: FoodAdmin,
    // Staff panel accounts are Users; /fcm-tokens/save passes the signed-in role as the owner type.
    SUPERADMIN: FoodUser,
    SUPER_ADMIN: FoodUser,
    FRANCHISE_ADMIN: FoodUser,
    STORE_MANAGER: FoodUser,
    KITCHEN_STAFF: FoodUser
};
const TOKEN_FIELDS_SELECT = '+fcmTokens +fcmTokenMobile';
const normalizeOwnerType = (ownerType) => String(ownerType || '').trim().toUpperCase().replace(/-/g, '_');
const OWNER_TOKEN_FIELDS = {
    web: 'fcmTokens',
    mobile: 'fcmTokenMobile'
};
const OWNER_APP_PREFIXES = {
    USER: '',
    STORE: '',
    DELIVERY_PARTNER: '',
    ADMIN: ''
};

let cachedAccessToken = null;
let cachedAccessTokenExpiryMs = 0;
let cachedServiceAccount = null;

const sanitizeString = (value) => String(value ?? '').trim();

const toBase64Url = (input) =>
    Buffer.from(JSON.stringify(input))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

const normalizePrivateKey = (key) => String(key || '').replace(/\\n/g, '\n').trim();

const getServiceAccountFromEnv = () => {
    if (cachedServiceAccount) return cachedServiceAccount;

    const rawJson = sanitizeString(config.firebaseServiceAccount || process.env.FIREBASE_SERVICE_ACCOUNT);
    if (rawJson) {
        cachedServiceAccount = JSON.parse(rawJson);
        return cachedServiceAccount;
    }

    const pathValue = sanitizeString(config.firebaseServiceAccountPath || process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (pathValue) {
        const filePath = resolve(process.cwd(), pathValue);
        if (existsSync(filePath)) {
            cachedServiceAccount = JSON.parse(readFileSync(filePath, 'utf8'));
            return cachedServiceAccount;
        }
    }

    throw new Error('Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH.');
};

const getFirebaseProjectId = () => {
    const account = getServiceAccountFromEnv();
    const projectId =
        sanitizeString(config.firebaseProjectId) ||
        sanitizeString(account.project_id) ||
        sanitizeString(process.env.FIREBASE_PROJECT_ID);
    if (!projectId) {
        throw new Error('Firebase project ID is not configured.');
    }
    return projectId;
};

const getFirebaseAccessToken = async () => {
    const now = Date.now();
    if (cachedAccessToken && cachedAccessTokenExpiryMs - now > 60_000) {
        return cachedAccessToken;
    }

    const account = getServiceAccountFromEnv();
    const privateKey = normalizePrivateKey(account.private_key);
    if (!account.client_email || !privateKey) {
        throw new Error('Firebase service account is missing client_email or private_key.');
    }

    const iat = Math.floor(now / 1000);
    const exp = iat + 3600;
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
        iss: account.client_email,
        scope: FIREBASE_MESSAGING_SCOPE,
        aud: OAUTH_TOKEN_URL,
        iat,
        exp
    };

    const jwtUnsigned = `${toBase64Url(header)}.${toBase64Url(payload)}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(jwtUnsigned);
    signer.end();
    const signature = signer.sign(privateKey, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    const assertion = `${jwtUnsigned}.${signature}`;

    const body = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion
    });

    const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Firebase OAuth token exchange failed (${response.status}): ${text}`);
    }

    const json = await response.json();
    cachedAccessToken = json.access_token;
    cachedAccessTokenExpiryMs = now + ((Number(json.expires_in) || 3600) * 1000);
    return cachedAccessToken;
};

const normalizeDataMap = (data = {}) => {
    const result = {};
    for (const [key, value] of Object.entries(data || {})) {
        if (value === undefined || value === null) continue;
        result[String(key)] = String(value);
    }
    return result;
};

const buildMessagePayload = (payload = {}, token) => {
    const data = normalizeDataMap(payload.data || {});

    // 🔍 Smart fallback for title based on data type if missing
    let derivedTitle = payload.title || payload.notification?.title;
    if (!derivedTitle) {
        const type = String(data.type || '').toLowerCase();
        if (type.includes('order')) derivedTitle = 'Order Update';
        else if (type.includes('payment')) derivedTitle = 'Payment Update';
        else if (type.includes('wallet')) derivedTitle = 'Wallet Update';
        else if (type.includes('delivery')) derivedTitle = 'Delivery Update';
        else if (type.includes('chat') || type.includes('message')) derivedTitle = 'New Message';
        else derivedTitle = 'New notification';
    }

    const notification = {
        title: sanitizeString(derivedTitle),
        body: sanitizeString(payload.body || payload.notification?.body || data.body || data.message || '')
    };

    const image =
        sanitizeString(payload.image || payload.icon || payload.notification?.image || payload.notification?.icon || data.image || data.imageUrl);

    // If payload.dataOnly is true, we omit the 'notification' block.
    // This prevents FCM from auto-displaying while allowing app code to show a 'Local Notification'.
    const message = { token };

    if (!payload.dataOnly) {
        message.notification = notification;
        if (image) {
            message.notification.image = image;
        }
    }

    // Always include the text in data so the frontend can retrieve it even if 'notification' block is stripped or missing
    if (!data.title) data.title = notification.title;
    if (!data.body) data.body = notification.body;

    message.data = data;

    message.android = {
        priority: 'high',
        notification: {
            channel_id: 'default',
            sound: 'default',
            default_vibrate_timings: true,
            default_light_settings: true
        }
    };

    message.webpush = {
        headers: {
            Urgency: 'high'
        }
    };

    if (!payload.dataOnly) {
        message.webpush.notification = {
            title: notification.title,
            body: notification.body,
            icon: image || payload.icon || '/logo.png'
        };
    }

    return message;
};

// The business logo (Settings > Business information) is the picture on every push that does not bring its own.
// Read at most once a minute; no logo (or one that is not an absolute URL) means no picture.
const BRAND_LOGO_TTL_MS = 60 * 1000;
let brandLogoCache = { at: 0, url: '' };
export const brandLogoUrl = async () => {
    if (Date.now() - brandLogoCache.at < BRAND_LOGO_TTL_MS) return brandLogoCache.url;
    let url = '';
    try {
        const { FoodBusinessSettings } = await import('../../modules/food/admin/models/businessSettings.model.js');
        const doc = await FoodBusinessSettings.findOne().select('logo').lean();
        const candidate = String(doc?.logo?.url || '').trim();
        url = /^https?:\/\//i.test(candidate) ? candidate : '';
    } catch {
        url = '';
    }
    brandLogoCache = { at: Date.now(), url };
    return url;
};
export const resetBrandLogoCache = () => { brandLogoCache = { at: 0, url: '' }; };

const parseFirebaseError = async (response) => {
    try {
        return await response.json();
    } catch {
        try {
            const text = await response.text();
            return { error: { message: text } };
        } catch {
            return { error: { message: 'Unknown Firebase error' } };
        }
    }
};

const shouldRemoveTokenFromError = (errorJson, response) => {
    const status = response?.status;
    const message = String(errorJson?.error?.message || '').toUpperCase();
    return status === 404 || message.includes('UNREGISTERED') || message.includes('INVALID_ARGUMENT');
};

const getOwnerModel = (ownerType) => OWNER_MODELS[normalizeOwnerType(ownerType)] || null;

// Token lists are written with updateOne so a save never runs unrelated document validation (old User or store
// records missing a now-required field would otherwise make every token save fail).
const writeOwnerTokens = (model, ownerId, set) => model.updateOne({ _id: ownerId }, { $set: set });

const getTokenFieldForPlatform = (platform) => OWNER_TOKEN_FIELDS[platform === 'mobile' ? 'mobile' : 'web'];

const normalizeTokenList = (tokens = []) => {
    const normalized = [...new Set((Array.isArray(tokens) ? tokens : [tokens]).map(sanitizeString).filter(Boolean))];
    return normalized.slice(-10);
};

const readTokensFromDoc = (doc, platform) => {
    if (!doc) return [];
    if (platform) {
        return normalizeTokenList(doc[getTokenFieldForPlatform(platform)] || []);
    }
    return normalizeTokenList([
        ...(Array.isArray(doc.fcmTokens) ? doc.fcmTokens : []),
        ...(Array.isArray(doc.fcmTokenMobile) ? doc.fcmTokenMobile : [])
    ]);
};

export const listOwnerTokens = async ({ ownerType, ownerId, platform }) => {
    if (!ownerType || !ownerId) return [];
    const model = getOwnerModel(ownerType);
    if (!model) return [];
    const doc = await model.findById(ownerId).select(TOKEN_FIELDS_SELECT).lean();
    return readTokensFromDoc(doc, platform);
};

export const upsertFirebaseDeviceToken = async ({ ownerType, ownerId, token, platform = 'web' }) => {
    const normalizedToken = sanitizeString(token);
    console.log(`[FCM-DEBUG] upsertFirebaseDeviceToken: ownerType=${ownerType}, ownerId=${ownerId}, platform=${platform}, tokenPreview=${normalizedToken?.slice(0, 10)}...`);

    if (!ownerType || !ownerId || !normalizedToken) {
        console.error('[FCM-DEBUG] upsert - Missing required fields');
        throw new Error('ownerType, ownerId, and token are required.');
    }

    const normalizedPlatform = platform === 'mobile' ? 'mobile' : 'web';
    const model = getOwnerModel(ownerType);
    if (!model) {
        console.error(`[FCM-DEBUG] upsert - Unsupported owner type: ${ownerType}`);
        throw new Error(`Unsupported owner type: ${ownerType}`);
    }

    const doc = await model.findById(ownerId).select(TOKEN_FIELDS_SELECT).lean();
    if (!doc) {
        console.error(`[FCM-DEBUG] upsert - Owner profile not found for id ${ownerId}`);
        throw new Error('Owner profile not found.');
    }

    const field = getTokenFieldForPlatform(normalizedPlatform);
    const existingTokens = Array.isArray(doc[field]) ? doc[field] : [];
    console.log(`[FCM-DEBUG] upsert - Current tokens in DB count: ${existingTokens.length}`);

    const tokens = normalizeTokenList([...existingTokens, normalizedToken]);
    await writeOwnerTokens(model, doc._id, { [field]: tokens });
    console.log(`[FCM-DEBUG] upsert - Token list updated. New count: ${tokens.length}`);
    return { success: true };
};

export const removeFirebaseDeviceToken = async ({ ownerType, ownerId, token, platform }) => {
    const normalizedToken = sanitizeString(token);
    if (!ownerType || !ownerId || !normalizedToken) {
        throw new Error('ownerType, ownerId, and token are required.');
    }
    const model = getOwnerModel(ownerType);
    if (!model) {
        throw new Error(`Unsupported owner type: ${ownerType}`);
    }
    const doc = await model.findById(ownerId).select(TOKEN_FIELDS_SELECT).lean();
    if (!doc) {
        return { success: false };
    }

    const fields = platform ? [getTokenFieldForPlatform(platform)] : [OWNER_TOKEN_FIELDS.web, OWNER_TOKEN_FIELDS.mobile];
    const set = {};
    for (const field of fields) {
        set[field] = normalizeTokenList((Array.isArray(doc[field]) ? doc[field] : []).filter((t) => t !== normalizedToken));
    }
    await writeOwnerTokens(model, doc._id, set);
    return { success: true };
};

export const sendPushNotification = async (tokens, payload = {}) => {
    const projectId = getFirebaseProjectId();
    const accessToken = await getFirebaseAccessToken();
    const uniqueTokens = normalizeTokenList(tokens);

    if (uniqueTokens.length === 0) {
        return { successCount: 0, failureCount: 0, results: [] };
    }

    const results = await Promise.all(
        uniqueTokens.map(async (token) => {
            const message = buildMessagePayload(payload, token);
            try {
                const response = await fetch(FCM_SEND_URL(projectId), {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });

                if (!response.ok) {
                    const errorJson = await parseFirebaseError(response);
                    return {
                        token,
                        ok: false,
                        remove: shouldRemoveTokenFromError(errorJson, response),
                        error: errorJson?.error?.message || `FCM send failed (${response.status})`
                    };
                }

                return {
                    token,
                    ok: true,
                    response: await response.json()
                };
            } catch (error) {
                return {
                    token,
                    ok: false,
                    remove: false,
                    error: error?.message || String(error)
                };
            }
        })
    );

    const successCount = results.filter((result) => result.ok).length;
    const failureCount = results.length - successCount;
    return { successCount, failureCount, results };
};

export const sendNotificationToOwner = async ({ ownerType, ownerId, payload, platform } = {}) => {
    // 💡 Clone the payload to avoid side-effects (e.g. adding multiple prefixes to the same object during broadcasting)
    const enrichedPayload = { ...payload };

    // 🏷️ Add Highlighter Prefix to the Title
    if (enrichedPayload && !enrichedPayload.skipHighlighter) {
        const typeKey = String(ownerType || '').toUpperCase();
        const prefix = OWNER_APP_PREFIXES[typeKey] || '';

        if (prefix) {
            // Get original title from any potential field
            let originalTitle = enrichedPayload.title || enrichedPayload.notification?.title || 'New notification';

            // Safety: Ensure we don't ADD the prefix if it's already there (defensive check)
            if (!originalTitle.includes(prefix)) {
                enrichedPayload.title = `${prefix} ${originalTitle}`.trim();
            } else {
                enrichedPayload.title = originalTitle;
            }
        }
    }

    const tokens = await listOwnerTokens({ ownerType, ownerId, platform });
    if (!tokens.length) {
        return { successCount: 0, failureCount: 0, results: [] };
    }
    if (!enrichedPayload.image && !enrichedPayload.icon) {
        const logo = await brandLogoUrl();
        if (logo) enrichedPayload.image = logo;
    }
    try {
        console.log(`[FCM] Sending to ${ownerType}:${ownerId}. Title: "${enrichedPayload.title || 'Data Only'}"`);
        const response = await sendPushNotification(tokens, enrichedPayload);
        const invalidTokens = (response.results || [])

            .filter((item) => !item.ok && item.remove)
            .map((item) => item.token)
            .filter(Boolean);
        if (invalidTokens.length > 0) {
            const model = getOwnerModel(ownerType);
            const doc = model ? await model.findById(ownerId).select(TOKEN_FIELDS_SELECT).lean() : null;
            if (doc) {
                const fieldNames = platform
                    ? [getTokenFieldForPlatform(platform)]
                    : [OWNER_TOKEN_FIELDS.web, OWNER_TOKEN_FIELDS.mobile];
                const set = {};
                for (const field of fieldNames) {
                    set[field] = normalizeTokenList((Array.isArray(doc[field]) ? doc[field] : []).filter((t) => !invalidTokens.includes(t)));
                }
                await writeOwnerTokens(model, doc._id, set);
            }
        }
        logger.info(
            `FCM push sent to ${ownerType}:${ownerId} (${platform || 'all'}). Success=${response.successCount}, Failure=${response.failureCount}`
        );
        return response;
    } catch (error) {
        logger.warn(`FCM push failed for ${ownerType}:${ownerId}: ${error.message}`);
        return { successCount: 0, failureCount: tokens.length, error: error.message };
    }
};

const roleIdCache = new Map();
const roleIdFor = async (code) => {
    if (!roleIdCache.has(code)) {
        const role = await Role.findOne({ code }).select('_id').lean();
        if (!role) return null; // not cached: the role may be seeded later
        roleIdCache.set(code, role._id);
    }
    return roleIdCache.get(code);
};

const isObjectIdLike = (value) => /^[a-f0-9]{24}$/i.test(String(value || ''));

// Of these User ids, the ones that may still receive pushes (active, not blocked, not deleted).
const activeUserIds = async (ids = []) => {
    const unique = [...new Set(ids.map(String).filter(isObjectIdLike))];
    if (!unique.length) return [];
    const rows = await FoodUser.find({ _id: { $in: unique }, isActive: { $ne: false }, isBlocked: { $ne: true }, isDeleted: { $ne: true } })
        .select('_id')
        .lean();
    return rows.map((row) => String(row._id));
};

// The store managers of a store: the userRoles link (what scopes their panel) and the StoreManager profile (what the
// login prefers). A manager who switched off push notifications in Profile > Notifications is left out.
export const storeManagerUserIds = async (storeId) => {
    if (!isObjectIdLike(storeId)) return [];
    const roleId = await roleIdFor('STORE_MANAGER');
    const [links, profiles] = await Promise.all([
        roleId ? UserRole.find({ storeId, roleId, status: 'ACTIVE' }).select('userId').lean() : [],
        StoreManager.find({ storeId: String(storeId), status: { $nin: ['DELETED', 'Suspended', 'Rejected'] }, userId: { $ne: null } })
            .select('userId notificationPrefs')
            .lean()
    ]);
    const optedOut = new Set(profiles.filter((p) => p.notificationPrefs?.pushNotifications === false).map((p) => String(p.userId)));
    const ids = [...links.map((l) => l.userId), ...profiles.map((p) => p.userId)].map(String).filter((id) => !optedOut.has(id));
    return activeUserIds(ids);
};

export const superAdminUserIds = async () => {
    const roleId = await roleIdFor('SUPER_ADMIN');
    if (!roleId) return [];
    const links = await UserRole.find({ roleId, status: 'ACTIVE' }).select('userId').lean();
    return activeUserIds(links.map((l) => l.userId));
};

// Push targets name a store or "the admins"; the people who hold device tokens are Users. A STORE target also reaches
// that store's managers, and an ADMIN target that is not a FoodAdmin record (e.g. 'GLOBAL') reaches the super admins.
const expandTargets = async (targets = []) => {
    const expanded = [];
    for (const target of targets) {
        const type = normalizeOwnerType(target.ownerType);
        if (type === 'STORE') {
            expanded.push(target);
            for (const userId of await storeManagerUserIds(target.ownerId)) {
                expanded.push({ ownerType: 'STORE_MANAGER', ownerId: userId, platform: target.platform });
            }
        } else if (type === 'ADMIN' && !isObjectIdLike(target.ownerId)) {
            for (const userId of await superAdminUserIds()) {
                expanded.push({ ownerType: 'SUPER_ADMIN', ownerId: userId, platform: target.platform });
            }
        } else {
            expanded.push(target);
        }
    }
    return expanded;
};

export const sendNotificationToOwners = async (targets = [], payload = {}) => {
    // 🔍 Tip #6: Deduplicate targets before sending. Keyed by the record the tokens live on, so one person reached
    // two ways (say as STORE_MANAGER and as SUPER_ADMIN) is notified once.
    const valid = Array.isArray(targets) ? targets.filter(t => t?.ownerType && t?.ownerId) : [];
    const recordKey = (t) => `${getOwnerModel(t.ownerType)?.modelName || normalizeOwnerType(t.ownerType)}:${t.ownerId}`;
    const uniqueTargets = [...new Map((await expandTargets(valid)).map(t => [recordKey(t), t])).values()];

    const results = [];
    for (const target of uniqueTargets) {
        results.push(
            await sendNotificationToOwner({
                ownerType: target.ownerType,
                ownerId: target.ownerId,
                platform: target.platform,
                payload
            })
        );
    }
    return results;
};

export const notifyAdminsSafely = async (payload = {}) => {
    try {
        // Super admins are Users (userRoles SUPER_ADMIN); FoodAdmin records are kept for older installs.
        const [admins, superAdmins] = await Promise.all([
            FoodAdmin.find({ isActive: true }).select('_id').lean(),
            superAdminUserIds()
        ]);
        const targets = [
            ...admins.map(a => ({ ownerType: 'ADMIN', ownerId: String(a._id) })),
            ...superAdmins.map(id => ({ ownerType: 'SUPER_ADMIN', ownerId: id }))
        ];
        if (!targets.length) return [];

        return await sendNotificationToOwners(targets, payload);
    } catch (e) {
        logger.error(`Error notifying admins: ${e.message}`);
        return [];
    }
};

export const sendTestNotification = async ({ ownerType, ownerId, platform }) => {
    return sendNotificationToOwner({
        ownerType,
        ownerId,
        platform,
        payload: {
            title: 'Test Notification',
            body: 'This is a test notification from Firebase push',
            data: {
                type: 'test',
                link: '/'
            }
        }
    });
};
export const notifyOwnerSafely = async (target = {}, payload = {}) => {
    try {
        return await sendNotificationToOwner({ ...target, payload });
    } catch (error) {
        logger.warn(`FCM individual push failed: ${error.message}`);
        return null;
    }
};

export const notifyOwnersSafely = async (targets = [], payload = {}) => {
    try {
        return await sendNotificationToOwners(targets, payload);
    } catch (error) {
        logger.warn(`FCM broadcast push failed: ${error.message}`);
        return [];
    }
};
