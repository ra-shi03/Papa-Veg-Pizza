import mongoose from 'mongoose';
import { HomePage } from '../models/homePage.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// Order methods: how a customer can order (delivery, takeaway, in-car, delivery on train). The super admin switches each
// one on or off and says where it is offered: every store, the stores of chosen franchises, or only chosen stores.
// Dine-in does not exist (there is no such flow).
export const ORDER_METHOD_IDS = ['delivery', 'takeaway', 'incar', 'train'];

export const DEFAULT_ORDER_METHODS = [
    { id: 'delivery', label: 'Delivery', icon: 'moped', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'takeaway', label: 'Takeaway', icon: 'store', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'incar', label: 'In-Car', icon: 'directions_car', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
    { id: 'train', label: 'Delivery on Train', icon: 'train', enabled: true, scope: 'all', franchiseIds: [], storeIds: [] },
];

const strs = (list) => (list || []).map(String);

/** The saved methods merged onto the four known ones, in a fixed order; unknown ids (dine-in) are dropped. */
export function normalizeMethods(saved) {
    const byId = new Map((Array.isArray(saved) ? saved : []).map((m) => [String(m?.id), m]));
    return DEFAULT_ORDER_METHODS.map((def) => {
        const m = byId.get(def.id);
        if (!m) return { ...def };
        const scope = ['all', 'franchises', 'stores'].includes(m.scope) ? m.scope : 'all';
        return {
            id: def.id,
            label: String(m.label || def.label),
            icon: m.icon || def.icon,
            enabled: m.enabled !== false,
            scope,
            franchiseIds: strs(m.franchiseIds),
            storeIds: strs(m.storeIds),
        };
    });
}

export async function loadMethods() {
    const doc = await HomePage.findOne().select('orderMethods').lean();
    return normalizeMethods(doc?.orderMethods);
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
    const id = ORDER_METHOD_IDS.includes(methodId) ? methodId : 'delivery';
    const method = (await loadMethods()).find((m) => m.id === id);
    if (!methodAllowedAt(method, store)) {
        throw new ValidationError(`${method?.label || 'This order method'} is not available at this store.`);
    }
    return id;
}

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;

/** Validates a super admin save: known ids, known scope, real franchises and stores, and a list for a limited scope. */
export async function validateMethodsInput(input) {
    if (!Array.isArray(input) || input.length === 0 || input.length > ORDER_METHOD_IDS.length) throw new ValidationError('Send the order methods as a list');
    const seen = new Set();
    const clean = [];
    for (const m of input) {
        const id = String(m?.id || '');
        if (!ORDER_METHOD_IDS.includes(id)) throw new ValidationError(`Unknown order method: ${id || '(empty)'}`);
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
            id, label: label || def.label, icon: def.icon, enabled: m?.enabled !== false, scope,
            franchiseIds: scope === 'franchises' ? franchiseIds : [],
            storeIds: scope === 'stores' ? storeIds : [],
        });
    }
    // every id must exist, so a stale or invented id cannot sit in the rules
    const franchiseIds = [...new Set(clean.flatMap((m) => m.franchiseIds))];
    const storeIds = [...new Set(clean.flatMap((m) => m.storeIds))];
    if (franchiseIds.length && (await FoodFranchise.countDocuments({ _id: { $in: franchiseIds } })) !== franchiseIds.length) throw new ValidationError('A chosen franchise does not exist');
    if (storeIds.length && (await FoodStore.countDocuments({ _id: { $in: storeIds } })) !== storeIds.length) throw new ValidationError('A chosen store does not exist');
    // methods not sent keep their current rule
    const current = await loadMethods();
    return ORDER_METHOD_IDS.map((id) => clean.find((m) => m.id === id) || current.find((m) => m.id === id));
}

export async function saveMethods(input) {
    const methods = await validateMethodsInput(input);
    await HomePage.findOneAndUpdate({}, { $set: { orderMethods: methods } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return normalizeMethods(methods);
}
