"use client";

import { useEffect } from "react";
import { trackSiteVisit } from "@/lib/trackSiteVisit";

/** Fires one visit beacon after hydration (skipped on localhost). */
export default function TrackSiteVisit() {
  useEffect(() => {
    trackSiteVisit();
  }, []);

  return null;
}
