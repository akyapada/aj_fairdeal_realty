import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ListingCard from "@/components/ListingCard";
import { supabase, PUBLIC_LISTING_COLS, PUBLIC_PROJECT_COLS } from "@/lib/supabase";
import type { ListingCardData } from "@/lib/types";

interface LocalityDetail {
  id: number;
  name: string;
  slug: string;
  zone: string | null;
  description: string | null;
}

async function getLocality(slug: string): Promise<LocalityDetail | null> {
  const { data, error } = await supabase
    .from("localities")
    .select("id, name, slug, zone, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load locality:", error.message);
    return null;
  }
  return data;
}

// Same v1 scope as the homepage (see CLAUDE.md): new-launch and resale
// apartments and villas, for sale only — just narrowed to one locality.
async function getListings(localityId: number): Promise<ListingCardData[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(`${PUBLIC_LISTING_COLS}, projects!inner ( ${PUBLIC_PROJECT_COLS} )`)
    .eq("transaction", "sale")
    .in("kind", ["new_launch", "resale"])
    .in("projects.property_type", ["apartment", "villa"])
    .eq("projects.locality_id", localityId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(48);

  if (error) {
    console.error("Failed to load listings:", error.message);
    return [];
  }
  return (data ?? []) as unknown as ListingCardData[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locality = await getLocality(slug);
  if (!locality) return {};

  const zoneSuffix = locality.zone ? `, ${locality.zone} Hyderabad` : ", Hyderabad";

  return {
    title: `Apartments & Villas for Sale in ${locality.name}${zoneSuffix}`,
    description:
      locality.description?.slice(0, 155) ??
      `Browse new-launch and resale apartments and villas for sale in ${locality.name}${zoneSuffix}. Honest, well-structured listings from AJ FairDeal Realty.`,
  };
}

export default async function LocalityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locality = await getLocality(slug);
  if (!locality) notFound();

  const listings = await getListings(locality.id);

  return (
    <div className="flex-1" style={{ background: "var(--paper)" }}>
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-4">
          <Link href="/localities" className="text-sm font-medium" style={{ color: "var(--accent)" }}>
            ← All localities
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
          {locality.zone ? `${locality.zone} Hyderabad` : "Hyderabad"}
        </span>
        <h1 className="mt-1 text-3xl font-extrabold" style={{ color: "var(--ink)" }}>
          Apartments &amp; Villas for Sale in {locality.name}
        </h1>

        {locality.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {locality.description}
          </p>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
            {listings.length} {listings.length === 1 ? "property" : "properties"} in {locality.name}
          </h2>

          {listings.length === 0 ? (
            <div
              className="mt-4 rounded-[var(--radius)] border border-dashed p-10 text-center"
              style={{ borderColor: "var(--line-2)", color: "var(--ink-3)" }}
            >
              No active listings in {locality.name} right now.{" "}
              <Link href="/" style={{ color: "var(--accent)" }}>
                Browse everything
              </Link>{" "}
              instead.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
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
