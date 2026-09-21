import {
  supabase,
  PUBLIC_LISTING_COLS,
  PUBLIC_PROJECT_COLS,
  formatPriceRange,
} from "@/lib/supabase";

interface Locality {
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

// v1 scope (see CLAUDE.md): new-launch and resale apartments and villas, for sale only.
async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`${PUBLIC_LISTING_COLS}, projects!inner ( ${PUBLIC_PROJECT_COLS} )`)
    .eq("transaction", "sale")
    .in("kind", ["new_launch", "resale"])
    .in("projects.property_type", ["apartment", "villa"])
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Listing[];
}

export default async function Home() {
  const listings = await getListings();

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

      <main className="mx-auto max-w-6xl px-5 py-8">
        {listings.length === 0 ? (
          <div
            className="rounded-[var(--radius)] border border-dashed p-10 text-center"
            style={{ borderColor: "var(--line-2)", color: "var(--ink-3)" }}
          >
            No active listings yet. Publish a project and mark a listing active in the Supabase
            table editor to see it here.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-4">
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
      </main>
    </div>
  );
}
