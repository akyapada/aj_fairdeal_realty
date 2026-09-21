// Shared shapes for the columns selected via PUBLIC_LISTING_COLS /
// PUBLIC_PROJECT_COLS, used anywhere a listing card is rendered.

export interface LocalityRef {
  name: string;
  slug: string;
  zone: string | null;
}

export interface ProjectRef {
  id: string;
  name: string;
  slug: string;
  rera_number: string | null;
  is_rera_registered: boolean;
  localities: LocalityRef | null;
}

export interface ListingCardData {
  id: string;
  kind: "new_launch" | "resale" | "rental";
  title: string | null;
  bedrooms: number | null;
  saleable_area_sqft: number | null;
  builtup_area_sqft: number | null;
  price_min: number | null;
  price_max: number | null;
  is_price_on_request: boolean;
  projects: ProjectRef;
}
