import { NextResponse } from "next/server";
import { getLiveEntry } from "@/lib/store";
import { isDateUnlocked } from "@/lib/time";
import { giftStore } from "@/lib/blobStore";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const pw = searchParams.get("pw");
  const adminBypass = !!pw && !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
  if (!date || (!adminBypass && !isDateUnlocked(date))) {
    return NextResponse.json({ error: "Not available yet" }, { status: 403 });
  }

  const entry = await getLiveEntry(date);
  if (!entry || entry.kind !== "gift" || !entry.storageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const store = giftStore();
  const data = await store.get(entry.storageKey, { type: "arrayBuffer" });
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(data, {
    headers: {
      "Content-Type": entry.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${entry.fileName || "gift"}"`,
      "Cache-Control": "no-store",
    },
  });
}
