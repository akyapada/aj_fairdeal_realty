"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase, getSessionId } from "@/lib/supabase";
import { BHK_OPTIONS, BUDGET_BUCKETS } from "@/lib/filters";
import type { Locality } from "@/lib/localities";

const CONSENT_TEXT =
  "I agree that AJ FairDeal Realty may contact me by phone, SMS or WhatsApp about this and similar properties, using the details I've provided here.";

const PURPOSE_OPTIONS = [
  { value: "end_use", label: "To live in" },
  { value: "investment", label: "Investment" },
  { value: "unsure", label: "Not sure yet" },
] as const;

interface ListingOption {
  id: string;
  label: string;
}

const inputStyle = {
  background: "var(--surface)",
  borderColor: "var(--line-2)",
  color: "var(--ink)",
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-sm"
      style={
        active
          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-ink)" }
          : { background: "var(--surface)", borderColor: "var(--line-2)", color: "var(--ink-2)" }
      }
    >
      {children}
    </button>
  );
}

export default function EnquiryForm({
  listings,
  localities,
}: {
  listings: ListingOption[];
  localities: Locality[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [listingId, setListingId] = useState("");
  const [budget, setBudget] = useState<string>(BUDGET_BUCKETS[0].value);
  const [bedrooms, setBedrooms] = useState<number[]>([]);
  const [preferredLocalities, setPreferredLocalities] = useState<number[]>([]);
  const [workplaceLocalityId, setWorkplaceLocalityId] = useState("");
  const [purpose, setPurpose] = useState<(typeof PURPOSE_OPTIONS)[number]["value"] | "">("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function toggleBedroom(n: number) {
    setBedrooms((prev) => (prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]));
  }

  function toggleLocality(id: number) {
    setPreferredLocalities((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setStatus("error");
      setErrorMessage("A phone number is required so we can reach you.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setErrorMessage("Please check the consent box so we're allowed to contact you.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const budgetBucket = BUDGET_BUCKETS.find((b) => b.value === budget);

    const { error } = await supabase.rpc("submit_enquiry", {
      p_name: name.trim() || null,
      p_phone: phone.trim(),
      p_email: email.trim() || null,
      p_session_id: getSessionId(),
      p_listing_id: listingId || null,
      p_consent: true,
      p_consent_text: CONSENT_TEXT,
      p_source: "organic",
      p_budget_min: budgetBucket?.min ?? null,
      p_budget_max: budgetBucket?.max ?? null,
      p_bedrooms: bedrooms.length ? bedrooms : null,
      p_localities: preferredLocalities.length ? preferredLocalities : null,
      p_purpose: purpose || null,
      p_notes: notes.trim() || null,
      p_workplace_locality_id: workplaceLocalityId ? Number(workplaceLocalityId) : null,
    });

    if (error) {
      console.error("submit_enquiry failed:", error.message);
      setStatus("error");
      setErrorMessage("Something went wrong submitting this. Please try again, or call us directly.");
      return;
    }

    setStatus("done");
  }

  if (status === "done") {
    return (
      <div
        className="rounded-[var(--radius)] border p-4"
        style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
      >
        <p className="font-semibold" style={{ color: "var(--ink)" }}>
          Thanks — we&apos;ve got your details.
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Someone from our team will call you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
        Tell us what you&apos;re looking for
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Phone *
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={inputStyle}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={inputStyle}
        />
      </label>

      {listings.length > 0 && (
        <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Which configuration?
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm font-normal"
            style={inputStyle}
          >
            <option value="">Not sure yet</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          Bedrooms
        </span>
        <div className="flex flex-wrap gap-1.5">
          {BHK_OPTIONS.map((n) => (
            <Chip key={n} active={bedrooms.includes(n)} onClick={() => toggleBedroom(n)}>
              {n} BHK
            </Chip>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Budget
        <select
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={inputStyle}
        >
          {BUDGET_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>

      {localities.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Other localities you&apos;d consider
          </span>
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {localities.map((loc) => (
              <Chip
                key={loc.id}
                active={preferredLocalities.includes(loc.id)}
                onClick={() => toggleLocality(loc.id)}
              >
                {loc.name}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Where do you work?
        <select
          value={workplaceLocalityId}
          onChange={(e) => setWorkplaceLocalityId(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={inputStyle}
        >
          <option value="">Prefer not to say</option>
          {localities.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal" style={{ color: "var(--ink-3)" }}>
          Helps us suggest properties with a shorter commute.
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          This is for
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSE_OPTIONS.map((opt) => (
            <Chip key={opt.value} active={purpose === opt.value} onClick={() => setPurpose(opt.value)}>
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        Anything else we should know?
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="rounded-md border px-3 py-2 text-sm font-normal"
          style={inputStyle}
        />
      </label>

      <label
        className="flex items-start gap-2.5 rounded-lg border p-3 text-sm"
        style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--ink-2)" }}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none"
          style={{ accentColor: "var(--accent)" }}
        />
        <span>
          {CONSENT_TEXT}{" "}
          <Link href="/privacy" target="_blank" className="underline" style={{ color: "var(--accent)" }}>
            See our privacy policy
          </Link>
          .
        </span>
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
        {status === "submitting" ? "Sending…" : "Check availability"}
      </button>
    </form>
  );
}
