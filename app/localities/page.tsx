import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { getLocalities } from "@/lib/localities";

export const metadata: Metadata = {
  title: "Browse Localities in Hyderabad",
  description:
    "Explore new-launch and resale apartments and villas for sale across Hyderabad's neighbourhoods — Gachibowli, Kondapur, Kokapet, and more.",
};

export default async function LocalitiesIndexPage() {
  const localities = await getLocalities();

  const zones = new Map<string, typeof localities>();
  for (const loc of localities) {
    const zone = loc.zone ?? "Other";
    if (!zones.has(zone)) zones.set(zone, []);
    zones.get(zone)!.push(loc);
  }

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <SiteHeader backHref="/" backLabel="All properties" />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>
          <MapPin size={22} color="var(--accent)" />
          Browse Hyderabad by locality
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          Apartments and villas for sale, organised the way buyers actually think about the city.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          {[...zones.entries()].map(([zone, locs]) => (
            <div key={zone}>
              <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
                {zone} Hyderabad
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {locs.map((loc) => (
                  <Link
                    key={loc.slug}
                    href={`/localities/${loc.slug}`}
                    className="rounded-full border px-3 py-1.5 text-sm"
                    style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink-2)" }}
                  >
                    {loc.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
