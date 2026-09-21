import { Suspense } from "react";
import Link from "next/link";

import FilterPanel from "@/components/FilterPanel";
import ListingCard from "@/components/ListingCard";
import { supabase, PUBLIC_LISTING_COLS, PUBLIC_PROJECT_COLS } from "@/lib/supabase";
import { hasActiveFilters, parseFilters, type SearchParamsInput } from "@/lib/filters";
import { getLocalities } from "@/lib/localities";
import type { ListingCardData } from "@/lib/types";

// v1 scope (see CLAUDE.md): new-launch and resale apartments and villas, for sale only.
async function getListings(filters: ReturnType<typeof parseFilters>, localityIds: number[]) {
  let query = supabase
    .from("listings")
    .select(`${PUBLIC_LISTING_COLS}, projects!inner ( ${PUBLIC_PROJECT_COLS} )`)
    .eq("transaction", "sale")
    .in("kind", filters.kind.length ? filters.kind : ["new_launch", "resale"])
    .in("projects.property_type", filters.propertyType.length ? filters.propertyType : ["apartment", "villa"]);

  if (filters.bhk.length) query = query.in("bedrooms", filters.bhk);
  if (filters.budget.min != null) query = query.gte("price_min", filters.budget.min);
  if (filters.budget.max != null) query = query.lte("price_min", filters.budget.max);
  if (filters.constructionStatus.length) {
    query = query.in("projects.construction_status", filters.constructionStatus);
  }
  if (localityIds.length) query = query.in("projects.locality_id", localityIds);

  const { data, error } = await query
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [] as ListingCardData[];
  }
  return (data ?? []) as unknown as ListingCardData[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParamsInput>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = parseFilters(resolvedSearchParams);
  const filtersActive = hasActiveFilters(filters);

  const localities = await getLocalities();
  const localityIds = localities
    .filter((l) => filters.locality.includes(l.slug))
    .map((l) => l.id);

  const listings = await getListings(filters, localityIds);

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-5 py-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
              AJ FairDeal Realty
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
              New-launch and resale apartments &amp; villas across Hyderabad — honest details, no noise.
            </p>
          </div>
          <Link
            href="/localities"
            className="mt-1 shrink-0 text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            Browse by locality
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-8 md:grid-cols-[240px_1fr]">
        <Suspense fallback={null}>
          <FilterPanel localities={localities} />
        </Suspense>

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              {listings.length} {listings.length === 1 ? "property" : "properties"}
            </h2>
          </div>

          {listings.length === 0 ? (
            <div
              className="rounded-[var(--radius)] border border-dashed p-10 text-center"
              style={{ borderColor: "var(--line-2)", color: "var(--ink-3)" }}
            >
              {filtersActive
                ? "No properties match these filters. Try widening the budget or clearing a locality."
                : "No active listings yet. Publish a project and mark a listing active in the Supabase table editor to see it here."}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
