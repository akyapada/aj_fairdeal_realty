import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  supabase,
  PUBLIC_PROJECT_COLS,
  PUBLIC_LISTING_COLS,
  formatPriceRange,
  formatINR,
  formatMonthYear,
  formatFullDate,
  formatFacing,
} from "@/lib/supabase";
import { getLocalities } from "@/lib/localities";
import EnquiryForm from "@/components/EnquiryForm";
import ViewTracker from "@/components/ViewTracker";

interface Locality {
  name: string;
  slug: string;
  zone: string | null;
}

interface Builder {
  name: string;
  slug: string;
  established_year: number | null;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  property_type: "apartment" | "villa" | "plot" | "commercial";
  rera_number: string | null;
  is_rera_registered: boolean;
  rera_valid_until: string | null;
  construction_status: string;
  possession_date: string | null;
  address: string | null;
  total_units: number | null;
  total_towers: number | null;
  total_floors: number | null;
  land_area_acres: number | null;
  open_space_percent: number | null;
  amenities: string[];
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  builders: Builder | null;
  localities: Locality | null;
}

interface Listing {
  id: string;
  kind: "new_launch" | "resale" | "rental";
  title: string | null;
  bedrooms: number | null;
  floor_number: number | null;
  age_years: number | null;
  saleable_area_sqft: number | null;
  builtup_area_sqft: number | null;
  carpet_area_sqft: number | null;
  facing: string | null;
  price_min: number | null;
  price_max: number | null;
  price_per_sqft: number | null;
  is_price_on_request: boolean;
  units_available: number | null;
}

interface Media {
  id: string;
  kind: string;
  url: string;
  caption: string | null;
}

const CONSTRUCTION_STATUS_LABELS: Record<string, string> = {
  pre_launch: "Pre-launch",
  under_construction: "Under construction",
  nearing_possession: "Nearing possession",
  ready_to_move: "Ready to move",
  completed: "Completed",
};

async function getProject(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PUBLIC_PROJECT_COLS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load project:", error.message);
    return null;
  }
  return data as unknown as Project | null;
}

async function getListings(projectId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(PUBLIC_LISTING_COLS)
    .eq("project_id", projectId)
    .eq("transaction", "sale")
    .eq("status", "active")
    .in("kind", ["new_launch", "resale"])
    .order("bedrooms")
    .order("price_min");

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Listing[];
}

