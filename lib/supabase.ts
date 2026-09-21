// =====================================================================
// lib/supabase.ts
//
// The one place the app talks to the database.
//
// v1 has no buyer login, so there is exactly one client, using the
// anon (public) key. Row Level Security in schema.sql is what decides
// what that key can actually see — which is why the RLS policies
// matter more than anything in this file.
//
// NEVER put the service_role key in this project. It bypasses RLS
// entirely. If you ever find yourself pasting a key that starts with
// "eyJ..." and is labelled service_role, stop.
// =====================================================================

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Supabase env vars missing. Copy .env.local.example to .env.local ' +
    'and fill in both values from your Supabase project settings.'
  );
}

export const supabase = createClient(url, anonKey);

// ---------------------------------------------------------------------
// Column lists for public pages.
//
// Use these instead of select('*'). The public listings policy would
// otherwise hand out owner_name and owner_phone to anyone who asks.
// This is the single easiest place to leak data, and an explicit
// column list is the fix.
// ---------------------------------------------------------------------

export const PUBLIC_PROJECT_COLS = `
  id, name, slug, property_type, rera_number, is_rera_registered,
  rera_valid_until, construction_status, possession_date, address,
  latitude, longitude, locality_id, total_units, total_towers, total_floors,
  land_area_acres, open_space_percent, amenities, description,
  meta_title, meta_description,
  builders ( name, slug, established_year ),
  localities ( name, slug, zone )
`;

export const PUBLIC_LISTING_COLS = `
  id, project_id, kind, transaction, title, slug,
  bedrooms, bathrooms, balconies, floor_number,
  carpet_area_sqft, builtup_area_sqft, saleable_area_sqft, plot_area_sqyd,
  facing, furnishing, parking_count, age_years,
  price_min, price_max, price_per_sqft, maintenance_monthly,
  is_price_on_request, units_available, description, highlights, is_featured
`;
// Deliberately absent above: owner_name, owner_phone, owner_notes.

// ---------------------------------------------------------------------
// Money formatting — Hyderabad reads lakhs and crores, not millions.
// ---------------------------------------------------------------------

export function formatINR(n: number | null | undefined): string {
  if (n == null) return 'Price on request';
  if (n >= 10_000_000) {
    const cr = n / 10_000_000;
    const s = cr % 1 === 0 ? String(cr) : cr.toFixed(2).replace(/0$/, '');
    return `₹${s} Cr`;
  }
  return `₹${Math.round(n / 100_000)} L`;
}

export function formatPriceRange(
  min: number | null,
  max: number | null,
  onRequest: boolean
): string {
  if (onRequest) return 'Price on request';
  if (min && max && min !== max) return `${formatINR(min)} – ${formatINR(max)}`;
  return formatINR(min ?? max);
}

// ---------------------------------------------------------------------
// Date & facing formatting — used on project pages.
// ---------------------------------------------------------------------

export function formatMonthYear(date: string | null): string {
  if (!date) return 'TBA';
  return new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export function formatFullDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatFacing(facing: string | null): string {
  if (!facing) return '—';
  return facing
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('-');
}

// ---------------------------------------------------------------------
// Anonymous session id — the thread that ties a stranger's browsing
// to the lead they eventually become. Stored in localStorage so it
// survives across visits on the same device.
// ---------------------------------------------------------------------

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('hp_session');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('hp_session', id);
    }
    return id;
  } catch {
    // private browsing, blocked storage — degrade to a per-page id
    return crypto.randomUUID();
  }
}
