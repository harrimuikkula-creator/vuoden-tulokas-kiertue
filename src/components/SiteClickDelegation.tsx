"use client";

import { useEffect } from "react";
import { bindSiteClickDelegation } from "@/lib/trackSiteClick";

/** Document-level backup so tracked links still pulse if React handlers drop. */
export default function SiteClickDelegation() {
  useEffect(() => bindSiteClickDelegation(), []);
  return null;
}
