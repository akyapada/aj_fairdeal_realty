import { Suspense } from "react";

import FilterPanel from "@/components/FilterPanel";
import {
  supabase,
  PUBLIC_LISTING_COLS,
  PUBLIC_PROJECT_COLS,
  formatPriceRange,
} from "@/lib/supabase";
import { hasActiveFilters, parseFilters, type SearchParamsInput } from "@/lib/filters";

interface Locality {
  id: number;
  name: string;
  slug: string;
  zone: string | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  rera_number: string | null;
  is_rera_registered: boolean;
  localities: Locality | null;
}

interface Listing {
  id: string;
  kind: "new_launch" | "resale" | "rental";
  title: string | null;
  bedrooms: number | null;
  saleable_area_sqft: number | null;
  builtup_area_sqft: number | null;
  price_min: number | null;
  price_max: number | null;
  is_price_on_request: boolean;
  projects: Project;
}

async function getLocalities(): Promise<Locality[]> {
  const { data, error } = await supabase
    .from("localities")
    .select("id, name, slug, zone")
    .order("name");
  if (error) {
    console.error("Failed to load localities:", error.message);
    return [];
  }
  return data ?? [];
}

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
    return [] as Listing[];
  }
  return (data ?? []) as unknown as Listing[];
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
        <div className="mx-auto max-w-6xl px-5 py-6">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
            AJ FairDeal Realty
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            New-launch and resale apartments &amp; villas across Hyderabad — honest details, no noise.
          </p>
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
              {listings.map((listing) => {
                const project = listing.projects;
                const area = listing.saleable_area_sqft ?? listing.builtup_area_sqft;
                return (
                  <article
                    key={listing.id}
                    className="flex flex-col overflow-hidden rounded-[var(--radius)] border"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--line)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div
                      className="aspect-[16/10]"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--surface-3) 0%, var(--surface-2) 55%, var(--surface-3) 100%)",
                      }}
                    />
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="text-[0.97rem] font-bold" style={{ color: "var(--ink)" }}>
                        {listing.title ?? project.name}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--ink-2)" }}>
                        {project.name} · {project.localities?.name ?? "Hyderabad"}
                      </p>
                      <p className="tabular text-lg font-extrabold" style={{ color: "var(--ink)" }}>
                        {formatPriceRange(listing.price_min, listing.price_max, listing.is_price_on_request)}
                      </p>
                      <div
                        className="tabular flex flex-wrap gap-x-3 gap-y-1 text-sm"
                        style={{ color: "var(--ink-2)" }}
                      >
                        {listing.bedrooms && <span>{listing.bedrooms} BHK</span>}
                        {area && <span>{Math.round(area)} sqft</span>}
                        <span className="capitalize">{listing.kind.replace("_", " ")}</span>
                      </div>
                      <div
                        className="font-mono-plex mt-auto flex items-center gap-1.5 border-t pt-2 text-xs"
                        style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
                      >
                        {project.is_rera_registered && project.rera_number ? (
                          <span>RERA {project.rera_number}</span>
                        ) : (
                          <span style={{ color: "var(--warn)" }}>RERA pending</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
