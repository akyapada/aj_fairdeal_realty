// Session-aware Supabase client for server components/actions in the
// /admin area. Reads the session from cookies so RLS policies that check
// auth.uid() (staff read own leads, etc.) apply correctly.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component rendering, not a Server
            // Action/Route Handler — middleware already refreshes the
            // session, so it's safe to ignore here.
          }
        },
      },
    }
  );
}
