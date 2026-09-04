import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { saveDraftGift, publishGift } from "@/lib/store";
import { giftStore } from "@/lib/blobStore";

export async function POST(req) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  let gift;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const type = form.get("type"); // image | audio | video | pdf
    const caption = form.get("caption") || "";

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const storageKey = `gift-${Date.now()}`;
    const arrayBuffer = await file.arrayBuffer();
    const store = giftStore();
    await store.set(storageKey, arrayBuffer, {
      metadata: { contentType: file.type, fileName: file.name },
    });

    gift = {
      type,
      storageKey,
      fileName: file.name,
      contentType: file.type,
      text: caption || null,
    };
  } else {
    const body = await req.json();
    gift = {
      type: "text",
      storageKey: null,
      fileName: null,
      contentType: null,
      text: body.text || "",
    };
  }

  const draft = await saveDraftGift(gift);
  return NextResponse.json({ ok: true, draft });
}

export async function PUT() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const live = await publishGift();
  return NextResponse.json({ ok: true, live });
}
