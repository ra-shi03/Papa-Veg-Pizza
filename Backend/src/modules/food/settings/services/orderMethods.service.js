import mongoose from 'mongoose';
import { HomePage } from '../models/homePage.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';

// Order methods: how a customer can order. Built in: delivery, takeaway, in-car, delivery on train, dine-in (dine-in
// starts switched off). The super admin can also create more. Each is switched on or off and offered at every store,
// the stores of chosen franchises, or only chosen stores. Built-in methods cannot be deleted, only switched off.
export const BUILTIN_METHOD_IDS = ['delivery', 'takeaway', 'incar', 'train', 'dinein'];
export const MAX_METHODS = 12;
const ID_RE = /^[a-z][a-z0-9_]{1,29}$/;

export const DEFAULT_ORDER_METHODS = [
    { id: 'delivery', label: 'Delivery', icon: 'moped', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'takeaway', label: 'Takeaway', icon: 'store', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'incar', label: 'In-Car', icon: 'directions_car', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'train', label: 'Delivery on Train', icon: 'train', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'dinein', label: 'Dine-in', icon: 'restaurant', enabled: false, scope: 'all', franchiseIds: [], storeIds: [] },
];

const strs = (list) => (list || []).map(String);

const cleanOne = (m, def, id) => ({
    id,
    label: String(m?.label || def?.label || id),
    icon: m?.icon || def?.icon || 'storefront',
    enabled: m ? m.enabled !== false : def.enabled,
    scope: ['all', 'franchises', 'stores'].includes(m?.scope) ? m.scope : 'all',
    franchiseIds: strs(m?.franchiseIds),
    storeIds: strs(m?.storeIds),
    custom: !def,
});

/** The saved methods: the built-in ones in a fixed order (defaults when never saved), then the created ones. */
export function normalizeMethods(saved, removed = []) {
    const list = Array.isArray(saved) ? saved : [];
    const byId = new Map(list.map((m) => [String(m?.id), m]));
    const gone = new Set(strs(removed));
    const builtin = DEFAULT_ORDER_METHODS.filter((d) => !gone.has(d.id)).map((def) => (byId.has(def.id) ? cleanOne(byId.get(def.id), def, def.id) : { ...def, custom: false }));
    const custom = list.filter((m) => ID_RE.test(String(m?.id)) && !BUILTIN_METHOD_IDS.includes(String(m.id))).map((m) => cleanOne(m, null, String(m.id)));
    return [...builtin, ...custom];
}

export async function loadMethods() {
    const doc = await HomePage.findOne().select('orderMethods removedMethodIds').lean();
    return normalizeMethods(doc?.orderMethods, doc?.removedMethodIds);
}

/** Is this method offered at this store? `store` needs _id and franchiseId. */
export function methodAllowedAt(method, store) {
    if (!method || method.enabled === false) return false;
    if (method.scope === 'franchises') return !!store && strs(method.franchiseIds).includes(String(store.franchiseId || ''));
    if (method.scope === 'stores') return !!store && strs(method.storeIds).includes(String(store._id || store.id || ''));
    return true;
}

/**
 * What the customer app may show. With a store (the one that serves the customer) every rule applies. With no store
 * known yet, only methods open to every store are offered: a method limited to some stores or franchises appears
 * once the customer's location resolves to one of them.
 */
export async function publicMethodsFor(store) {
    const methods = await loadMethods();
    return methods.map((m) => ({
        id: m.id,
        label: m.label,
        icon: m.icon || '',
        enabled: store ? methodAllowedAt(m, store) : (m.enabled && m.scope === 'all'),
    }));
}

/** Throws when the method is not offered at the store (orders for it are refused). */
export async function assertMethodAllowed(methodId, store) {
    const all = await loadMethods();
    const id = all.some((m) => m.id === methodId) ? methodId : 'delivery';
    const method = all.find((m) => m.id === id);
    if (!methodAllowedAt(method, store)) {
        throw new ValidationError(`${method?.label || 'This order method'} is not available at this store.`);
    }
    return id;
}

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;

