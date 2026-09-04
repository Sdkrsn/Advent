import { NextResponse } from "next/server";
import { getLiveContent, getLiveGift } from "@/lib/store";
import { getTodayState } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const { dayKey, unlocked, isSunday } = getTodayState();

  if (!unlocked) {
    return NextResponse.json({ ready: false, isSunday });
  }

  if (isSunday) {
    const gift = await getLiveGift();
    if (!gift) {
      return NextResponse.json({ ready: false, isSunday: true });
    }
    const safeGift = {
      type: gift.type,
      text: gift.text,
      fileName: gift.fileName,
      url: gift.storageKey ? "/api/gift-file" : null,
    };
    return NextResponse.json({ ready: true, isSunday: true, gift: safeGift });
  }

  const content = await getLiveContent();
  const message = content[dayKey] || null;
  return NextResponse.json({ ready: !!message, isSunday: false, message, dayKey });
}
