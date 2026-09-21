// Shared between the server page (parses the URL into a Supabase query)
// and the client filter panel (reads/writes the same URL params), so the
// two never drift out of sync.

export const BUDGET_BUCKETS = [
  { value: "0", label: "Any budget", min: null, max: null },
  { value: "1", label: "Under ₹75 L", min: null, max: 7_500_000 },
  { value: "2", label: "₹75 L – ₹1.2 Cr", min: 7_500_000, max: 12_000_000 },
  { value: "3", label: "₹1.2 Cr – ₹2 Cr", min: 12_000_000, max: 20_000_000 },
  { value: "4", label: "Above ₹2 Cr", min: 20_000_000, max: null },
] as const;

export const BHK_OPTIONS = [1, 2, 3, 4, 5] as const;

export const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
] as const;

export const CONSTRUCTION_STATUS_OPTIONS = [
  { value: "pre_launch", label: "Pre-launch" },
  { value: "under_construction", label: "Under construction" },
  { value: "nearing_possession", label: "Nearing possession" },
  { value: "ready_to_move", label: "Ready to move" },
  { value: "completed", label: "Completed" },
] as const;

export const KIND_OPTIONS = [
  { value: "new_launch", label: "New launch" },
  { value: "resale", label: "Resale" },
] as const;

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function parseList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

export interface ParsedFilters {
  locality: string[]; // slugs
  bhk: number[];
  budget: (typeof BUDGET_BUCKETS)[number];
  propertyType: string[];
  constructionStatus: string[];
  kind: string[];
}

export function parseFilters(searchParams: SearchParamsInput): ParsedFilters {
  const budgetValue = Array.isArray(searchParams.budget)
    ? searchParams.budget[0]
    : searchParams.budget;
  const budget =
    BUDGET_BUCKETS.find((b) => b.value === budgetValue) ?? BUDGET_BUCKETS[0];

  return {
    locality: parseList(searchParams.loc),
    bhk: parseList(searchParams.bhk).map(Number).filter((n) => !Number.isNaN(n)),
    budget,
    propertyType: parseList(searchParams.type),
    constructionStatus: parseList(searchParams.status),
    kind: parseList(searchParams.kind),
  };
}

export function hasActiveFilters(f: ParsedFilters): boolean {
  return (
    f.locality.length > 0 ||
    f.bhk.length > 0 ||
    f.budget.value !== "0" ||
    f.propertyType.length > 0 ||
    f.constructionStatus.length > 0 ||
    f.kind.length > 0
  );
}
