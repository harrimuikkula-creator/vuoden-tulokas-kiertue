export type SiteClickKind = "ticket" | "social" | "clip";

export type SiteClickPayload = {
  kind: SiteClickKind;
  label: string;
  href: string;
  meta?: Record<string, string>;
};

const ATTR = "data-site-click";
const CLIENT_DEDUP_MS = 2_000;
const recentClientClicks = new Map<string, number>();

/**
 * Fire-and-forget click beacon. Skips localhost.
 * Endpoint name avoids common ad-blocker patterns (`track` / `analytics`).
 */
export function trackSiteClick(event: SiteClickPayload) {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return;

  const kind = event.kind;
  const href = String(event.href || "").slice(0, 500);
  const dedupeKey = `${kind}:${href || event.label || ""}`;
  const now = Date.now();
  const last = recentClientClicks.get(dedupeKey) || 0;
  if (now - last < CLIENT_DEDUP_MS) return;
  recentClientClicks.set(dedupeKey, now);

  const payload = {
    kind,
    label: String(event.label || "").slice(0, 200),
    href,
    meta: sanitizeMeta(event.meta),
    pageUrl: window.location.href.slice(0, 500),
  };

  const endpoints = ["/.netlify/functions/site-click", "/api/site-click"];

  const send = (url: string) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });

  send(endpoints[0])
    .then((response) => {
      if (response.ok || response.status === 503) return response;
      return send(endpoints[1]);
    })
    .catch(() => send(endpoints[1]))
    .catch((error) => {
      console.warn("Site click failed.", error);
    });
}

export function siteClickDataAttr(event: SiteClickPayload) {
  return JSON.stringify({
    kind: event.kind,
    label: String(event.label || "").slice(0, 200),
    href: String(event.href || "").slice(0, 500),
    meta: sanitizeMeta(event.meta),
  });
}

/** Capture clicks even if React onClick is missing/stripped. */
export function bindSiteClickDelegation() {
  if (typeof document === "undefined") return () => {};

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const node = target.closest(`[${ATTR}]`);
    if (!(node instanceof HTMLElement)) return;
    const raw = node.getAttribute(ATTR);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SiteClickPayload;
      if (!parsed?.kind) return;
      trackSiteClick({
        kind: parsed.kind,
        label: parsed.label || "",
        href:
          parsed.href ||
          (node instanceof HTMLAnchorElement ? node.href : "") ||
          "",
        meta: parsed.meta,
      });
    } catch {
      // ignore bad payloads
    }
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  return () => document.removeEventListener("pointerdown", onPointerDown, true);
}

export const SITE_CLICK_ATTR = ATTR;

function sanitizeMeta(meta: Record<string, string> | undefined) {
  if (!meta || typeof meta !== "object") return {};
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(meta).slice(0, 8)) {
    const k = String(key || "")
      .trim()
      .slice(0, 40);
    const v = String(value || "")
      .trim()
      .slice(0, 200);
    if (!k || !v) continue;
    clean[k] = v;
  }
  return clean;
}
