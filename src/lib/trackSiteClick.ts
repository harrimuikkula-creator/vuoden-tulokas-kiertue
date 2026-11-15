export type SiteClickKind = "ticket" | "social";

export type SiteClickPayload = {
  kind: SiteClickKind;
  label: string;
  href: string;
  meta?: Record<string, string>;
};

/**
 * Fire-and-forget click beacon. Skips localhost.
 * Endpoint name avoids common ad-blocker patterns (`track` / `analytics`).
 */
export function trackSiteClick(event: SiteClickPayload) {
  if (typeof window === "undefined") return;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return;

  const payload = {
    kind: event.kind,
    label: String(event.label || "").slice(0, 200),
    href: String(event.href || "").slice(0, 500),
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
