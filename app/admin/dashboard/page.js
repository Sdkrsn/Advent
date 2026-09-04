"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { nowInTz, isSundayDate, addDaysToDateStr } from "@/lib/time";

export default function Dashboard() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [entryData, setEntryData] = useState(null);
  const [text, setText] = useState("");
  const [giftType, setGiftType] = useState("text");
  const [giftCaption, setGiftCaption] = useState("");
  const [giftFile, setGiftFile] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const today = nowInTz().dateStr;
    setDate(today);
  }, []);

  async function load(d) {
    const res = await fetch(`/api/admin/entry?date=${d}`);
    if (res.status === 401) {
      router.push("/admin");
      return;
    }
    const json = await res.json();
    setEntryData(json);
    if (json.draft) {
      if (json.draft.kind === "gift") {
        setGiftType(json.draft.giftType || "text");
        setGiftCaption(json.draft.text || "");
      } else {
        setText(json.draft.text || "");
      }
    } else {
      setText("");
    }
  }

  useEffect(() => {
    if (date) load(date);
  }, [date]);

  async function saveDraft() {
    setStatus("saving...");
    if (isSundayDate(date) && giftType !== "text-msg-fallback") {
      // handled by gift save
    }
    await fetch("/api/admin/entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, text }),
    });
    setStatus("draft saved");
    setTimeout(() => setStatus(""), 1500);
    load(date);
  }

  async function saveGiftDraft() {
    setStatus("saving gift...");
    if (giftType === "text") {
      await fetch("/api/admin/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, giftType: "text", text: giftCaption }),
      });
    } else {
      if (!giftFile) {
        setStatus("pick a file first");
        return;
      }
      const form = new FormData();
      form.append("date", date);
      form.append("file", giftFile);
      form.append("giftType", giftType);
      form.append("caption", giftCaption);
      await fetch("/api/admin/entry", { method: "POST", body: form });
    }
    setStatus("gift draft saved (not live yet)");
    setTimeout(() => setStatus(""), 2000);
    load(date);
  }

  async function publish() {
    setStatus("publishing...");
    await fetch("/api/admin/entry", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    setStatus("live for her now");
    setTimeout(() => setStatus(""), 2000);
    load(date);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  if (!date || !entryData) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream)" }}>
        loading...
      </div>
    );
  }

  const sunday = isSundayDate(date);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px", background: "var(--cream)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>admin</h1>
          <button onClick={logout} style={{ fontSize: 14, textDecoration: "underline", color: "var(--ink-soft)", background: "none", border: "none", cursor: "pointer" }}>
            log out
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setDate(addDaysToDateStr(date, -1))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--gold-line)", background: "var(--panel)", cursor: "pointer" }}>
            ←
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--gold-line)", background: "var(--panel)", color: "var(--ink)" }}
          />
          <button onClick={() => setDate(addDaysToDateStr(date, 1))} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--gold-line)", background: "var(--panel)", cursor: "pointer" }}>
            →
          </button>
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{sunday ? "Sunday — gift day" : "daily message"}</span>
        </div>

        {sunday ? (
          <div style={{ background: "var(--panel)", border: "1px solid var(--gold-line)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontWeight: 600 }}>gift for {date}</h2>
            <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              Prep this any time — it stays hidden from her until this date, 7pm.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["text", "image", "audio", "video", "pdf"].map((t) => (
                <button
                  key={t}
                  onClick={() => setGiftType(t)}
                  style={{
                    fontSize: 12, padding: "4px 12px", borderRadius: 999, border: "1px solid var(--gold-line)",
                    background: giftType === t ? "var(--gold)" : "transparent",
                    color: giftType === t ? "#2E2200" : "var(--ink)", cursor: "pointer",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {giftType === "text" ? (
              <textarea
                value={giftCaption}
                onChange={(e) => setGiftCaption(e.target.value)}
                rows={5}
                placeholder="write the letter here"
                style={{ borderRadius: 8, padding: "8px 12px", border: "1px solid var(--gold-line)", background: "var(--cream)", color: "var(--ink)", resize: "none" }}
              />
            ) : (
              <>
                <input type="file" onChange={(e) => setGiftFile(e.target.files[0])} />
                <input
                  type="text"
                  value={giftCaption}
                  onChange={(e) => setGiftCaption(e.target.value)}
                  placeholder="optional caption/message"
                  style={{ borderRadius: 8, padding: "8px 12px", border: "1px solid var(--gold-line)", background: "var(--cream)", color: "var(--ink)" }}
                />
              </>
            )}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveGiftDraft} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--gold-line)", background: "transparent", cursor: "pointer", fontWeight: 600 }}>
                save draft
              </button>
              <button onClick={publish} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--gold)", color: "#2E2200", border: "none", cursor: "pointer", fontWeight: 600 }}>
                publish (she sees this at 7pm)
              </button>
            </div>
            {entryData.live?.kind === "gift" ? (
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                currently live: {entryData.live.giftType} {entryData.live.fileName ? `(${entryData.live.fileName})` : ""}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>nothing published for this date yet</div>
            )}
          </div>
        ) : (
          <div style={{ background: "var(--panel)", border: "1px solid var(--gold-line)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontWeight: 600 }}>message for {date}</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              style={{ borderRadius: 8, padding: "8px 12px", border: "1px solid var(--gold-line)", background: "var(--cream)", color: "var(--ink)", resize: "none" }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveDraft} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--gold-line)", background: "transparent", cursor: "pointer", fontWeight: 600 }}>
                save draft
              </button>
              <button onClick={publish} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--gold)", color: "#2E2200", border: "none", cursor: "pointer", fontWeight: 600 }}>
                publish (she sees this at 7pm)
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              currently live: {entryData.live?.text || "(default message will show)"}
            </div>
          </div>
        )}

        {status ? <div style={{ fontWeight: 600, color: "var(--gold-deep)" }}>{status}</div> : null}
      </div>
    </div>
  );
}
