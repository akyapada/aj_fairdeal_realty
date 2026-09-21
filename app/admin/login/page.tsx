"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setStatus("error");
      setErrorMessage("Wrong email or password. Try again.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center" style={{ background: "var(--paper)" }}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-[var(--radius)] border p-6"
        style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow)" }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <Building2 size={22} color="var(--accent-ink)" strokeWidth={2.25} />
          </span>
          <h1 className="text-lg font-extrabold" style={{ color: "var(--ink)" }}>
            AJ FairDeal Realty
          </h1>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>
            Staff sign-in
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
          />
        </label>

        {status === "error" && (
          <p className="text-sm font-medium" style={{ color: "var(--crit)" }}>
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-md py-2.5 text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {status === "submitting" ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
