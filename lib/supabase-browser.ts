// Session-aware Supabase client for the /admin area, used from client
// components. Public pages use the plain anon client in lib/supabase.ts —
// this one exists only so admin RLS policies (which check auth.uid())
// have a session to check.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
