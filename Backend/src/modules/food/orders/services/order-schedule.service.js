import { ValidationError } from '../../../../core/auth/errors.js';
import { hoursByStore, isOpenAt, ymd } from '../../franchise/services/storeHours.js';

// Delivery slots for "Order for later" and the matching check when such an order is placed. Server local time,
// like the store hours. A slot is deliverable when the store is open for the whole prep window before it.
export const SCHEDULE = {
  days: 7, // today + 6
  stepMinutes: 30,
  leadMinutes: 45, // the earliest slot shown is at least this far ahead
  graceMinutes: 20, // what placement accepts, so a slot picked a few minutes ago still goes through
  prepMinutes: 30,
};

const MINUTE = 60 * 1000;

export function isDeliverableAt(hoursDoc, at) {
  const t = at.getTime();
  return isOpenAt(hoursDoc, new Date(t - SCHEDULE.prepMinutes * MINUTE)) && isOpenAt(hoursDoc, new Date(t - MINUTE));
}

/** The slots of each day from today: [{ date: 'YYYY-MM-DD', slots: [{ at: ISO, time: 'HH:MM' }] }]. */
export async function buildSlots(storeId, now = new Date()) {
  const hours = (await hoursByStore([storeId])).get(String(storeId));
  const earliest = now.getTime() + SCHEDULE.leadMinutes * MINUTE;
  const days = [];
  for (let d = 0; d < SCHEDULE.days; d += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const slots = [];
    for (let m = SCHEDULE.stepMinutes; m <= 24 * 60; m += SCHEDULE.stepMinutes) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, m);
      if (at.getTime() < earliest || !isDeliverableAt(hours, at)) continue;
      slots.push({ at: at.toISOString(), time: `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}` });
    }
    days.push({ date: ymd(day), slots });
  }
  return days;
}

/** Throws a 400 unless `at` is a time the store can deliver a scheduled order. */
export async function assertSchedulable(storeId, at, now = new Date()) {
  const t = at.getTime();
  if (Number.isNaN(t)) throw new ValidationError('Invalid delivery time');
  if (t < now.getTime() + SCHEDULE.graceMinutes * MINUTE) {
    throw new ValidationError('That delivery time has passed or is too soon. Please pick a later slot.');
  }
  if (t > now.getTime() + SCHEDULE.days * 24 * 60 * MINUTE) {
    throw new ValidationError(`Orders can be scheduled up to ${SCHEDULE.days} days ahead.`);
  }
  const hours = (await hoursByStore([storeId])).get(String(storeId));
  if (!isDeliverableAt(hours, at)) {
    throw new ValidationError('The store is closed at that time. Please pick another slot.');
  }
}
