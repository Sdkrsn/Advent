// Timezone the unlock schedule runs on. Change if you two aren't in this timezone.
export const TIMEZONE = "Asia/Kolkata";
export const UNLOCK_HOUR = 19; // 7 PM

export const START_DATE = "2026-09-04";
export const EXAM_DATE = "2026-12-14";

const WEEKDAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// India Standard Time is a fixed UTC+5:30 offset with no DST, so we compute it
// directly instead of going through Intl/IANA tz data — some minimal Node
// builds ship without full ICU timezone data and silently fall back to UTC,
// which made the 7pm unlock never fire correctly.
const IST_OFFSET_MIN = 5 * 60 + 30;

function istPartsFromUtc(date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MIN * 60000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    weekday: WEEKDAY_MAP[shifted.getUTCDay()],
  };
}

export function nowInTz() {
  const p = istPartsFromUtc(new Date());
  return {
    dayKey: p.weekday,
    hour: p.hour,
    dateStr: `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`,
  };
}

// weekday key (mon..sun) for an arbitrary YYYY-MM-DD, independent of viewer's timezone
export function weekdayKeyForDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return istPartsFromUtc(utcNoon).weekday;
}

export function isSundayDate(dateStr) {
  return weekdayKeyForDate(dateStr) === "sun";
}

// A date is unlocked once it's fully in the past, or it's today and past the unlock hour.
export function isDateUnlocked(dateStr) {
  const { dateStr: todayStr, hour } = nowInTz();
  if (dateStr < todayStr) return true;
  if (dateStr === todayStr) return hour >= UNLOCK_HOUR;
  return false;
}

export function addDaysToDateStr(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function dateStrRange(startStr, endStr) {
  const out = [];
  let cur = startStr;
  while (cur <= endStr) {
    out.push(cur);
    cur = addDaysToDateStr(cur, 1);
  }
  return out;
}
