import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { saveDraftContent, publishContent } from "@/lib/store";

export async function POST(req) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { messages, publish } = body;

  let draft;
  if (messages) {
    draft = await saveDraftContent(messages);
  }
  let live = null;
  if (publish) {
    live = await publishContent();
  }
  return NextResponse.json({ ok: true, draft, live });
}
