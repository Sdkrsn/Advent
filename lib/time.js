// Timezone the unlock schedule runs on. Change if you two aren't in this timezone.
export const TIMEZONE = "Asia/Kolkata";
export const UNLOCK_HOUR = 19; // 7 PM

export const START_DATE = "2026-09-05";
export const EXAM_DATE = "2026-12-14";

const WEEKDAY_MAP = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };

function partsFor(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return map;
}

export function nowInTz() {
  const map = partsFor(new Date());
  return {
    dayKey: WEEKDAY_MAP[map.weekday],
    hour: parseInt(map.hour, 10),
    dateStr: `${map.year}-${map.month}-${map.day}`,
  };
}

// weekday key (mon..sun) for an arbitrary YYYY-MM-DD, independent of viewer's timezone
export function weekdayKeyForDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const map = partsFor(utcNoon);
  return WEEKDAY_MAP[map.weekday];
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
