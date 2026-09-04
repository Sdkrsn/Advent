"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function GiftContent({ gift }) {
  if (!gift) return null;
  if (gift.type === "text") {
    return <p className="font-serif text-xl leading-relaxed">{gift.text}</p>;
  }
  if (gift.type === "image") {
    return (
      <div className="flex flex-col gap-4">
        <img src={gift.url} alt="" className="rounded-2xl w-full" />
        {gift.text ? <p className="font-serif text-lg leading-relaxed">{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.type === "audio") {
    return (
      <div className="flex flex-col gap-4">
        <audio controls src={gift.url} className="w-full" />
        {gift.text ? <p className="font-serif text-lg leading-relaxed">{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.type === "video") {
    return (
      <div className="flex flex-col gap-4">
        <video controls src={gift.url} className="w-full rounded-2xl" />
        {gift.text ? <p className="font-serif text-lg leading-relaxed">{gift.text}</p> : null}
      </div>
    );
  }
  if (gift.type === "pdf") {
    return (
      <div className="flex flex-col gap-4">
        <a
          href={gift.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold"
          style={{ color: "var(--gold-deep)" }}
        >
          open your letter
        </a>
        {gift.text ? <p className="font-serif text-lg leading-relaxed">{gift.text}</p> : null}
      </div>
    );
  }
  return null;
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true });
  const tapCount = useRef(0);
  const tapTimer = useRef(null);

  useEffect(() => {
    fetch("/api/today")
      .then((r) => r.json())
      .then((data) => setState({ loading: false, ...data }))
      .catch(() => setState({ loading: false, ready: false }));
  }, []);

  function handleSecretTap() {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 1500);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div
          onClick={handleSecretTap}
          className="w-3 h-3 rounded-full mb-10 mx-auto opacity-0"
          aria-hidden="true"
        />

        {state.loading ? (
          <div className="text-center" style={{ color: "var(--ink-soft)" }}>
            ...
          </div>
        ) : !state.ready ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--panel)", border: "1px solid var(--gold-line)" }}
          >
            <p className="font-serif text-lg" style={{ color: "var(--ink-soft)" }}>
              {state.isSunday
                ? "something's coming for you tonight."
                : "today's note isn't ready yet — check back tonight."}
            </p>
          </div>
        ) : state.isSunday ? (
          <div
            className="rounded-2xl p-8"
            style={{ background: "var(--panel)", border: "2px solid var(--gold-deep)" }}
          >
            <div
              className="text-xs uppercase tracking-widest font-bold mb-4"
              style={{ color: "var(--gold-deep)" }}
            >
              for you
            </div>
            <GiftContent gift={state.gift} />
          </div>
        ) : (
          <div
            className="rounded-2xl p-8"
            style={{ background: "var(--panel)", border: "1px solid var(--gold-line)" }}
          >
            <p className="font-serif text-xl leading-relaxed">{state.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
