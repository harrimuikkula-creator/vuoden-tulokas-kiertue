/**
 * Short-window visit alert dedupe by client IP.
 * Uses in-memory store (good enough on warm Vercel instances).
 */

const HUMAN_DEDUP_MS = 3 * 60 * 1000;
const BOT_TWIN_MS = 10 * 60 * 1000;

type DedupeEntry = {
  botSeenAt: number;
  humanAlertedAt: number;
  expiresAt: number;
};

const recentByKey = new Map<string, DedupeEntry>();

function pruneMemory(now = Date.now()) {
  for (const [key, entry] of recentByKey) {
    if (!entry?.expiresAt || entry.expiresAt <= now) recentByKey.delete(key);
  }
}

function normalizeIp(ip: string | null | undefined) {
  return String(ip || "")
    .trim()
    .slice(0, 80);
}

function memoryGet(key: string) {
  pruneMemory();
  const entry = recentByKey.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    recentByKey.delete(key);
    return null;
  }
  return entry;
}

function memorySet(key: string, entry: DedupeEntry) {
  pruneMemory();
  recentByKey.set(key, entry);
}

/** Normal JS beacon from a real browser — must not be silenced by a prior bot mark. */
export function looksLikeBrowserVisit({
  userAgent = "",
  screen = "",
  automation = false,
}: {
  userAgent?: string;
  screen?: string;
  automation?: boolean;
} = {}) {
  if (automation) return false;
  if (!/Mozilla\/\d/i.test(String(userAgent || ""))) return false;
  const match = /^(\d{2,5})x(\d{2,5})$/.exec(String(screen || "").trim());
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width >= 200 && height >= 200;
}

export async function evaluateVisitDedupe({
  ip,
  bot,
  trustHuman = false,
}: {
  ip: string;
  bot: boolean;
  trustHuman?: boolean;
}): Promise<{
  skipDiscord: boolean;
  skipCount: boolean;
  reason: string | null;
}> {
  const exact = normalizeIp(ip);
  if (!exact || exact === "unknown") {
    return { skipDiscord: false, skipCount: false, reason: null };
  }

  const now = Date.now();

  if (bot) {
    memorySet(exact, {
      botSeenAt: now,
      humanAlertedAt: 0,
      expiresAt: now + BOT_TWIN_MS,
    });
    return { skipDiscord: true, skipCount: true, reason: "bot" };
  }

  const exactEntry = memoryGet(exact);

  if (
    !trustHuman &&
    exactEntry?.botSeenAt &&
    now - exactEntry.botSeenAt < BOT_TWIN_MS
  ) {
    return { skipDiscord: true, skipCount: true, reason: "bot-twin" };
  }

  if (
    exactEntry?.humanAlertedAt &&
    now - exactEntry.humanAlertedAt < HUMAN_DEDUP_MS
  ) {
    return { skipDiscord: true, skipCount: true, reason: "duplicate-ip" };
  }

  return { skipDiscord: false, skipCount: false, reason: null };
}

export async function markHumanVisitAlerted(ip: string) {
  const exact = normalizeIp(ip);
  if (!exact || exact === "unknown") return;

  const now = Date.now();
  memorySet(exact, {
    botSeenAt: 0,
    humanAlertedAt: now,
    expiresAt: now + HUMAN_DEDUP_MS,
  });
}

export function readClientIp(
  headers: Record<string, string>,
  fallbackIp = "",
) {
  const forwarded = String(headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  if (forwarded) return forwarded;

  const realIp = String(headers["x-real-ip"] || "").trim();
  if (realIp) return realIp;

  const vercelIp = String(headers["x-vercel-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  if (vercelIp) return vercelIp;

  return String(fallbackIp || "").trim();
}
