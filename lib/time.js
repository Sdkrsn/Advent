// Timezone the unlock schedule runs on. Change if you two aren't in this timezone.
export const TIMEZONE = "Asia/Kolkata";
export const UNLOCK_HOUR = 19; // 7 PM

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function nowInTz() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  const weekdayMap = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };
  return {
    dayKey: weekdayMap[map.weekday],
    hour: parseInt(map.hour, 10),
    dateStr: `${map.year}-${map.month}-${map.day}`,
  };
}

// Returns { dayKey, unlocked, isSunday, dateStr }
// dayKey is today's weekday key (mon..sun). unlocked = true once past UNLOCK_HOUR local time.
export function getTodayState() {
  const { dayKey, hour, dateStr } = nowInTz();
  const unlocked = hour >= UNLOCK_HOUR;
  return {
    dayKey,
    unlocked,
    isSunday: dayKey === "sun",
    dateStr,
  };
}