async function getMedia(projectId: string): Promise<Media[]> {
  const { data, error } = await supabase
    .from("media")
    .select("id, kind, url, caption")
    .eq("project_id", projectId)
    .order("sort_order");

  if (error) {
    console.error("Failed to load media:", error.message);
    return [];
  }
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};

  return {
    title: project.meta_title ?? `${project.name} — ${project.localities?.name ?? "Hyderabad"}`,
    description:
      project.meta_description ??
      `${project.name} by ${project.builders?.name ?? "an unnamed builder"} in ${project.localities?.name ?? "Hyderabad"}. RERA ${project.rera_number ?? "pending"}.`,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const [listings, media, localities] = await Promise.all([
    getListings(project.id),
    getMedia(project.id),
    getLocalities(),
  ]);

  const startingPrice = listings.reduce<number | null>((min, l) => {
    if (l.price_min == null) return min;
    return min == null ? l.price_min : Math.min(min, l.price_min);
  }, null);

  const heroImage = media.find((m) => m.kind === "image");

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <ViewTracker projectId={project.id} />
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-4">
          <Link href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            ← All properties
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 py-8 lg:grid-cols-[1fr_310px] lg:items-start">
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
              {project.localities?.name ?? "Hyderabad"}
              {project.localities?.zone ? `, ${project.localities.zone} Hyderabad` : ""}
            </span>
            <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "var(--ink)" }}>
              {project.name}
            </h1>
            {project.builders && (
              <p className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
                By {project.builders.name}
                {project.builders.established_year ? ` · est. ${project.builders.established_year}` : ""}
              </p>
            )}
          </div>

          <div
            className="aspect-[16/7] overflow-hidden rounded-[var(--radius)] border"
            style={{
              borderColor: "var(--line)",
              background: heroImage
                ? undefined
                : "linear-gradient(120deg, var(--surface-3), var(--surface-2) 60%, var(--surface-3))",
            }}
          >
            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage.url}
                alt={heroImage.caption ?? project.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* TG-RERA: must be prominent on every project advertisement. */}
          <div
            className="flex flex-wrap items-center gap-2.5 rounded-lg border p-3.5"
            style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
          >
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "var(--warn)", color: "var(--surface)" }}
            >
              TG-RERA
            </span>
            {project.is_rera_registered && project.rera_number ? (
              <>
                <span
                  className="font-mono-plex text-base font-semibold"
                  style={{ color: "var(--warn)" }}
                >
                  {project.rera_number}
                </span>
                <span className="text-sm" style={{ color: "var(--ink-2)" }}>
                  Valid to {formatFullDate(project.rera_valid_until)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold" style={{ color: "var(--warn)" }}>
                RERA registration pending — verify before booking
              </span>
            )}
          </div>
          <p className="-mt-3 text-xs" style={{ color: "var(--ink-3)" }}>
            Legally required on every advertisement, print or digital.
          </p>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border sm:grid-cols-3" style={{ background: "var(--line)", borderColor: "var(--line)" }}>
            {[
              ["Status", CONSTRUCTION_STATUS_LABELS[project.construction_status] ?? project.construction_status],
              ["Possession", formatMonthYear(project.possession_date)],
              ["Towers", project.total_towers ?? "—"],
              ["Units", project.total_units ?? "—"],
              ["Land area", project.land_area_acres ? `${project.land_area_acres} acres` : "—"],
              ["Open space", project.open_space_percent ? `${project.open_space_percent}%` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 p-3" style={{ background: "var(--surface)" }}>
                <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
                  {label}
                </dt>
                <dd className="tabular font-semibold" style={{ color: "var(--ink)" }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {project.description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {project.description}
            </p>
          )}

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
              Available configurations
            </h2>
            <div
              className="mt-2 overflow-x-auto rounded-[var(--radius)] border"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              {listings.length === 0 ? (
                <p className="p-4 text-sm" style={{ color: "var(--ink-3)" }}>
                  No active listings for this project right now.
                </p>
              ) : (
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {["Configuration", "Saleable", "Facing", "Price", listings.some((l) => l.kind === "new_launch") ? "Available" : "Floor"].map(
                        (h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--ink-3)" }}
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((l) => {
                      const area = l.saleable_area_sqft ?? l.builtup_area_sqft ?? l.carpet_area_sqft;
                      return (
                        <tr key={l.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                          <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                            {l.title ?? (l.bedrooms ? `${l.bedrooms} BHK` : "—")}
                          </td>
                          <td className="tabular whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                            {area ? `${Math.round(area).toLocaleString("en-IN")} sqft` : "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                            {formatFacing(l.facing)}
                          </td>
                          <td className="tabular whitespace-nowrap px-3 py-2.5 font-semibold" style={{ color: "var(--ink)" }}>
                            {formatPriceRange(l.price_min, l.price_max, l.is_price_on_request)}
                          </td>
                          <td className="tabular whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink)" }}>
                            {l.kind === "new_launch"
                              ? l.units_available ?? "—"
                              : l.floor_number != null
                                ? `Floor ${l.floor_number}`
                                : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {project.amenities.length > 0 && (
            <div
              className="rounded-[var(--radius)] border p-4"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
                Amenities
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {project.amenities.map((a) => (
                  <span
                    key={a}
                    className="rounded-full px-2.5 py-1 text-sm capitalize"
                    style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
                  >
                    {a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <div
            className="rounded-[var(--radius)] border p-4"
            style={{ borderColor: "var(--line)", background: "var(--surface)", boxShadow: "var(--shadow)" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
              Starting from
            </span>
            <div
              className="tabular mt-1 text-2xl font-extrabold"
              style={{ color: "var(--ink)", fontFamily: "var(--font-bricolage)" }}
            >
              {startingPrice != null ? formatINR(startingPrice) : "Price on request"}
            </div>
          </div>

          <div
            className="rounded-[var(--radius)] border p-4"
            style={{ borderColor: "var(--line)", background: "var(--surface)", boxShadow: "var(--shadow)" }}
          >
            <EnquiryForm
              listings={listings.map((l) => ({
                id: l.id,
                label: l.title ?? (l.bedrooms ? `${l.bedrooms} BHK` : "Configuration"),
              }))}
              localities={localities}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}
