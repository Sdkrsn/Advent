import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { getDraftEntry, getLiveEntry, saveDraftEntry, publishEntry } from "@/lib/store";
import { giftStore } from "@/lib/blobStore";
import { isSundayDate } from "@/lib/time";

export async function GET(req) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const [draft, live] = await Promise.all([getDraftEntry(date), getLiveEntry(date)]);
  return NextResponse.json({ date, isSunday: isSundayDate(date), draft, live });
}

export async function POST(req) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let date, entry;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    date = form.get("date");
    const file = form.get("file");
    const giftType = form.get("giftType");
    const caption = form.get("caption") || "";
    if (!date || !file) {
      return NextResponse.json({ error: "date and file required" }, { status: 400 });
    }

    const storageKey = `gift-${date}-${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();
    const store = giftStore();
    await store.set(storageKey, arrayBuffer, {
      metadata: { contentType: file.type, fileName: file.name },
    });

    entry = {
      kind: "gift",
      giftType,
      storageKey,
      fileName: file.name,
      contentType: file.type,
      text: caption || null,
    };
  } else {
    const body = await req.json();
    date = body.date;
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    if (isSundayDate(date) && body.giftType === "text") {
      entry = { kind: "gift", giftType: "text", text: body.text || "", storageKey: null, fileName: null, contentType: null };
    } else {
      entry = { kind: "message", text: body.text || "" };
    }
  }

  const draft = await saveDraftEntry(date, entry);
  return NextResponse.json({ ok: true, date, draft });
}

export async function PUT(req) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  const live = await publishEntry(date);
  return NextResponse.json({ ok: true, date, live });
}
