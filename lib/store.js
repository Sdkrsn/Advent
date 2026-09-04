import { Redis } from "@upstash/redis";

let redis = null;
function getRedis() {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_MESSAGES = {
  mon: "Morning bubs, new week but same you I'm hyping up. You got this, and your man's right here cheering you on.",
  tue: "Hey bubs, you don't gotta have it all figured out today. Just take the next step, I'm proud of you already.",
  wed: "Halfway there bubs, and you're still going strong. That's huge. Keep goin, your man's got you.",
  thu: "Some days hit different bubs, and that's okay. Slow is still moving. I'm proud of you regardless.",
  fri: "Look how far you've come this week bubs. Every bit of effort counted, even the small stuff. Proud of you.",
  sat: "Rest today bubs, you earned it. You're more than what you get done, and I love you just as you are.",
};

const DRAFT_KEY = "content:draft";
const LIVE_KEY = "content:live";
const GIFT_KEY = "gift:live";
const GIFT_DRAFT_KEY = "gift:draft";
const OPENED_KEY_PREFIX = "opened:"; // not used server-side yet, reserved

function defaultContent() {
  return { ...DEFAULT_MESSAGES };
}

export async function getLiveContent() {
  const r = getRedis();
  const data = await r.get(LIVE_KEY);
  if (!data) {
    const def = defaultContent();
    await r.set(LIVE_KEY, def);
    await r.set(DRAFT_KEY, def);
    return def;
  }
  return data;
}

export async function getDraftContent() {
  const r = getRedis();
  const data = await r.get(DRAFT_KEY);
  if (!data) {
    const live = await getLiveContent();
    await r.set(DRAFT_KEY, live);
    return live;
  }
  return data;
}

export async function saveDraftContent(partial) {
  const r = getRedis();
  const current = await getDraftContent();
  const updated = { ...current, ...partial };
  await r.set(DRAFT_KEY, updated);
  return updated;
}

export async function publishContent() {
  const r = getRedis();
  const draft = await getDraftContent();
  await r.set(LIVE_KEY, draft);
  return draft;
}

// Gift: { type: 'text'|'image'|'audio'|'video'|'pdf', text: string|null, storageKey: string|null, fileName: string|null, contentType: string|null }
export async function getLiveGift() {
  const r = getRedis();
  const data = await r.get(GIFT_KEY);
  return data || null;
}

export async function getDraftGift() {
  const r = getRedis();
  const data = await r.get(GIFT_DRAFT_KEY);
  return data || null;
}

export async function saveDraftGift(gift) {
  const r = getRedis();
  await r.set(GIFT_DRAFT_KEY, gift);
  return gift;
}

export async function publishGift() {
  const r = getRedis();
  const draft = await getDraftGift();
  await r.set(GIFT_KEY, draft);
  return draft;
}

export { DAY_KEYS };
