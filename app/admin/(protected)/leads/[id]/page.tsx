import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getLocalities } from "@/lib/localities";
import { formatINR } from "@/lib/supabase";
import { STATUS_OPTIONS } from "@/lib/lead-status";
import ActivityLogForm from "@/components/admin/ActivityLogForm";

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

const PURPOSE_LABELS: Record<string, string> = {
  end_use: "To live in",
  investment: "Investment",
  unsure: "Not sure yet",
};

const ACTIVITY_LABELS: Record<string, string> = {
  call: "Call",
  whatsapp: "WhatsApp",
  email: "Email",
  site_visit: "Site visit",
  meeting: "Meeting",
  note: "Note",
  status_change: "Status change",
};

function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Not shared";
  if (min != null && max != null && min !== max) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min ?? max);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, phone, email, status, owner_id, created_at")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!lead) notFound();

  const [requirementsRes, activitiesRes, viewsRes, scoreRes, localities] = await Promise.all([
    supabase
      .from("lead_requirements")
      .select(
        "budget_min, budget_max, bedrooms_wanted, preferred_localities, purpose, workplace_locality_id, loan_required, loan_pre_approved, notes, captured_at"
      )
      .eq("lead_id", id)
      .order("captured_at", { ascending: false }),
    supabase
      .from("lead_activities")
      .select("id, type, body, outcome, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    // Only admins can read this (see schema.sql RLS) — comes back empty
    // for regular agents, which is correct, not a bug.
    supabase.from("listing_views").select("created_at").eq("lead_id", id),
    supabase.from("lead_scores").select("score").eq("lead_id", id).maybeSingle(),
    getLocalities(),
  ]);

  const localityNameById = new Map(localities.map((l) => [l.id, l.name]));
  const requirements = requirementsRes.data ?? [];
  const latest = requirements[0];
  const views = viewsRes.data ?? [];
  const distinctDays = new Set(views.map((v) => new Date(v.created_at).toDateString())).size;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link href="/admin" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
        ← All leads
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
            {lead.full_name ?? lead.phone}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            {lead.phone}
            {lead.email ? ` · ${lead.email}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {scoreRes.data && (
            <div className="text-right">
              <div className="tabular text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
                {scoreRes.data.score}
              </div>
              <div className="text-xs" style={{ color: "var(--ink-3)" }}>
                Score
              </div>
            </div>
          )}
          <span
            className="rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}
          >
            {STATUS_LABELS[lead.status] ?? lead.status}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className="rounded-[var(--radius)] border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            What they want
          </h2>
          {latest ? (
            <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
              <dt style={{ color: "var(--ink-3)" }}>Budget</dt>
              <dd className="tabular font-semibold" style={{ color: "var(--ink)" }}>
                {formatBudget(latest.budget_min, latest.budget_max)}
              </dd>
              <dt style={{ color: "var(--ink-3)" }}>Bedrooms</dt>
              <dd style={{ color: "var(--ink)" }}>
                {latest.bedrooms_wanted?.length ? `${latest.bedrooms_wanted.join(", ")} BHK` : "—"}
              </dd>
              <dt style={{ color: "var(--ink-3)" }}>Localities</dt>
              <dd style={{ color: "var(--ink)" }}>
                {latest.preferred_localities?.length
                  ? latest.preferred_localities
                      .map((locId: number) => localityNameById.get(locId))
                      .filter(Boolean)
                      .join(", ")
                  : "—"}
              </dd>
              <dt style={{ color: "var(--ink-3)" }}>Workplace</dt>
              <dd style={{ color: "var(--ink)" }}>
                {latest.workplace_locality_id ? localityNameById.get(latest.workplace_locality_id) : "—"}
              </dd>
              <dt style={{ color: "var(--ink-3)" }}>Purpose</dt>
              <dd style={{ color: "var(--ink)" }}>{latest.purpose ? PURPOSE_LABELS[latest.purpose] : "—"}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Loan</dt>
              <dd style={{ color: "var(--ink)" }}>
                {latest.loan_required == null
                  ? "—"
                  : latest.loan_required
                    ? latest.loan_pre_approved
                      ? "Needed, pre-approved"
                      : "Needed, not applied"
                    : "Not needed"}
              </dd>
            </dl>
          ) : (
            <p className="mt-2 text-sm" style={{ color: "var(--ink-3)" }}>
              No requirement captured yet.
            </p>
          )}
          {latest?.notes && (
            <p className="mt-3 border-t pt-3 text-sm" style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
              {latest.notes}
            </p>
          )}
        </div>

        <div
          className="rounded-[var(--radius)] border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
            Engagement
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-y-2 text-sm">
            <dt style={{ color: "var(--ink-3)" }}>Page views</dt>
            <dd className="tabular" style={{ color: "var(--ink)" }}>
              {views.length}
            </dd>
            <dt style={{ color: "var(--ink-3)" }}>Distinct days</dt>
            <dd className="tabular" style={{ color: "var(--ink)" }}>
              {distinctDays}
            </dd>
            <dt style={{ color: "var(--ink-3)" }}>Lead since</dt>
            <dd style={{ color: "var(--ink)" }}>{formatDateTime(lead.created_at)}</dd>
            <dt style={{ color: "var(--ink-3)" }}>Requirement history</dt>
            <dd style={{ color: "var(--ink)" }}>
              {requirements.length} version{requirements.length === 1 ? "" : "s"}
            </dd>
          </dl>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Log activity &amp; update status
        </h2>
        <div
          className="mt-2 rounded-[var(--radius)] border p-4"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <ActivityLogForm leadId={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
          Activity history
        </h2>
        <div className="mt-2 flex flex-col gap-2">
          {(activitiesRes.data ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              Nothing logged yet.
            </p>
          ) : (
            activitiesRes.data!.map((activity) => (
              <div
                key={activity.id}
                className="rounded-[var(--radius)] border p-3"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {ACTIVITY_LABELS[activity.type] ?? activity.type}
                    {activity.outcome ? ` — ${activity.outcome}` : ""}
                  </span>
                  <span className="text-xs" style={{ color: "var(--ink-3)" }}>
                    {formatDateTime(activity.created_at)}
                  </span>
                </div>
                {activity.body && (
                  <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                    {activity.body}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
