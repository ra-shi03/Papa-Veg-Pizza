import { StoreHours } from '../models/storeHours.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// Open / closed rules shared by the Operating Hours screens and the customer side (store resolve, order placement).
// Server local time. A store without an hours record is always open.

export const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const JS_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const pad = (n) => String(n).padStart(2, '0');

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "09:00 AM", "9 pm", "21:00" -> "21:00". Throws a 400 for anything else. */
export function to24(value, label = 'time') {
  const m = String(value ?? '').trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!m) throw new ValidationError(`Invalid ${label} "${value}"`);
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  if (m[3]) {
    if (h < 1 || h > 12) throw new ValidationError(`Invalid ${label} "${value}"`);
    h = (h % 12) + (m[3] === 'PM' ? 12 : 0);
  }
  if (h > 23 || min > 59) throw new ValidationError(`Invalid ${label} "${value}"`);
  return `${pad(h)}:${pad(min)}`;
}

/** "21:00" -> "09:00 PM" (the Operating Hours screens' format). */
export const to12 = (hhmm = '00:00') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return `${pad(((h + 11) % 12) + 1)}:${pad(m || 0)} ${h < 12 ? 'AM' : 'PM'}`;
};

const minutesOf = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** YYYY-MM-DD from a date string the screens send, or a 400. */
export function toDay(value, label = 'date') {
  const s = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime())) return s;
  const d = new Date(s);
  if (!s || Number.isNaN(d.getTime())) throw new ValidationError(`Invalid ${label} "${value}"`);
  return ymd(d);
}

/** The hours that apply on a calendar date (a holiday overrides the weekday), or null when closed all day. */
/** The open / close window of a date (holiday first, then the weekday), or null when closed. */
export function windowOn(doc, date) {
  const holiday = (doc.holidays || []).find((h) => h.date === ymd(date));
  if (holiday) return holiday.isClosed ? null : { open: holiday.open || '00:00', close: holiday.close || '00:00' };
  const day = doc.week?.[JS_DAY[date.getDay()]];
  if (!day) return { open: '00:00', close: '00:00' };
  return day.isClosed ? null : { open: day.open, close: day.close };
}

/** Is a temporary closure in force on that date? */
export function closureCovers(closure, date = new Date()) {
  if (!closure?.active) return false;
  const day = ymd(date);
  if (closure.startDate && day < closure.startDate) return false;
  if (closure.endDate && day > closure.endDate) return false;
  return true;
}

export function isOpenAt(doc, now = new Date()) {
  if (!doc) return true;
  if (closureCovers(doc.closure, now)) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  const today = windowOn(doc, now);
  if (today) {
    const open = minutesOf(today.open);
    const close = minutesOf(today.close);
    if (open === close) return true; // all day
    if (close > open ? m >= open && m < close : m >= open) return true;
  }
  // yesterday's hours may run past midnight
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const prev = windowOn(doc, yesterday);
  if (prev) {
    const open = minutesOf(prev.open);
    const close = minutesOf(prev.close);
    if (close < open && m < close) return true;
  }
  return false;
}

/** Hours records of these stores, by store id. */
export async function hoursByStore(storeIds) {
  const docs = await StoreHours.find({ storeId: { $in: storeIds } }).lean();
  return new Map(docs.map((d) => [String(d.storeId), d]));
}

/** The ids (strings) of the stores that are open right now. */
export async function openStoreIds(storeIds, now = new Date()) {
  const docs = await hoursByStore(storeIds);
  return new Set(storeIds.map(String).filter((id) => isOpenAt(docs.get(id), now)));
}
