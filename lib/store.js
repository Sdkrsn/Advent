import { Redis } from "@upstash/redis";
import { weekdayKeyForDate, isSundayDate } from "./time";

let redis = null;
function getRedis() {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

const DATE_OVERRIDES = {
  "2026-09-04": { kind: "message", text: "I love you bubs this is for you" },
};

const DEFAULT_MESSAGES = {
  mon: "Morning bubs, new week but same you I'm hyping up. You got this, and your man's right here cheering you on.",
  tue: "Hey bubs, you don't gotta have it all figured out today. Just take the next step, I'm proud of you already.",
  wed: "Halfway there bubs, and you're still going strong. That's huge. Keep goin, your man's got you.",
  thu: "Some days hit different bubs, and that's okay. Slow is still moving. I'm proud of you regardless.",
  fri: "Look how far you've come this week bubs. Every bit of effort counted, even the small stuff. Proud of you.",
  sat: "Rest today bubs, you earned it. You're more than what you get done, and I love you just as you are.",
};

function liveKey(dateStr) {
  return `entry:${dateStr}`;
}
function draftKey(dateStr) {
  return `entry-draft:${dateStr}`;
}

// Entry shape: { kind: 'message'|'gift', text, giftType, storageKey, fileName, contentType }

export async function getLiveEntry(dateStr) {
  if (DATE_OVERRIDES[dateStr]) return DATE_OVERRIDES[dateStr];
  const r = getRedis();
  const data = await r.get(liveKey(dateStr));
  if (data) return data;
  if (isSundayDate(dateStr)) return null;
  const weekday = weekdayKeyForDate(dateStr);
  return { kind: "message", text: DEFAULT_MESSAGES[weekday] || null };
}

export async function getDraftEntry(dateStr) {
  const r = getRedis();
  const data = await r.get(draftKey(dateStr));
  if (data) return data;
  return getLiveEntry(dateStr);
}

export async function saveDraftEntry(dateStr, entry) {
  const r = getRedis();
  await r.set(draftKey(dateStr), entry);
  return entry;
}

export async function publishEntry(dateStr) {
  const r = getRedis();
  const draft = await getDraftEntry(dateStr);
  await r.set(liveKey(dateStr), draft);
  return draft;
}

export { DEFAULT_MESSAGES };