/** Validates a super admin save: known ids, known scope, real franchises and stores, and a list for a limited scope. */
export async function validateMethodsInput(input) {
    if (!Array.isArray(input) || input.length === 0 || input.length > MAX_METHODS) throw new ValidationError('Send the order methods as a list');
    const seen = new Set();
    const clean = [];
    const slug = (label) => String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 28);
    const removedNow = new Set(strs((await HomePage.findOne().select('removedMethodIds').lean())?.removedMethodIds));
    for (let m of input) {
        let id = String(m?.id || '');
        if (!id && String(m?.label || '').trim()) { // a newly created method: its id comes from its name
            const flat = (v) => String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
            const same = DEFAULT_ORDER_METHODS.find((d) => flat(d.id) === flat(m.label) || flat(d.label) === flat(m.label));
            if (same && !removedNow.has(same.id)) throw new ValidationError(`${String(m.label).trim()} already exists, switch it on instead`);
            if (same) { id = same.id; m = { ...m, id: same.id, label: same.label }; } // a deleted built-in method comes back
        }
        if (!id && String(m?.label || '').trim()) {
            const base = slug(m.label) || 'method';
            id = /^[a-z]/.test(base) ? base : `m_${base}`;
            for (let n = 2; seen.has(id) || input.some((x) => x !== m && x?.id === id) || BUILTIN_METHOD_IDS.includes(id); n += 1) id = `${base}_${n}`.slice(0, 30);
        }
        if (!ID_RE.test(id)) throw new ValidationError(`Unknown order method: ${id || '(empty)'}`);
        if (!BUILTIN_METHOD_IDS.includes(id) && !String(m?.label || '').trim()) throw new ValidationError(`${id}: give the method a name`);
        if (seen.has(id)) throw new ValidationError(`Order method sent twice: ${id}`);
        seen.add(id);
        const scope = String(m?.scope || 'all');
        if (!['all', 'franchises', 'stores'].includes(scope)) throw new ValidationError(`${id}: scope must be all, franchises or stores`);
        const franchiseIds = [...new Set(strs(m?.franchiseIds))];
        const storeIds = [...new Set(strs(m?.storeIds))];
        if ([...franchiseIds, ...storeIds].some((v) => !isObjectId(v))) throw new ValidationError(`${id}: invalid franchise or store id`);
        if (franchiseIds.length > 500 || storeIds.length > 2000) throw new ValidationError(`${id}: too many franchises or stores`);
        if (scope === 'franchises' && franchiseIds.length === 0) throw new ValidationError(`${id}: choose at least one franchise`);
        if (scope === 'stores' && storeIds.length === 0) throw new ValidationError(`${id}: choose at least one store`);
        const label = String(m?.label || '').trim().slice(0, 40);
        const def = DEFAULT_ORDER_METHODS.find((d) => d.id === id);
        clean.push({
            id, label: label || def.label, icon: def?.icon || String(m?.icon || 'storefront').slice(0, 40), enabled: m?.enabled !== false, scope,
            franchiseIds: scope === 'franchises' ? franchiseIds : [],
            storeIds: scope === 'stores' ? storeIds : [],
        });
    }
    // every id must exist, so a stale or invented id cannot sit in the rules
    const franchiseIds = [...new Set(clean.flatMap((m) => m.franchiseIds))];
    const storeIds = [...new Set(clean.flatMap((m) => m.storeIds))];
    if (franchiseIds.length && (await FoodFranchise.countDocuments({ _id: { $in: franchiseIds } })) !== franchiseIds.length) throw new ValidationError('A chosen franchise does not exist');
    if (storeIds.length && (await FoodStore.countDocuments({ _id: { $in: storeIds } })) !== storeIds.length) throw new ValidationError('A chosen store does not exist');
    // built-in methods not sent keep their current rule; created methods not sent are deleted
    const current = await loadMethods();
    const builtin = BUILTIN_METHOD_IDS.map((id) => clean.find((m) => m.id === id) || current.find((m) => m.id === id)).filter(Boolean);
    return [...builtin, ...clean.filter((m) => !BUILTIN_METHOD_IDS.includes(m.id))];
}

export async function saveMethods(input) {
    const methods = await validateMethodsInput(input);
    const sent = new Set(methods.map((m) => m.id));
    // a built-in method that is sent again is no longer deleted
    await HomePage.findOneAndUpdate({}, { $set: { orderMethods: methods }, $pull: { removedMethodIds: { $in: [...sent] } } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return loadMethods();
}

/** Deletes a method: a created one is dropped; a built-in one is hidden everywhere until it is created again. */
export async function deleteMethod(id) {
    const all = await loadMethods();
    const m = all.find((x) => x.id === String(id));
    if (!m) throw new NotFoundError('Order method not found');
    const update = { $pull: { orderMethods: { id: m.id } } };
    if (!m.custom) update.$addToSet = { removedMethodIds: m.id };
    await HomePage.findOneAndUpdate({}, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    return loadMethods();
}

export const DEFAULT_NEARBY_RADIUS_KM = 10;

/** Radius (km) within which customers see stores. */
export async function loadNearbyRadiusKm() {
    const doc = await HomePage.findOne().select('nearbyStoreRadiusKm').lean();
    const n = Number(doc?.nearbyStoreRadiusKm);
    return Number.isFinite(n) && n >= 1 && n <= 200 ? n : DEFAULT_NEARBY_RADIUS_KM;
}

export function validateRadiusInput(input) {
    const n = Number(input);
    if (input === null || input === '' || typeof input === 'boolean' || !Number.isFinite(n) || n < 1 || n > 200) {
        throw new ValidationError('Nearby store radius must be a number from 1 to 200 km');
    }
    return Math.round(n * 10) / 10;
}

export async function saveNearbyRadiusKm(input) {
    const km = validateRadiusInput(input);
    await HomePage.findOneAndUpdate({}, { $set: { nearbyStoreRadiusKm: km } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return km;
}
