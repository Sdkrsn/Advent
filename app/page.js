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

  if (!today) return null;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 24px 0" }}>
        <div
          onClick={handleSecretTap}
          style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-soft)", fontWeight: 700, marginBottom: 10, width: "fit-content", cursor: "default", userSelect: "none" }}
        >
          today
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 28, borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 76, lineHeight: 1, color: "var(--gold-deep)", fontVariantNumeric: "tabular-nums" }}>
              {daysLeft}
            </div>
            <div style={{ fontSize: 16, color: "var(--ink-soft)", maxWidth: 220, lineHeight: 1.4 }}>
              days until step 1
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            exam day<br /><b style={{ color: "var(--ink)" }}>Monday, December 14, 2026</b>
          </div>
        </div>

        <div style={{ marginTop: 28, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 16, padding: "20px 22px" }}>
          <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 17, margin: "0 0 10px" }}>how this works</h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 7 }}>
            <li style={{ fontSize: 14, lineHeight: 1.55 }}>a new box unlocks every day at <b style={{ color: "var(--gold-deep)" }}>7pm</b> — open it whenever you want after that</li>
            <li style={{ fontSize: 14, lineHeight: 1.55 }}>every <b style={{ color: "var(--gold-deep)" }}>Sunday</b> the box turns gold — that one's a real gift, not just a note</li>
            <li style={{ fontSize: 14, lineHeight: 1.55 }}>the very last box opens on exam morning, December 14</li>
          </ul>
        </div>

        {months.map(({ key, list }) => {
          const sample = list[0];
          const { y, m } = partsOf(sample.dateStr);
          return (
            <div key={key} style={{ marginTop: 38 }}>
              <div style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 600, fontSize: 19, marginBottom: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
                {MONTH_NAMES[m - 1]} <span style={{ fontFamily: "Figtree, sans-serif", fontWeight: 400, fontSize: 13, color: "var(--ink-faint)" }}>{y}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(62px, 1fr))", gap: 8 }}>
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
                  return (
                    <div
                      key={d.dateStr}
                      className={cls.join(" ")}
                      onClick={pastOrToday ? () => openDay(d) : undefined}
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 28, fontSize: 12, color: "var(--ink-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--line)", background: "var(--panel)" }} />locked</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-deep)", background: "var(--panel-2)" }} />today</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-line)", background: "var(--cream)" }} />opened</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: "1.5px solid var(--gold-deep)", background: "var(--panel-2)" }} />weekly gift</div>
        </div>
      </div>

      {modalDate ? (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(40,32,10,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--cream)", borderRadius: 20, maxWidth: 420, width: "100%", padding: "32px 28px 28px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)", border: modalDate.isGift ? "2px solid var(--gold-deep)" : "1px solid var(--line)" }}
          >
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--gold-deep)", marginBottom: 8 }}>
              {modalDate.isFinale ? "exam day" : modalDate.isGift ? "weekly gift" : "note"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 18 }}>
              {DOW[dowIndex(modalDate.dateStr)]}, {MONTH_NAMES[partsOf(modalDate.dateStr).m - 1]} {partsOf(modalDate.dateStr).d}
            </div>
            <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: 19, lineHeight: 1.55, marginBottom: 24 }}>
              {modalLoading ? (
                "..."
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
              style={{ fontWeight: 700, fontSize: 14, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 20px", cursor: "pointer" }}
            >
              close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
