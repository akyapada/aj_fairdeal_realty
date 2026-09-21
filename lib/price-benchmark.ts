import { supabase } from "@/lib/supabase";

// A locality-wide ₹/sqft average, computed from your own active listings —
// no external data source needed. Requires at least this many comparable
// listings before showing anything; below that, "12% above average" would
// just be comparing a listing to itself, which is meaningless.
const MIN_SAMPLE_SIZE = 3;

export interface PriceBenchmark {
  avgPricePerSqft: number;
  sampleSize: number;
}

export async function getLocalityPriceBenchmark(localityId: number): Promise<PriceBenchmark | null> {
  const { data, error } = await supabase
    .from("listings")
    .select("price_per_sqft, projects!inner(locality_id, property_type)")
    .eq("transaction", "sale")
    .eq("status", "active")
    .in("kind", ["new_launch", "resale"])
    .in("projects.property_type", ["apartment", "villa"])
    .eq("projects.locality_id", localityId)
    .not("price_per_sqft", "is", null);

  if (error) {
    console.error("Failed to load price benchmark:", error.message);
    return null;
  }

  const values = (data ?? [])
    .map((d) => d.price_per_sqft)
    .filter((v): v is number => v != null);

  if (values.length < MIN_SAMPLE_SIZE) return null;

  const avgPricePerSqft = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { avgPricePerSqft, sampleSize: values.length };
}

export function formatDeltaVsBenchmark(pricePerSqft: number, benchmark: PriceBenchmark): string {
  const deltaPercent = Math.round(((pricePerSqft - benchmark.avgPricePerSqft) / benchmark.avgPricePerSqft) * 100);
  if (deltaPercent === 0) return "At area average";
  return deltaPercent > 0 ? `${deltaPercent}% above area average` : `${Math.abs(deltaPercent)}% below area average`;
}
