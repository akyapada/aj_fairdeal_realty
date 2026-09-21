import { supabase } from "@/lib/supabase";

export interface Locality {
  id: number;
  name: string;
  slug: string;
  zone: string | null;
}

export async function getLocalities(): Promise<Locality[]> {
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
