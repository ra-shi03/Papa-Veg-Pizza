import { FoodStore } from '../../store/models/store.model.js';
import { StoreHours } from '../models/storeHours.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { accessOf, scopedStores, scopedStore, scopedStoreList, storeStatus } from './storeAccess.js';
import { WEEK, ymd, to24, to12, toDay, isOpenAt, closureCovers, hoursByStore } from './storeHours.js';
import {
  validateWeekDto, validateHolidaysDto, validateCopyHoursDto, validateBulkHoursDto, validateStoreHoursDto, validateStoreStatusDto,
} from '../validators/storeOps.validator.js';

// Operating Hours screen (/v1/operating-hours/*) and the store list's hours / status actions (/v1/stores/:id/hours,
// /v1/stores/:id/status). Franchise admin: its own stores, read and write. Store manager: its own store, read only.

const AUDIT_CAP = 50;
const ALL_DAY = { open: '00:00', close: '00:00', isClosed: false };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isAll = (v) => !v || v === 'All' || v === 'all';

const orderable = (store) => store.approvalStatus === 'Approved' && store.isActive !== false;
const openNow = (store, doc, now = new Date()) => orderable(store) && isOpenAt(doc, now);

/** The store's hours record (a new, unsaved one when it has none yet). */
async function hoursDoc(store) {
  return (await StoreHours.findOne({ storeId: store._id }))
    || new StoreHours({ storeId: store._id, franchiseId: store.franchiseId, week: Object.fromEntries(WEEK.map((d) => [d, { ...ALL_DAY }])) });
}

function audit(doc, access, action, remarks) {
  doc.auditLogs.unshift({ updatedBy: access.actor, action, date: new Date(), remarks });
  doc.auditLogs = doc.auditLogs.slice(0, AUDIT_CAP);
  doc.updatedBy = access.actor;
}

const dayIn = (v, current = ALL_DAY, label = 'day') => {
  const isClosed = v.isClosed ?? current.isClosed ?? false;
  return {
    open: v.open !== undefined && v.open !== '' ? to24(v.open, `${label} opening time`) : current.open || '00:00',
    close: v.close !== undefined && v.close !== '' ? to24(v.close, `${label} closing time`) : current.close || '00:00',
    isClosed,
  };
};
const dayOut = (d) => ({ open: to12(d?.open || '00:00'), close: to12(d?.close || '00:00'), isClosed: !!d?.isClosed });

/** The schedule as the Operating Hours screens read it. */
function toSchedule(store, doc, now = new Date()) {
  return {
    _id: String(doc?._id || store._id),
    storeId: String(store._id),
    ...Object.fromEntries(WEEK.map((d) => [d, dayOut(doc?.week?.[d] || ALL_DAY)])),
    holidaySchedule: (doc?.holidays || []).map((h) => ({
      date: h.date, reason: h.reason, isClosed: h.isClosed, ...(h.isClosed ? {} : { open: to12(h.open || '00:00'), close: to12(h.close || '00:00') }),
    })),
    temporaryClosure: doc?.closure?.active
      ? { reason: doc.closure.reason, startDate: doc.closure.startDate, endDate: doc.closure.endDate, comments: doc.closure.comments }
      : null,
    auditLogs: (doc?.auditLogs || []).map((a) => ({ updatedBy: a.updatedBy, action: a.action, date: a.date, remarks: a.remarks })),
    updatedBy: doc?.updatedBy || 'System',
    updatedAt: doc?.updatedAt || store.createdAt,
    isOpen: openNow(store, doc, now),
  };
}

const is24x7 = (doc) => !doc || WEEK.every((d) => {
  const day = doc.week?.[d];
  return !day || (!day.isClosed && day.open === day.close);
});

