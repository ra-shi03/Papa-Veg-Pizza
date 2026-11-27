import { PosMenu } from '../models/posMenu.model.js';
import { PosSyncLog } from '../models/posSyncLog.model.js';
import { Product } from '../../admin/models/product.model.js';
import { Addon } from '../../admin/models/addon.model.js';
import { FoodCombo } from '../../admin/models/combo.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { managerStore, integrationOf, keysOf, serverConf } from './posIntegration.service.js';
import * as petpooja from './petpooja.adapter.js';

// A store's Pet Pooja menu and the item mapping (our product / size / combo / add-on -> Pet Pooja item / variation /
// add-on). Orders can only be saved in Pet Pooja with Pet Pooja's own item ids, so every item the store sells needs a
// mapping. The menu arrives by Push Menu (Pet Pooja calls us when the merchant changes it) or by Fetch Menu (the manager's
// "Fetch menu" button). Each time, items whose names match exactly are mapped on their own; the manager maps the rest.

const MAX_ENTRIES = 3000;
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const KEY_RE = /^(addon:)?[a-f0-9]{24}(\|[^.$|]{1,60})?$/;
const VALUE_RE = /^[\w-]{1,40}(\|[\w-]{1,40})?$/;

/** What sending an order needs from the store's last menu: variation names, add-on group names, taxes. */
export async function menuIndexFor(storeId) {
  const m = await PosMenu.findOne({ storeId, provider: petpooja.PROVIDER }).select('items.variations.id items.variations.name addonGroups.id addonGroups.name taxes').lean();
  return {
    variations: new Map((m?.items || []).flatMap((i) => (i.variations || []).map((v) => [v.id, v.name]))),
    addonGroups: new Map((m?.addonGroups || []).map((g) => [g.id, g.name])),
    taxes: m?.taxes || [],
  };
}

/** Everything the store sells that can be mapped: one row per product size (or the product), per combo, per add-on. */
async function catalogRows() {
  const [products, combos, addons] = await Promise.all([
    Product.find({ status: 'Active' }).select('name sizes').sort({ name: 1 }).lean(),
    FoodCombo.find({ status: 'active' }).select('name').sort({ name: 1 }).lean(),
    Addon.find({ status: { $ne: 'Inactive' } }).select('name type').sort({ name: 1 }).lean(),
  ]);
  const rows = [];
  for (const p of products) {
    const sizes = (p.sizes || []).filter((s) => s?.size);
    if (!sizes.length) rows.push({ key: petpooja.itemKey(p._id), kind: 'product', name: p.name, size: '' });
    for (const s of sizes) rows.push({ key: petpooja.itemKey(p._id, s.size), kind: 'product', name: p.name, size: s.size });
  }
  for (const c of combos) rows.push({ key: petpooja.itemKey(c._id), kind: 'combo', name: c.name, size: '' });
  for (const a of addons) rows.push({ key: petpooja.addonKey(a._id), kind: 'addon', name: a.name, size: a.type || '' });
  return rows;
}

/** Pet Pooja's side as choices: items (or item + variation) and add-on items (with their group). */
function menuOptions(menu) {
  const options = [];
  for (const i of menu?.items || []) {
    if (!i.variations?.length) options.push({ value: i.id, label: i.name, kind: 'item', name: i.name, variation: '', active: i.active !== false });
    for (const v of i.variations || []) {
      options.push({ value: `${i.id}|${v.id}`, label: `${i.name} — ${v.name}`, kind: 'item', name: i.name, variation: v.name, active: i.active !== false && v.active !== false });
    }
  }
  for (const g of menu?.addonGroups || []) {
    for (const a of g.items || []) {
      options.push({ value: `${a.id}|${g.id}`, label: `${a.name} (${g.name})`, kind: 'addon', name: a.name, variation: '', active: a.active !== false });
    }
  }
  return options;
}

/** Exact-name matches for rows that have no mapping yet. -> number of rows mapped. Never changes an existing mapping. */
function autoMapInto(doc, rows, options) {
  const items = options.filter((o) => o.kind === 'item');
  const addons = options.filter((o) => o.kind === 'addon');
  let added = 0;
  for (const r of rows) {
    if (doc.itemMap.get(r.key)) continue;
    let hit;
    if (r.kind === 'addon') hit = addons.find((o) => norm(o.name) === norm(r.name));
    else if (r.size) {
      hit = items.find((o) => norm(o.name) === norm(r.name) && norm(o.variation) === norm(r.size))
        || items.find((o) => !o.variation && [`${r.name} ${r.size}`, `${r.size} ${r.name}`].map(norm).includes(norm(o.name)));
    } else hit = items.find((o) => !o.variation && norm(o.name) === norm(r.name));
    if (hit) { doc.itemMap.set(r.key, hit.value); added += 1; }
  }
  return added;
}

/** Saves a parsed menu as the store's current one, then maps the exact-name matches. -> { items, addons, autoMapped } */
export async function storeMenu(integ, parsed, source) {
  await PosMenu.findOneAndUpdate(
    { storeId: integ.storeId, provider: petpooja.PROVIDER },
    { $set: { restaurantId: integ.restaurantId, restaurantName: parsed.restaurantName, source, receivedAt: new Date(), items: parsed.items, addonGroups: parsed.addonGroups, taxes: parsed.taxes } },
    { upsert: true },
  );
  const autoMapped = autoMapInto(integ, await catalogRows(), menuOptions(parsed));
  if (autoMapped) { integ.markModified('itemMap'); await integ.save(); }
  return { items: parsed.items.length, addons: parsed.addonGroups.reduce((n, g) => n + g.items.length, 0), autoMapped };
}

