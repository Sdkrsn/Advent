"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { START_DATE, EXAM_DATE, isDateUnlocked, isSundayDate, dateStrRange, nowInTz } from "@/lib/time";

const MONTH_NAMES = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const DOW = ["sun","mon","tue","wed","thu","fri","sat"];

function partsOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function dowIndex(dateStr) {
  const { y, m, d } = partsOf(dateStr);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

function GiftContent({ gift }) {
  if (!gift) return null;
  if (gift.giftType === "text") {
    return <p className="font-serif text-lg leading-relaxed" style={{ fontFamily: "Fraunces, Georgia, serif" }}>{gift.text}</p>;
  }
  if (gift.giftType === "image") {
    return (
      <div className="flex flex-col gap-4">
        <img src={gift.url} alt="" className="rounded-2xl w-full" />
        {gift.text ? <p style={{ fontFamily: "Fraunces, Georgia, serif" }}>{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.giftType === "audio") {
    return (
      <div className="flex flex-col gap-4">
        <audio controls src={gift.url} className="w-full" />
        {gift.text ? <p style={{ fontFamily: "Fraunces, Georgia, serif" }}>{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.giftType === "video") {
    return (
      <div className="flex flex-col gap-4">
        <video controls src={gift.url} className="w-full rounded-2xl" />
        {gift.text ? <p style={{ fontFamily: "Fraunces, Georgia, serif" }}>{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.giftType === "pdf") {
    return (
      <div className="flex flex-col gap-4">
        <a href={gift.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: "var(--gold-deep)" }}>
          open your letter
        </a>
        {gift.text ? <p style={{ fontFamily: "Fraunces, Georgia, serif" }}>{gift.text}</p> : null}
      </div>
    );
  }
  return null;
}

export default function Home() {
  const router = useRouter();
  const [today, setToday] = useState(null);
  const [opened, setOpened] = useState([]);
  const [modalDate, setModalDate] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const peekTaps = useRef({});
  const [peekPrompt, setPeekPrompt] = useState(null);
  const [peekPassword, setPeekPassword] = useState("");
  const [peekError, setPeekError] = useState("");
  const [peekResult, setPeekResult] = useState(null);
  const [peekLoading, setPeekLoading] = useState(false);

  useEffect(() => {
    setToday(nowInTz().dateStr);
    try {
      const raw = localStorage.getItem("bubs-opened");
      setOpened(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  const days = useMemo(() => {
    return dateStrRange(START_DATE, EXAM_DATE).map((dateStr) => ({
      dateStr,
      isGift: dateStr !== EXAM_DATE && isSundayDate(dateStr),
      isFinale: dateStr === EXAM_DATE,
    }));
  }, []);

  const daysLeft = useMemo(() => {
    if (!today) return null;
    const [y1, m1, d1] = today.split("-").map(Number);
    const [y2, m2, d2] = EXAM_DATE.split("-").map(Number);
    const a = Date.UTC(y1, m1 - 1, d1);
    const b = Date.UTC(y2, m2 - 1, d2);
    return Math.max(0, Math.round((b - a) / 86400000));
  }, [today]);

  const progress = useMemo(() => {
    if (!today) return 0;
    const [y1, m1, d1] = START_DATE.split("-").map(Number);
    const [y2, m2, d2] = EXAM_DATE.split("-").map(Number);
    const [y3, m3, d3] = today.split("-").map(Number);
    const a = Date.UTC(y1, m1 - 1, d1);
    const b = Date.UTC(y2, m2 - 1, d2);
    const c = Date.UTC(y3, m3 - 1, d3);
    const total = b - a;
    const done = Math.min(Math.max(c - a, 0), total);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [today]);

  const months = useMemo(() => {
    const byMonth = {};
    const order = [];
    days.forEach((d) => {
      const { y, m } = partsOf(d.dateStr);
      const key = `${y}-${m}`;
      if (!byMonth[key]) {
        byMonth[key] = [];
        order.push(key);
      }
      byMonth[key].push(d);
    });
    return order.map((key) => ({ key, list: byMonth[key] }));
  }, [days]);

  function handleSecretTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      router.push("/admin");
    }
  }

  async function openDay(d) {
    setModalDate(d);
    setModalLoading(true);
    setModalData(null);
    if (!opened.includes(d.dateStr)) {
      const updated = [...opened, d.dateStr];
      setOpened(updated);
      try { localStorage.setItem("bubs-opened", JSON.stringify(updated)); } catch {}
    }
    try {
      const res = await fetch(`/api/day?date=${d.dateStr}`);
      const data = await res.json();
      setModalData(data);
    } catch {
      setModalData({ ready: false });
    }
    setModalLoading(false);
  }

  function closeModal() {
    setModalDate(null);
    setModalData(null);
  }

  function handleLockedTap(dateStr) {
    const state = peekTaps.current[dateStr] || { count: 0, timer: null };
    state.count += 1;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => { state.count = 0; }, 1500);
    peekTaps.current[dateStr] = state;
    if (state.count >= 5) {
      state.count = 0;
      setPeekPrompt(dateStr);
      setPeekPassword("");
      setPeekError("");
      setPeekResult(null);
    }
  }

  async function submitPeek() {
    setPeekLoading(true);
    setPeekError("");
    try {
      const res = await fetch("/api/admin/peek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: peekPrompt, password: peekPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPeekError(data.error || "wrong password");
        setPeekLoading(false);
        return;
      }
      setPeekResult(data);
    } catch {
      setPeekError("something went wrong");
    }
    setPeekLoading(false);
  }

  function closePeek() {
    setPeekPrompt(null);
    setPeekPassword("");
    setPeekError("");
    setPeekResult(null);
  }

  if (!today) return null;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60, position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 24px 0" }}>
        <div
          onClick={handleSecretTap}
          style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 700, marginBottom: 10, width: "fit-content", cursor: "default", userSelect: "none" }}
        >
          ✦ today
        </div>

        <div className="fade-in-up" style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div
              style={{
                fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 84, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                backgroundImage: "linear-gradient(160deg, var(--gold-deep), var(--gold))",
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                filter: "drop-shadow(0 2px 10px var(--shadow))",
              }}
            >
              {daysLeft}
            </div>
            <div style={{ fontSize: 16, color: "var(--ink-soft)", maxWidth: 220, lineHeight: 1.4 }}>
              days until step 1
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            exam day<br /><b style={{ color: "var(--ink)", fontFamily: "Fraunces, Georgia, serif", fontSize: 15 }}>Monday, December 14, 2026</b>
          </div>
        </div>

        <div className="fade-in-up" style={{ height: 6, borderRadius: 999, background: "var(--panel-2)", overflow: "hidden", border: "1px solid var(--line)" }}>
          <div
            style={{
              height: "100%", width: `${progress}%`, borderRadius: 999,
              background: "linear-gradient(90deg, var(--gold-deep), var(--gold))",
              boxShadow: "0 0 10px var(--gold)",
              transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </div>
        <div className="fade-in-up" style={{ marginTop: 30, background: "linear-gradient(160deg, var(--panel), var(--panel-2))", border: "1px solid var(--gold-line)", borderRadius: 18, padding: "22px 24px", boxShadow: "0 8px 24px var(--shadow)" }}>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 18, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--gold-deep)" }}>◆</span> how this works
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li style={{ fontSize: 14, lineHeight: 1.6 }}>a new box unlocks every day at <b style={{ color: "var(--gold-deep)" }}>7pm</b> — open it whenever you want after that</li>
            <li style={{ fontSize: 14, lineHeight: 1.6 }}>every <b style={{ color: "var(--gold-deep)" }}>Sunday</b> the box turns gold — that one's a real gift, not just a note</li>
            <li style={{ fontSize: 14, lineHeight: 1.6 }}>the very last box opens on exam morning, December 14</li>
          </ul>
        </div>

        {months.map(({ key, list }, monthIdx) => {
          const sample = list[0];
          const { y, m } = partsOf(sample.dateStr);
          return (
            <div key={key} className="fade-in-up" style={{ marginTop: 38, animationDelay: `${Math.min(monthIdx * 0.05, 0.3)}s` }}>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 20, marginBottom: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
                {MONTH_NAMES[m - 1]} <span style={{ fontFamily: "Figtree, sans-serif", fontWeight: 400, fontSize: 13, color: "var(--ink-faint)" }}>{y}</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(62px, 1fr))", gap: 9 }}>
                {list.map((d) => {
                  const pastOrToday = d.dateStr <= today;
                  const isToday = d.dateStr === today;
                  const isOpened = opened.includes(d.dateStr);
                  const cls = ["tile"];
                  if (d.isGift) cls.push("gift");
                  if (d.isFinale) cls.push("finale");
                  if (!pastOrToday) cls.push("locked");
                  else if (isToday) cls.push("today");
                  else if (isOpened) cls.push("opened");
                  const { d: dayNum } = partsOf(d.dateStr);
                  const { d: idxInMonth } = { d: list.indexOf(d) };
                  return (
                    <div
                      key={d.dateStr}
                      className={cls.join(" ")}
                      style={{ animationDelay: `${Math.min(idxInMonth * 0.012, 0.4)}s` }}
                      onClick={pastOrToday ? () => openDay(d) : () => handleLockedTap(d.dateStr)}
                    >
                      <div className="n">{dayNum}</div>
                      <div className="d">{DOW[dowIndex(d.dateStr)]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 32, fontSize: 12, color: "var(--ink-soft)", padding: "16px 20px", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--line)", background: "var(--panel)" }} />locked</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-deep)", background: "var(--panel-2)", boxShadow: "0 0 6px var(--gold)" }} />today</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-line)", background: "var(--cream)" }} />opened</div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-deep)", background: "var(--panel-2)" }} />weekly gift</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 44, fontFamily: "Fraunces, Georgia, serif", fontStyle: "italic", fontSize: 14, color: "var(--ink-faint)" }}>
          ✦ made with love, one day at a time ✦
        </div>
      </div>

      {modalDate ? (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(40,32,10,0.5)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50,
            animation: "fadeIn 0.2s ease both",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(165deg, var(--cream), var(--panel))",
              borderRadius: 22, maxWidth: 440, width: "100%", padding: "34px 30px 28px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 0 0 1px var(--gold-line)",
              border: modalDate.isGift ? "2px solid var(--gold-deep)" : "1px solid var(--line)",
              animation: "popIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
              position: "relative",
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>
              {modalDate.isFinale ? "🎓" : modalDate.isGift ? "🎁" : "💌"}
            </div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--gold-deep)", marginBottom: 6 }}>
              {modalDate.isFinale ? "exam day" : modalDate.isGift ? "weekly gift" : "note"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--gold-line)" }}>
              {DOW[dowIndex(modalDate.dateStr)]}, {MONTH_NAMES[partsOf(modalDate.dateStr).m - 1]} {partsOf(modalDate.dateStr).d}
            </div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 19, lineHeight: 1.6, marginBottom: 26, color: "var(--ink)" }}>
              {modalLoading ? (
                <span style={{ color: "var(--ink-faint)" }}>opening…</span>
              ) : modalDate.isFinale ? (
                "this is it. everything you studied is already in you — today you just get to show it. walk in, breathe, and remember: you were built for exactly this morning."
              ) : !modalData?.ready ? (
                modalData?.isSunday ? "something's coming for you tonight." : "not ready yet — check back at 7pm."
              ) : modalData.isSunday ? (
                <GiftContent gift={modalData.gift} />
              ) : (
                modalData.message
              )}
            </div>
            <button
              onClick={closeModal}
              style={{
                fontWeight: 700, fontSize: 14, background: "var(--gold)", color: "#2E2200",
                border: "none", borderRadius: 12, padding: "10px 22px", cursor: "pointer",
                boxShadow: "0 4px 12px var(--shadow)", transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              close
            </button>
          </div>
        </div>
      ) : null}

      {peekPrompt ? (
        <div
          onClick={closePeek}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(40,32,10,0.5)",
            backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 60,
            animation: "fadeIn 0.2s ease both",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(165deg, var(--cream), var(--panel))",
              borderRadius: 22, maxWidth: 420, width: "100%", padding: "30px 28px 26px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 0 0 1px var(--gold-line)",
              border: "1px solid var(--line)",
              animation: "popIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--gold-deep)", marginBottom: 14 }}>
              admin check · {peekPrompt}
            </div>

            {!peekResult ? (
              <>
                <input
                  type="password"
                  value={peekPassword}
                  onChange={(e) => setPeekPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPeek()}
                  placeholder="password"
                  autoFocus
                  style={{ width: "100%", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--gold-line)", background: "var(--panel)", color: "var(--ink)", marginBottom: 12, boxSizing: "border-box" }}
                />
                {peekError ? (
                  <div style={{ fontSize: 13, color: "#b0402a", marginBottom: 12 }}>{peekError}</div>
                ) : null}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={submitPeek}
                    disabled={peekLoading}
                    style={{ fontWeight: 700, fontSize: 14, background: "var(--gold)", color: "#2E2200", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer" }}
                  >
                    {peekLoading ? "checking…" : "check"}
                  </button>
                  <button
                    onClick={closePeek}
                    style={{ fontWeight: 600, fontSize: 14, background: "transparent", color: "var(--ink-soft)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 18px", cursor: "pointer" }}
                  >
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, marginBottom: 14 }}>
                  status:{" "}
                  <b style={{ color: peekResult.isLive ? "var(--gold-deep)" : "var(--ink-soft)" }}>
                    {peekResult.isLive ? "live" : "not live"}
                  </b>
                  {peekResult.isSunday ? " · gift day" : ""}
                </div>

                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
                  live
                </div>
                {peekResult.live ? (
                  peekResult.live.kind === "gift" ? (
                    <div style={{ fontSize: 13, marginBottom: 14 }}>
                      {peekResult.live.giftType} {peekResult.live.fileName ? `(${peekResult.live.fileName})` : ""}
                      {peekResult.live.text ? <p style={{ marginTop: 6 }}>{peekResult.live.text}</p> : null}
                      {peekResult.live.url ? (
                        peekResult.live.giftType === "image" ? (
                          <img src={peekResult.live.url} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }} />
                        ) : (
                          <a href={peekResult.live.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 6, textDecoration: "underline" }}>
                            open file
                          </a>
                        )
                      ) : null}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, marginBottom: 14 }}>{peekResult.live.text || "(empty)"}</p>
                  )
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 14 }}>nothing published</p>
                )}

                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>
                  draft
                </div>
                {peekResult.draft ? (
                  peekResult.draft.kind === "gift" ? (
                    <div style={{ fontSize: 13, marginBottom: 16 }}>
                      {peekResult.draft.giftType} {peekResult.draft.fileName ? `(${peekResult.draft.fileName})` : ""}
                      {peekResult.draft.text ? <p style={{ marginTop: 6 }}>{peekResult.draft.text}</p> : null}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, marginBottom: 16 }}>{peekResult.draft.text || "(empty)"}</p>
                  )
                ) : (
                  <p style={{ fontSize: 13, color: "var(--ink-faint)", marginBottom: 16 }}>no draft saved</p>
                )}

                <button
                  onClick={closePeek}
                  style={{ fontWeight: 700, fontSize: 14, background: "var(--gold)", color: "#2E2200", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer" }}
                >
                  close
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
