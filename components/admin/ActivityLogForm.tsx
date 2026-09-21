"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { STATUS_OPTIONS } from "@/lib/lead-status";

const ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "site_visit", label: "Site visit" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
] as const;

export default function ActivityLogForm({ leadId, currentStatus }: { leadId: string; currentStatus: string }) {
  const router = useRouter();
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]["value"]>("call");
  const [outcome, setOutcome] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(currentStatus);
  const [state, setState] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");

    const supabase = createClient();

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      type,
      outcome: outcome.trim() || null,
      body: body.trim() || null,
    });

    if (activityError) {
      setState("error");
      return;
    }

    if (status !== currentStatus) {
      const { error: statusError } = await supabase.from("leads").update({ status }).eq("id", leadId);
      if (statusError) {
        setState("error");
        return;
      }
    }

    setOutcome("");
    setBody("");
    setState("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Outcome
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. connected, no answer"
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Notes
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={{ background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink)" }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal" style={{ color: "var(--ink-3)" }}>
          Defaults to the current status — change it only if this interaction moved them forward.
        </span>
      </label>

      {state === "error" && (
        <p className="text-sm font-medium" style={{ color: "var(--crit)" }}>
          Couldn&apos;t save that — try again.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="self-start rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
      >
        {state === "submitting" ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
