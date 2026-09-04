"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAY_LABELS = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");
  const [giftType, setGiftType] = useState("text");
  const [giftText, setGiftText] = useState("");
  const [giftCaption, setGiftCaption] = useState("");
  const [giftFile, setGiftFile] = useState(null);

  async function load() {
    const res = await fetch("/api/admin/data");
    if (res.status === 401) {
      router.push("/admin");
      return;
    }
    const json = await res.json();
    setData(json);
    setDraft(json.draft);
    if (json.draftGift) {
      setGiftType(json.draftGift.type || "text");
      setGiftText(json.draftGift.text || "");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateDay(day, value) {
    setDraft((d) => ({ ...d, [day]: value }));
  }

  async function saveDrafts() {
    setStatus("saving...");
    await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: draft }),
    });
    setStatus("draft saved");
    setTimeout(() => setStatus(""), 1500);
  }

  async function publishAll() {
    setStatus("publishing...");
    await fetch("/api/admin/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: draft, publish: true }),
    });
    setStatus("live for her now");
    setTimeout(() => setStatus(""), 2000);
    load();
  }

  async function saveGiftDraft() {
    setStatus("saving gift...");
    if (giftType === "text") {
      await fetch("/api/admin/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: giftText }),
      });
    } else {
      if (!giftFile) {
        setStatus("pick a file first");
        return;
      }
      const form = new FormData();
      form.append("file", giftFile);
      form.append("type", giftType);
      form.append("caption", giftCaption);
      await fetch("/api/admin/gift", { method: "POST", body: form });
    }
    setStatus("gift draft saved (not live yet)");
    setTimeout(() => setStatus(""), 2000);
    load();
  }

  async function publishGift() {
    setStatus("publishing gift...");
    await fetch("/api/admin/gift", { method: "PUT" });
    setStatus("gift is live");
    setTimeout(() => setStatus(""), 2000);
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--cream)" }}>
        loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10" style={{ background: "var(--cream)", color: "var(--ink)" }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">admin</h1>
          <button onClick={logout} className="text-sm underline" style={{ color: "var(--ink-soft)" }}>
            log out
          </button>
        </div>

        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: "var(--panel)", border: "1px solid var(--gold-line)" }}
        >
          <h2 className="font-semibold">daily messages (Mon–Sat)</h2>
          {Object.keys(DAY_LABELS).map((day) => (
            <div key={day} className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: "var(--ink-soft)" }}>
                {DAY_LABELS[day]}
              </label>
              <textarea
                value={draft[day] || ""}
                onChange={(e) => updateDay(day, e.target.value)}
                rows={2}
                className="rounded-lg px-3 py-2 border outline-none resize-none"
                style={{ borderColor: "var(--gold-line)", background: "var(--cream)", color: "var(--ink)" }}
              />
            </div>
          ))}
          <div className="flex gap-3">
            <button
              onClick={saveDrafts}
              className="rounded-lg px-4 py-2 font-semibold border"
              style={{ borderColor: "var(--gold-line)" }}
            >
              save draft
            </button>
            <button
              onClick={publishAll}
              className="rounded-lg px-4 py-2 font-semibold"
              style={{ background: "var(--gold)", color: "#2E2200" }}
            >
              publish (she sees this now)
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: "var(--panel)", border: "1px solid var(--gold-line)" }}
        >
          <h2 className="font-semibold">sunday gift</h2>
          <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Save it now, it stays hidden from her until Sunday 7pm. Publish it whenever you're ready — it
            still won't show early.
          </p>

          <div className="flex gap-2 flex-wrap">
            {["text", "image", "audio", "video", "pdf"].map((t) => (
              <button
                key={t}
                onClick={() => setGiftType(t)}
                className="text-xs px-3 py-1 rounded-full border font-semibold"
                style={{
                  borderColor: "var(--gold-line)",
                  background: giftType === t ? "var(--gold)" : "transparent",
                  color: giftType === t ? "#2E2200" : "var(--ink)",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {giftType === "text" ? (
            <textarea
              value={giftText}
              onChange={(e) => setGiftText(e.target.value)}
              rows={4}
              placeholder="write the letter here"
              className="rounded-lg px-3 py-2 border outline-none resize-none"
              style={{ borderColor: "var(--gold-line)", background: "var(--cream)", color: "var(--ink)" }}
            />
          ) : (
            <>
              <input
                type="file"
                onChange={(e) => setGiftFile(e.target.files[0])}
                className="text-sm"
              />
              <input
                type="text"
                value={giftCaption}
                onChange={(e) => setGiftCaption(e.target.value)}
                placeholder="optional caption/message"
                className="rounded-lg px-3 py-2 border outline-none"
                style={{ borderColor: "var(--gold-line)", background: "var(--cream)", color: "var(--ink)" }}
              />
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveGiftDraft}
              className="rounded-lg px-4 py-2 font-semibold border"
              style={{ borderColor: "var(--gold-line)" }}
            >
              save draft
            </button>
            <button
              onClick={publishGift}
              className="rounded-lg px-4 py-2 font-semibold"
              style={{ background: "var(--gold)", color: "#2E2200" }}
            >
              publish gift
            </button>
          </div>

          {data.liveGift ? (
            <div className="text-xs mt-2" style={{ color: "var(--ink-soft)" }}>
              current live gift: {data.liveGift.type} {data.liveGift.fileName ? `(${data.liveGift.fileName})` : ""}
            </div>
          ) : (
            <div className="text-xs mt-2" style={{ color: "var(--ink-soft)" }}>
              no gift published yet
            </div>
          )}
        </div>

        {status ? (
          <div className="text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}
