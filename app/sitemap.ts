import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { getLocalities } from "@/lib/localities";

const BASE_URL = "https://homyrealty.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [localities, { data: projects }] = await Promise.all([
    getLocalities(),
    supabase.from("projects").select("slug, updated_at").eq("is_published", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/localities`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const localityRoutes: MetadataRoute.Sitemap = localities.map((l) => ({
    url: `${BASE_URL}/localities/${l.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const projectRoutes: MetadataRoute.Sitemap = (projects ?? []).map((p) => ({
    url: `${BASE_URL}/projects/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...localityRoutes, ...projectRoutes];
}
