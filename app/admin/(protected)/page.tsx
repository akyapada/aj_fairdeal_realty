import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getLocalities } from "@/lib/localities";
import { formatINR } from "@/lib/supabase";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit_scheduled: "Visit booked",
  site_visit_done: "Visit done",
  negotiating: "Negotiating",
  booked: "Booked",
  lost: "Lost",
  dormant: "Dormant",
};

interface LeadRow {
  id: string;
  full_name: string | null;
  phone: string;
  status: string;
  owner_id: string | null;
  created_at: string;
}

interface EnrichedLead extends LeadRow {
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  bedroomsWanted: number[];
  localityNames: string[];
  ownerName: string | null;
}

function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Not shared";
  if (min != null && max != null && min !== max) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min ?? max);
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Real table, so RLS ("staff read own leads") is guaranteed correct —
  // this is the authoritative set of leads this user is allowed to see.
  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id, full_name, phone, status, owner_id, created_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (leadsError) {
    console.error("Failed to load leads:", leadsError.message);
  }

  const leadRows: LeadRow[] = leads ?? [];
  const leadIds = leadRows.map((l) => l.id);

  const [scoresRes, requirementsRes, localities] = await Promise.all([
    leadIds.length
      ? supabase.from("lead_scores").select("lead_id, score, budget_min, budget_max").in("lead_id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    leadIds.length
      ? supabase
          .from("lead_requirements")
          .select("lead_id, bedrooms_wanted, preferred_localities, captured_at")
          .in("lead_id", leadIds)
          .order("captured_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    getLocalities(),
  ]);

  const localityNameById = new Map(localities.map((l) => [l.id, l.name]));

  const scoreByLeadId = new Map(
    (scoresRes.data ?? []).map((s) => [s.lead_id, s])
  );

  // lead_requirements is append-only, ordered desc above, so the first
  // row seen per lead_id is the latest one.
  const latestRequirementByLeadId = new Map<
    string,
    { bedrooms_wanted: number[] | null; preferred_localities: number[] | null }
  >();
  for (const r of requirementsRes.data ?? []) {
    if (!latestRequirementByLeadId.has(r.lead_id)) {
      latestRequirementByLeadId.set(r.lead_id, r);
    }
  }

  const ownerIds = [...new Set(leadRows.map((l) => l.owner_id).filter((id): id is string => !!id))];
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] };
  const ownerNameById = new Map((owners ?? []).map((o) => [o.id, o.full_name]));

  const enriched: EnrichedLead[] = leadRows.map((lead) => {
    const score = scoreByLeadId.get(lead.id);
    const requirement = latestRequirementByLeadId.get(lead.id);
    return {
      ...lead,
      score: score?.score ?? 0,
      budgetMin: score?.budget_min ?? null,
      budgetMax: score?.budget_max ?? null,
      bedroomsWanted: requirement?.bedrooms_wanted ?? [],
      localityNames: (requirement?.preferred_localities ?? [])
        .map((id) => localityNameById.get(id))
        .filter((n): n is string => !!n),
      ownerName: lead.owner_id ? (ownerNameById.get(lead.owner_id) ?? "Unassigned agent") : "Unassigned",
    };
  });

  enriched.sort((a, b) => b.score - a.score);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const kpis = {
    thisMonth: leadRows.filter((l) => new Date(l.created_at) >= monthStart).length,
    uncontacted: leadRows.filter((l) => l.status === "new").length,
    highScore: enriched.filter((l) => l.score > 70).length,
    visitsBooked: leadRows.filter((l) => l.status === "site_visit_scheduled").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
        Leads
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
        You&apos;re seeing only leads assigned to you, unless you&apos;re an admin — that&apos;s intentional, not a
        bug.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Leads this month", kpis.thisMonth],
          ["Uncontacted", kpis.uncontacted],
          ["Score above 70", kpis.highScore],
          ["Site visits booked", kpis.visitsBooked],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-[var(--radius)] border p-4"
            style={{ background: "var(--surface)", borderColor: "var(--line)" }}
          >
            <div className="tabular text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
              {value}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: "var(--ink-3)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Call these first
        </h2>
        <p className="text-xs" style={{ color: "var(--ink-3)" }}>
          Sorted by score, descending
        </p>

        <div
          className="mt-3 overflow-x-auto rounded-[var(--radius)] border"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          {enriched.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: "var(--ink-3)" }}>
              No leads yet.
            </p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Name", "Score", "Budget", "Wants", "Localities", "Status", "Owner"].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched.map((lead) => (
                  <tr key={lead.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <Link href={`/admin/leads/${lead.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>
                        {lead.full_name ?? lead.phone}
                      </Link>
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5 font-semibold" style={{ color: "var(--ink)" }}>
                      {lead.score}
                    </td>
                    <td className="tabular whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                      {formatBudget(lead.budgetMin, lead.budgetMax)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                      {lead.bedroomsWanted.length ? `${lead.bedroomsWanted.join(", ")} BHK` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                      {lead.localityNames.length ? lead.localityNames.join(", ") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink-2)" }}>
                      {lead.ownerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
