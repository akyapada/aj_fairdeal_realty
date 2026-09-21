import Link from "next/link";
import { BadgeCheck, Bed, Building2, MapPin, Maximize2 } from "lucide-react";
import { formatPriceRange } from "@/lib/supabase";
import type { ListingCardData } from "@/lib/types";

export default function ListingCard({ listing }: { listing: ListingCardData }) {
  const project = listing.projects;
  const area = listing.saleable_area_sqft ?? listing.builtup_area_sqft;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="flex flex-col overflow-hidden rounded-[var(--radius)] border transition-shadow hover:shadow-md"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        className="flex aspect-[16/10] items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, var(--surface-3) 0%, var(--surface-2) 55%, var(--surface-3) 100%)",
        }}
      >
        <Building2 size={32} color="var(--ink-3)" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[0.97rem] font-bold" style={{ color: "var(--ink)" }}>
          {listing.title ?? project.name}
        </h3>
        <p className="flex items-center gap-1 text-sm" style={{ color: "var(--ink-2)" }}>
          <MapPin size={13} />
          {project.name} · {project.localities?.name ?? "Hyderabad"}
        </p>
        <p className="tabular text-lg font-extrabold" style={{ color: "var(--ink)" }}>
          {formatPriceRange(listing.price_min, listing.price_max, listing.is_price_on_request)}
        </p>
        <div className="tabular flex flex-wrap gap-x-3 gap-y-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {listing.bedrooms && (
            <span className="inline-flex items-center gap-1">
              <Bed size={14} />
              {listing.bedrooms} BHK
            </span>
          )}
          {area && (
            <span className="inline-flex items-center gap-1">
              <Maximize2 size={14} />
              {Math.round(area)} sqft
            </span>
          )}
          <span className="capitalize">{listing.kind.replace("_", " ")}</span>
        </div>
        <div
          className="font-mono-plex mt-auto flex items-center gap-1.5 border-t pt-2 text-xs"
          style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
        >
          {project.is_rera_registered && project.rera_number ? (
            <span className="inline-flex items-center gap-1">
              <BadgeCheck size={13} />
              RERA {project.rera_number}
            </span>
          ) : (
            <span style={{ color: "var(--warn)" }}>RERA pending</span>
          )}
        </div>
      </div>
    </Link>
  );
}
