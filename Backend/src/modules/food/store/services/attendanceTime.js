// Clock and date helpers for shifts and attendance. Everything is in the server's local time, the same as the dashboards.

const pad = (n) => String(n).padStart(2, '0');

/** "9:00 AM", "09:00", "9:30 pm", "21:30" -> minutes after midnight, or null. */
export function parseClock(text) {
    const m = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/.exec(String(text ?? '').trim());
    if (!m) return null;
    let h = Number(m[1]); const min = Number(m[2]);
    if (min > 59) return null;
    if (m[3]) {
        if (h < 1 || h > 12) return null;
        h = (h % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0);
    } else if (h > 23) return null;
    return h * 60 + min;
}

/** minutes after midnight -> "09:00 AM" */
export function formatClock(minutes) {
    const h = Math.floor(minutes / 60); const m = minutes % 60;
    return `${pad(((h + 11) % 12) + 1)}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Date -> "08:52 AM" (server local time), '' for no date */
export const clockOf = (date) => (date ? formatClock(date.getHours() * 60 + date.getMinutes()) : '');

/** Date -> "2026-06-25" (server local day) */
export const dateKeyOf = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-06-25" + minutes after midnight -> Date */
export function atClock(key, minutes) {
    const [y, mo, d] = key.split('-').map(Number);
    return new Date(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
export const hoursBetween = (from, to) => Math.max(0, round2((to.getTime() - from.getTime()) / 3600000));

/** Hours a shift is scheduled for (overnight shifts wrap past midnight). 0 when start and end are equal. */
export const scheduledHours = (shift) => {
    if (!shift) return 0;
    const span = (shift.endMinutes - shift.startMinutes + 1440) % 1440;
    return span / 60;
};

export const LATE_GRACE_MINUTES = 10;
const LATE_WINDOW_MINUTES = 6 * 60;   // arriving more than 6 hours after a start is a different shift, not "late"

/**
 * Minutes late for a clock-in against a shift, 0 when on time (or within the grace period). The start that counts is the
 * one nearest to the clock-in, so a 11 PM night shift started at 12:30 AM is measured against 11 PM the evening before.
 */
export function minutesLate(clockIn, shift) {
    if (!shift) return 0;
    const day = dateKeyOf(clockIn);
    let best = null;
    for (const offset of [-1, 0, 1]) {
        const start = atClock(day, shift.startMinutes);
        start.setDate(start.getDate() + offset);
        if (best === null || Math.abs(clockIn - start) < Math.abs(clockIn - best)) best = start;
    }
    const diff = Math.round((clockIn.getTime() - best.getTime()) / 60000);
    return diff > LATE_GRACE_MINUTES && diff <= LATE_WINDOW_MINUTES ? diff : 0;
}