/** POST /food/store/pos/petpooja/menu/fetch : the manager's "Fetch menu". */
export async function fetchMenu(user) {
  const store = await managerStore(user);
  const integ = await integrationOf(store, { create: true });
  const keys = keysOf(integ);
  const missing = petpooja.missingSetup(keys);
  if (missing.length) throw new ValidationError(`Add the ${missing.join(', ')} first.`);
  const res = await petpooja.fetchMenu(keys, serverConf(integ));
  const log = (status, note) => PosSyncLog.create({ storeId: store._id, direction: 'out', action: 'menu_fetch', status, note: String(note).slice(0, 500), attempts: 1 });
  if (!res.ok) {
    await log(res.skipped ? 'skipped' : 'failed', res.message);
    throw new ValidationError(res.skipped ? 'Choose the Pet Pooja server (Staging or Production) first.' : `Pet Pooja: ${res.message}`);
  }
  const parsed = petpooja.parseMenu(res.data);
  if (!parsed.items.length) {
    await log('failed', 'Pet Pooja sent a menu with no items');
    throw new ValidationError('Pet Pooja sent a menu with no items for this outlet.');
  }
  const out = await storeMenu(integ, parsed, 'fetch');
  await log('sent', `Menu fetched: ${out.items} items, ${out.addons} add-ons; ${out.autoMapped} mapped by name`);
  return { ...out, ...(await menuView(store, integ)) };
}

async function menuView(store, integ) {
  const [menu, rows] = await Promise.all([PosMenu.findOne({ storeId: store._id, provider: petpooja.PROVIDER }).lean(), catalogRows()]);
  const options = menuOptions(menu);
  const byValue = new Map(options.map((o) => [o.value, o]));
  const out = rows.map((r) => {
    const value = integ.itemMap?.get(r.key) || '';
    const opt = value ? byValue.get(value) : null;
    return { ...r, value, valueLabel: opt?.label || '', status: !value ? 'unmapped' : (menu && !opt ? 'missing' : 'mapped') };
  });
  const count = (s) => out.filter((r) => r.status === s).length;
  return {
    menu: menu ? {
      source: menu.source, receivedAt: menu.receivedAt, restaurantName: menu.restaurantName || '',
      items: menu.items.length, addons: menu.addonGroups.reduce((n, g) => n + g.items.length, 0), taxes: menu.taxes,
    } : null,
    rows: out,
    options,
    stats: { total: out.length, mapped: count('mapped'), unmapped: count('unmapped'), missing: count('missing') },
  };
}

/** GET /food/store/pos/petpooja/menu : the mapping screen. */
export async function getMenu(user) {
  const store = await managerStore(user);
  return menuView(store, await integrationOf(store, { create: true }));
}

/** PUT /food/store/pos/petpooja/mapping { entries: [{ key, value }] } : value '' removes a mapping. */
export async function saveMapping(user, entries = []) {
  const store = await managerStore(user);
  const integ = await integrationOf(store, { create: true });
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) throw new ValidationError(`entries: up to ${MAX_ENTRIES}.`);
  const menu = await PosMenu.findOne({ storeId: store._id, provider: petpooja.PROVIDER }).lean();
  const known = menu ? new Map(menuOptions(menu).map((o) => [o.value, o.kind])) : null;
  for (const e of entries) {
    const key = String(e?.key || '');
    const value = String(e?.value || '').trim();
    if (!KEY_RE.test(key)) throw new ValidationError(`Unknown item: ${key.slice(0, 60)}`);
    if (!value) { integ.itemMap.delete(key); continue; }
    if (!VALUE_RE.test(value) || (known && !known.has(value))) throw new ValidationError(`Not an item of this store's Pet Pooja menu: ${value.slice(0, 60)}`);
    const isAddon = key.startsWith('addon:');
    if (known && (known.get(value) === 'addon') !== isAddon) {
      throw new ValidationError(isAddon ? 'An add-on must be mapped to a Pet Pooja add-on.' : 'An item must be mapped to a Pet Pooja item.');
    }
    integ.itemMap.set(key, value);
  }
  integ.markModified('itemMap');
  await integ.save();
  return menuView(store, integ);
}

/** POST /food/store/pos/petpooja/menu/auto-map : maps the exact-name matches again (only rows without a mapping). */
export async function autoMap(user) {
  const store = await managerStore(user);
  const integ = await integrationOf(store, { create: true });
  const menu = await PosMenu.findOne({ storeId: store._id, provider: petpooja.PROVIDER }).lean();
  if (!menu) throw new ValidationError('Fetch the Pet Pooja menu first.');
  const autoMapped = autoMapInto(integ, await catalogRows(), menuOptions(menu));
  if (autoMapped) { integ.markModified('itemMap'); await integ.save(); }
  return { autoMapped, ...(await menuView(store, integ)) };
}
