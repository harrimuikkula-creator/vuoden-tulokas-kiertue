"use client";

import type { ReactNode, MouseEvent, PointerEvent } from "react";
import {
  SITE_CLICK_ATTR,
  siteClickDataAttr,
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
  const payload = { kind, label, href, meta };

  function pulse() {
    trackSiteClick(payload);
  }

  function onPointerDown(_event: PointerEvent<HTMLAnchorElement>) {
    pulse();
  }

  function onClick(_event: MouseEvent<HTMLAnchorElement>) {
    pulse();
  }

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...{ [SITE_CLICK_ATTR]: siteClickDataAttr(payload) }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
