import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getDraftContent, getLiveContent, getDraftGift, getLiveGift, DAY_KEYS } from "@/lib/store";

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [draft, live, draftGift, liveGift] = await Promise.all([
    getDraftContent(),
    getLiveContent(),
    getDraftGift(),
    getLiveGift(),
  ]);
  return NextResponse.json({ draft, live, draftGift, liveGift, days: DAY_KEYS });
}
