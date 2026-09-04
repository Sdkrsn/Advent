"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Wrong password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--cream)" }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-2xl p-8 flex flex-col gap-4"
        style={{ background: "var(--panel)", border: "1px solid var(--gold-line)" }}
      >
        <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          admin
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="rounded-lg px-3 py-2 border outline-none"
          style={{ borderColor: "var(--gold-line)", background: "var(--cream)", color: "var(--ink)" }}
        />
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-3 py-2 font-semibold"
          style={{ background: "var(--gold)", color: "#2E2200" }}
        >
          {loading ? "checking..." : "enter"}
        </button>
      </form>
    </div>
  );
}
