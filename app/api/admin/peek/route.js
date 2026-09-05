import { NextResponse } from "next/server";
import { getDraftEntry, getLiveEntry } from "@/lib/store";
import { isSundayDate } from "@/lib/time";

function present(entry, date, password) {
  if (!entry) return null;
  if (entry.kind === "gift") {
    return {
      kind: "gift",
      giftType: entry.giftType,
      text: entry.text,
      fileName: entry.fileName,
      url: entry.storageKey ? `/api/gift-file?date=${date}&pw=${encodeURIComponent(password)}` : null,
    };
  }
  return { kind: "message", text: entry.text };
}

export async function POST(req) {
  const { date, password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const [draft, live] = await Promise.all([getDraftEntry(date), getLiveEntry(date)]);

  return NextResponse.json({
    date,
    isSunday: isSundayDate(date),
    isLive: !!live,
    live: present(live, date, password),
    draft: present(draft, date, password),
  });
}
