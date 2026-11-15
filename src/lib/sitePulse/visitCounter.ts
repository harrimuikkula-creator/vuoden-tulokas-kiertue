import {
  nextVisitStats,
  parseVisitStats,
  type VisitPlace,
  type VisitStats,
} from "./visitStats";

/**
 * Increment persistent visit counter.
 * Prefers Netlify Blobs on Netlify; falls back to Firestore REST.
 * Uses a dedicated key/document so it does not mix with yrityskoomikko stats.
 */
const STATS_COLLECTION = "siteStats";
const STATS_DOCUMENT = "vuoden-tulokas-visits";

export async function incrementVisitCount(
  place: VisitPlace = {},
): Promise<VisitStats | null> {
  const viaBlobs = await incrementViaBlobs(place);
  if (viaBlobs !== null) return viaBlobs;

  return incrementViaFirestoreRest(place);
}

async function getStatsStore() {
  try {
    const { getStore } = await import("@netlify/blobs");
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_BLOB_READ_WRITE_TOKEN;
    return siteID && token
      ? getStore({ name: "site-stats", siteID, token })
      : getStore("site-stats");
  } catch {
    return null;
  }
}

async function incrementViaBlobs(place: VisitPlace) {
  try {
    const store = await getStatsStore();
    if (!store) return null;

    const stored = await store.get("vuoden-tulokas-visit-stats", {
      type: "text",
    });
    const legacyTotal = Number(
      (await store.get("vuoden-tulokas-total-visits", { type: "text" })) || "0",
    );
    const previous = parseVisitStats(stored, legacyTotal);
    if (!stored && Number.isFinite(legacyTotal)) {
      previous.totalVisits = legacyTotal;
    }
    const next = nextVisitStats(previous, place);
    await store.set("vuoden-tulokas-visit-stats", JSON.stringify(next));
    await store.set(
      "vuoden-tulokas-total-visits",
      String(next.totalVisits),
    );
    return next;
  } catch (error) {
    console.warn(
      "visit counter: Netlify Blobs unavailable",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function incrementViaFirestoreRest(place: VisitPlace) {
  const apiKey = (
    process.env.FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY ||
    ""
  ).trim();
  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    ""
  ).trim();

  if (!apiKey || !projectId) return null;

  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const docUrl = `${base}/${STATS_COLLECTION}/${STATS_DOCUMENT}?key=${encodeURIComponent(apiKey)}`;

  try {
    const readResponse = await fetch(docUrl);
    if (readResponse.status === 404) {
      const created = nextVisitStats(parseVisitStats(null, 0), place);
      const createResponse = await fetch(
        `${base}/${STATS_COLLECTION}?documentId=${STATS_DOCUMENT}&key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: firestoreStatsFields(created),
          }),
        },
      );
      if (!createResponse.ok) {
        console.warn(
          "visit counter: Firestore REST create failed",
          createResponse.status,
        );
        return null;
      }
      return created;
    }

    if (!readResponse.ok) {
      console.warn(
        "visit counter: Firestore REST read failed",
        readResponse.status,
      );
      return null;
    }

    const doc = await readResponse.json();
    const current = Number(doc?.fields?.totalVisits?.integerValue || "0");
    const stored = parseVisitStats(
      doc?.fields?.breakdown?.stringValue,
      current,
    );
    stored.totalVisits = Number.isFinite(current)
      ? current
      : stored.totalVisits;
    const next = nextVisitStats(stored, place);

    const patchResponse = await fetch(
      `${docUrl}&updateMask.fieldPaths=totalVisits&updateMask.fieldPaths=breakdown`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: firestoreStatsFields(next),
        }),
      },
    );

    if (!patchResponse.ok) {
      console.warn(
        "visit counter: Firestore REST patch failed",
        patchResponse.status,
      );
      return null;
    }

    return next;
  } catch (error) {
    console.warn(
      "visit counter: Firestore REST unavailable",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function firestoreStatsFields(stats: VisitStats) {
  return {
    totalVisits: { integerValue: String(stats.totalVisits) },
    breakdown: {
      stringValue: JSON.stringify({
        countries: stats.countries,
        cities: stats.cities,
      }),
    },
  };
}
