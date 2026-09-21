import type { SupabaseClient } from "@supabase/supabase-js";

// Turns a lead's latest requirement into candidate listings — the "find"
// half of matching. Sending anything stays a deliberate, one-click human
// action (see EnquiryForm/whatsapp.ts) — no automated bulk messaging.

export interface RequirementForMatching {
  bedrooms_wanted: number[] | null;
  preferred_localities: number[] | null;
  budget_min: number | null;
  budget_max: number | null;
  property_types: string[] | null;
}

export interface ListingMatch {
  id: string;
  title: string | null;
  bedrooms: number | null;
  price_min: number | null;
  price_max: number | null;
  is_price_on_request: boolean;
  projectName: string;
  projectSlug: string;
  localityName: string | null;
}

interface RawMatchRow {
  id: string;
  title: string | null;
  bedrooms: number | null;
  price_min: number | null;
  price_max: number | null;
  is_price_on_request: boolean;
  projects: {
    name: string;
    slug: string;
    localities: { name: string } | null;
  };
}

export async function findMatchingListings(
  supabase: SupabaseClient,
  requirement: RequirementForMatching,
  limit = 5
): Promise<ListingMatch[]> {
  const propertyTypes = requirement.property_types?.length ? requirement.property_types : ["apartment", "villa"];

  let query = supabase
    .from("listings")
    .select(
      `id, title, bedrooms, price_min, price_max, is_price_on_request,
       projects!inner ( name, slug, property_type, locality_id, localities ( name ) )`
    )
    .eq("transaction", "sale")
    .eq("status", "active")
    .in("kind", ["new_launch", "resale"])
    .in("projects.property_type", propertyTypes);

  if (requirement.bedrooms_wanted?.length) {
    query = query.in("bedrooms", requirement.bedrooms_wanted);
  }
  if (requirement.preferred_localities?.length) {
    query = query.in("projects.locality_id", requirement.preferred_localities);
  }
  if (requirement.budget_min != null) {
    query = query.gte("price_min", requirement.budget_min);
  }
  if (requirement.budget_max != null) {
    query = query.lte("price_min", requirement.budget_max);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);

  if (error) {
    console.error("Failed to find matching listings:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as RawMatchRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    bedrooms: row.bedrooms,
    price_min: row.price_min,
    price_max: row.price_max,
    is_price_on_request: row.is_price_on_request,
    projectName: row.projects.name,
    projectSlug: row.projects.slug,
    localityName: row.projects.localities?.name ?? null,
  }));
}