async function rows(access, q) {
  const stores = await scopedStores(access);
  const docs = await hoursByStore(stores.map((s) => s._id));
  const now = new Date();
  return stores.map((s) => {
    const doc = docs.get(String(s._id));
    return {
      _id: String(doc?._id || s._id),
      storeId: String(s._id),
      storeName: s.storeName,
      storeCode: s.code,
      status: storeStatus(s, closureCovers(doc?.closure, now)),
      isOpen: openNow(s, doc, now),
      storeType: s.storeType,
      city: s.city || '',
      schedule: toSchedule(s, doc, now),
      lastUpdated: doc?.updatedAt || s.createdAt,
    };
  }).filter((r) => {
    if (q.search) {
      const needle = String(q.search).trim().toLowerCase();
      if (![r.storeName, r.storeCode, r.city].some((v) => String(v || '').toLowerCase().includes(needle))) return false;
    }
    if (!isAll(q.status) && (q.status === 'Open') !== r.isOpen) return false;
    if (!isAll(q.type) && r.storeType !== q.type) return false;
    if (!isAll(q.city) && r.city.toLowerCase() !== String(q.city).toLowerCase()) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------------------------
// /v1/operating-hours
// ---------------------------------------------------------------------------------------------

export async function dashboard(user, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const stores = await scopedStores(access);
  const docs = await hoursByStore(stores.map((s) => s._id));
  const now = new Date();
  const today = ymd(now);
  const all = stores.map((s) => ({ s, doc: docs.get(String(s._id)) }));
  const open = all.filter(({ s, doc }) => openNow(s, doc, now)).length;
  const upcoming = (doc) => (doc?.holidays || []).filter((h) => h.date >= today);
  return {
    storesOpenNow: open,
    storesClosed: stores.length - open,
    stores24x7: all.filter(({ doc }) => is24x7(doc)).length,
    holidayClosures: all.reduce((n, { doc }) => n + upcoming(doc).filter((h) => h.isClosed).length, 0),
    upcomingChanges: all.reduce((n, { doc }) => n + upcoming(doc).filter((h) => !h.isClosed).length
      + (doc?.closure?.active && doc.closure.startDate > today ? 1 : 0), 0),
  };
}

export async function list(user, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const list = await rows(access, q);
  const key = ['storeName', 'storeCode', 'city', 'status', 'storeType', 'lastUpdated', 'isOpen'].includes(q.sort) ? q.sort : 'storeName';
  const dir = q.order === 'desc' ? -1 : 1;
  list.sort((a, b) => {
    const x = a[key] instanceof Date ? a[key].getTime() : a[key];
    const y = b[key] instanceof Date ? b[key].getTime() : b[key];
    return (typeof x === 'string' ? String(x).localeCompare(String(y)) : Number(x) - Number(y)) * dir;
  });
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  return { list: list.slice((page - 1) * limit, page * limit), totalCount: list.length, page, limit };
}

export async function getSchedule(user, storeId, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const store = await scopedStore(access, storeId);
  return toSchedule(store, await StoreHours.findOne({ storeId: store._id }).lean());
}

export async function updateWeek(user, storeId, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const store = await scopedStore(access, storeId);
  const dto = validateWeekDto(body);
  const days = WEEK.filter((d) => dto[d]);
  if (!days.length) throw new ValidationError('Send at least one day');
  const doc = await hoursDoc(store);
  for (const d of days) doc.week[d] = dayIn(dto[d], doc.week[d], cap(d));
  audit(doc, access, 'Updated Weekly Hours', `Updated ${days.map(cap).join(', ')}`);
  await doc.save();
  return toSchedule(store, doc.toObject());
}

export async function updateHolidays(user, storeId, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const store = await scopedStore(access, storeId);
  const { holidaySchedule } = validateHolidaysDto(body);
  const byDate = new Map();
  for (const h of holidaySchedule) {
    const date = toDay(h.date, 'holiday date');
    const hours = h.isClosed ? { open: '', close: '' } : dayIn({ open: h.open, close: h.close }, ALL_DAY, `${date}`);
    byDate.set(date, { date, reason: h.reason, isClosed: h.isClosed, open: hours.open, close: hours.close });
  }
  const doc = await hoursDoc(store);
  doc.holidays = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  audit(doc, access, 'Updated Holiday Schedule', `Updated holidays. Total defined: ${doc.holidays.length}`);
  await doc.save();
  return toSchedule(store, doc.toObject());
}

export async function copyWeek(user, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const dto = validateCopyHoursDto(body);
  const source = await scopedStore(access, dto.sourceStoreId);
  const dests = await scopedStoreList(access, dto.destStoreIds?.length ? dto.destStoreIds : [dto.destStoreId], '_id franchiseId storeName');
  if (dests.some((d) => String(d._id) === String(source._id))) throw new ValidationError('Choose a different store to copy to');
  const src = await StoreHours.findOne({ storeId: source._id }).lean();
  for (const dest of dests) {
    const doc = await hoursDoc(dest);
    for (const d of WEEK) doc.week[d] = { ...(src?.week?.[d] || ALL_DAY) };
    audit(doc, access, 'Copied Timings', `Copied schedule from ${source.storeName}`);
    await doc.save();
  }
  return { copiedTo: dests.length };
}

export async function bulkUpdate(user, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const dto = validateBulkHoursDto(body);
  const days = [...new Set(dto.weekdays.map((d) => String(d).trim().toLowerCase()))];
  const bad = days.find((d) => !WEEK.includes(d));
  if (bad) throw new ValidationError(`Unknown weekday "${bad}"`);
  const hours = dayIn({ open: dto.open, close: dto.close, isClosed: dto.isClosed });
  const stores = await scopedStoreList(access, dto.storeIds, '_id franchiseId storeName');
  for (const store of stores) {
    const doc = await hoursDoc(store);
    for (const d of days) doc.week[d] = { ...hours };
    audit(doc, access, 'Bulk Updated Timings', `Bulk updated days: ${days.map(cap).join(', ')}`);
    await doc.save();
  }
  return { updatedCount: stores.length };
}

export async function exportReport(user, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const list = await rows(access, q);
  const span = (d) => (d.isClosed ? 'Closed' : `${d.open} - ${d.close}`);
  return {
    fileName: `Operating_Hours_Report.${q.format === 'pdf' ? 'pdf' : q.format === 'excel' ? 'xlsx' : 'csv'}`,
    columns: ['storeCode', 'storeName', 'status', ...WEEK],
    rows: list.map((r) => ({ storeCode: r.storeCode, storeName: r.storeName, status: r.status, ...Object.fromEntries(WEEK.map((d) => [d, span(r.schedule[d])])) })),
  };
}

// ---------------------------------------------------------------------------------------------
// /v1/stores/:id/hours and /v1/stores/:id/status (store list: Hours modal, status and temporary closure)
// ---------------------------------------------------------------------------------------------

const asArray = (store, doc) => ({
  storeId: String(store._id),
  operatingHours: WEEK.map((d) => {
    const day = doc?.week?.[d] || ALL_DAY;
    return { day: cap(d), openTime: day.open, closeTime: day.close, isHoliday: !!day.isClosed };
  }),
  isOpen: openNow(store, doc),
});

export async function getStoreHours(user, storeId, q = {}) {
  const access = accessOf(user, q, { manager: true });
  const store = await scopedStore(access, storeId);
  return asArray(store, await StoreHours.findOne({ storeId: store._id }).lean());
}

/** The Hours modal also calls this with { hours: {} } just to load the hours: no days means nothing changes. */
export async function updateStoreHours(user, storeId, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const store = await scopedStore(access, storeId);
  const { hours } = validateStoreHoursDto(body);
  if (!Array.isArray(hours) || !hours.length) return asArray(store, await StoreHours.findOne({ storeId: store._id }).lean());
  const doc = await hoursDoc(store);
  const changed = [];
  for (const h of hours) {
    const d = String(h.day).trim().toLowerCase();
    if (!WEEK.includes(d)) throw new ValidationError(`Unknown weekday "${h.day}"`);
    doc.week[d] = dayIn({ open: h.openTime, close: h.closeTime, isClosed: h.isHoliday }, doc.week[d], cap(d));
    changed.push(cap(d));
  }
  audit(doc, access, 'Updated Weekly Hours', `Updated ${changed.join(', ')}`);
  await doc.save();
  return asArray(store, doc.toObject());
}

/** Active (reopen), Inactive (stop taking orders) or Closed (temporary closure, optionally dated). */
export async function updateStoreStatus(user, storeId, body = {}, q = {}) {
  const access = accessOf(user, q, { write: true });
  const store = await scopedStore(access, storeId);
  const dto = validateStoreStatusDto(body);
  const doc = await hoursDoc(store);
  const reason = dto.reason || '';
  if (dto.status === 'Closed') {
    const startDate = dto.startDate ? toDay(dto.startDate, 'start date') : ymd(new Date());
    const endDate = dto.endDate ? toDay(dto.endDate, 'end date') : '';
    if (endDate && endDate < startDate) throw new ValidationError('End date must be after the start date');
    doc.closure = { active: true, reason, startDate, endDate, comments: dto.comments || '', by: access.actor, at: new Date() };
    audit(doc, access, 'Status Changed / Temporary Closure', `Closed${endDate ? ` until ${endDate}` : ''}. Reason: ${reason || 'N/A'}`);
  } else {
    doc.closure = { active: false };
    await FoodStore.updateOne({ _id: store._id }, { $set: { isActive: dto.status === 'Active' } });
    store.isActive = dto.status === 'Active';
    audit(doc, access, 'Status Changed', `Status updated to ${dto.status}. Reason: ${reason || 'N/A'}`);
  }
  await doc.save();
  return { storeId: String(store._id), status: storeStatus(store, closureCovers(doc.closure)), isOpen: openNow(store, doc.toObject()) };
}
