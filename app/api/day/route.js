import { NextResponse } from "next/server";
import { getLiveEntry } from "@/lib/store";
import { isDateUnlocked, isSundayDate, nowInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || nowInTz().dateStr;

  if (!isDateUnlocked(date)) {
    return NextResponse.json({ ready: false, isSunday: isSundayDate(date), date });
  }

  const entry = await getLiveEntry(date);
  if (!entry) {
    return NextResponse.json({ ready: false, isSunday: isSundayDate(date), date });
  }

  if (entry.kind === "gift") {
    const safeGift = {
      giftType: entry.giftType,
      text: entry.text,
      fileName: entry.fileName,
      url: entry.storageKey ? `/api/gift-file?date=${date}` : null,
    };
    return NextResponse.json({ ready: true, isSunday: true, date, gift: safeGift });
  }

  return NextResponse.json({ ready: !!entry.text, isSunday: false, date, message: entry.text });
}
