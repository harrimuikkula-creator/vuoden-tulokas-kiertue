const SEEN_KEY = "siteVisitSeen:v1";

let requestedThisPage = false;

/**
 * Notify the server of one page load. Server IP-dedupes Discord spam.
 * Endpoint is named `site-pulse` because `record-visit` is commonly blocked.
 */
export function trackSiteVisit() {
  if (typeof window === "undefined" || requestedThisPage) return;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return;

  requestedThisPage = true;

  let returning = false;
  try {
    returning = window.localStorage.getItem(SEEN_KEY) === "1";
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage can be blocked; the visit is still recorded as new.
  }

  const payload = {
    pageUrl: window.location.href,
    referrer: document.referrer || "",
    siteLanguage: readSiteLanguage(),
    screen: readScreen(),
    returning,
    automation: navigator.webdriver === true,
    languageCount: Array.isArray(navigator.languages)
      ? navigator.languages.length
      : 0,
  };

  fetch("/api/site-pulse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    requestedThisPage = false;
    console.warn("Site pulse failed.", error);
  });
}

function readSiteLanguage() {
  const lang = document.documentElement.lang;
  return lang === "en" ? "en" : "fi";
}

function readScreen() {
  const width = window.screen?.width;
  const height = window.screen?.height;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "";
  return `${Math.round(width)}x${Math.round(height)}`;
}
