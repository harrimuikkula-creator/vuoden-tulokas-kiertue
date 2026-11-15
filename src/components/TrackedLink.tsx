"use client";

import type { ReactNode, MouseEvent } from "react";
import {
  trackSiteClick,
  type SiteClickKind,
} from "@/lib/trackSiteClick";

type TrackedLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  kind: SiteClickKind;
  label: string;
  meta?: Record<string, string>;
};

/** External link that sends a Discord click pulse before navigation. */
export default function TrackedLink({
  href,
  className,
  children,
  kind,
  label,
  meta,
}: TrackedLinkProps) {
  function onClick(_event: MouseEvent<HTMLAnchorElement>) {
    trackSiteClick({ kind, label, href, meta });
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {children}
    </a>
  );
}
