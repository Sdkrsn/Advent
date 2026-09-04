import { NextResponse } from "next/server";
import { getLiveGift } from "@/lib/store";
import { getTodayState } from "@/lib/time";
import { giftStore } from "@/lib/blobStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const { unlocked, isSunday } = getTodayState();
  if (!unlocked || !isSunday) {
    return NextResponse.json({ error: "Not available yet" }, { status: 403 });
  }

  const gift = await getLiveGift();
  if (!gift || !gift.storageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const store = giftStore();
  const data = await store.get(gift.storageKey, { type: "arrayBuffer" });
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": gift.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${gift.fileName || "gift"}"`,
      "Cache-Control": "no-store",
    },
  });
}
