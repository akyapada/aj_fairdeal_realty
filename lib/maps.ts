// Maps Embed API ONLY — see CLAUDE.md's Stack table. It's the one Google
// Maps product that's genuinely free and uncapped; never wire in Places,
// Directions, or the traffic-enabled JS API on this key's project.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

export function buildMapEmbedUrl(query: string): string | null {
  if (!KEY || !query.trim()) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${encodeURIComponent(query)}`;
}
