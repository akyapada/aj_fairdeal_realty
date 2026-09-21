"use client";

import { useEffect, useRef } from "react";
import { supabase, getSessionId } from "@/lib/supabase";

// Records one row in `listing_views` per page visit, with how long the
// visitor stayed. Fires on tab-hide, real page unload, and client-side
// route changes (App Router swaps content without unloading the page, so
// unload events alone would miss most navigations away).
export default function ViewTracker({
  projectId,
  listingId,
}: {
  projectId?: string;
  listingId?: string;
}) {
  const startRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    sentRef.current = false;

    function send() {
      if (sentRef.current) return;
      sentRef.current = true;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      supabase
        .rpc("record_listing_view", {
          p_session_id: getSessionId(),
          p_listing_id: listingId ?? null,
          p_project_id: projectId ?? null,
          p_seconds: seconds,
        })
        .then(({ error }) => {
          if (error) console.error("record_listing_view failed:", error.message);
        });
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") send();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", send);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [projectId, listingId]);

  return null;
}
