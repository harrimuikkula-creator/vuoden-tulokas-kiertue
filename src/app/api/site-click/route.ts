import { NextRequest, NextResponse } from "next/server";
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from "@/lib/sitePulse/discordWebhook";

export const runtime = "nodejs";

/**
 * Fallback for local/Next-only deploys.
 * Netlify production uses netlify/functions/site-click.mjs (with Blobs totals).
 */
const ALLOWED_KINDS = new Set(["ticket", "social", "clip"]);
const DEDUPE_MS = 45 * 1000;
const recentClicks = new Map<string, number>();

const PLATFORM_ORDER = [
  "Instagram",
  "TikTok",
  "Facebook",
  "YouTube",
  "Verkkosivu",
  "Klippi",
  "Video",
  "Muu",
] as const;

const PLATFORM_ALIASES: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
  website: "Verkkosivu",
  verkkosivu: "Verkkosivu",
  klippi: "Klippi",
  clip: "Klippi",
  video: "Video",
};

type ClickTotals = {
  comedians: Record<
    string,
    { social: number; clip: number; platforms: Record<string, number> }
  >;
  shows: Record<string, { ticket: number }>;
  platforms: Record<string, number>;
  totals: { social: number; clip: number; ticket: number };
};

const memoryStats: ClickTotals = {
  comedians: {},
  shows: {},
  platforms: {},
  totals: { social: 0, clip: 0, ticket: 0 },
};

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function headerMap(request: NextRequest) {
  const map: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    map[key.toLowerCase()] = value;
  });
  return map;
}

function readClientIp(headers: Record<string, string>) {
  const nf = String(headers["x-nf-client-connection-ip"] || "").trim();
  if (nf) return nf;
  const forwarded = String(headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  if (forwarded) return forwarded;
  return String(headers["x-real-ip"] || "").trim();
}

function pruneDedupe(now = Date.now()) {
  for (const [key, expiresAt] of recentClicks) {
    if (expiresAt <= now) recentClicks.delete(key);
  }
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function pad(text: string, width: number) {
  return text.padEnd(width, " ");
}

function padNum(value: number, width: number) {
  return String(value).padStart(width, " ");
}

function normalizePlatform(kind: string, platform: string) {
  if (kind === "clip") return "Klippi";
  const raw = String(platform || "").trim();
  if (!raw) return "Muu";
  return PLATFORM_ALIASES[raw.toLowerCase()] || raw.slice(0, 24);
}

function shortPlatform(name: string) {
  if (name === "Instagram") return "IG";
  if (name === "Facebook") return "FB";
  if (name === "YouTube") return "YT";
  if (name === "Verkkosivu") return "Web";
  if (name === "TikTok") return "TT";
  if (name === "Klippi") return "Klip";
  return name.slice(0, 4);
}

function formatComedianTable(stats: ClickTotals) {
  const rows = Object.entries(stats.comedians)
    .map(([name, counts]) => {
      const platforms = { ...counts.platforms };
      const total =
        Object.values(platforms).reduce((sum, n) => sum + n, 0) ||
        counts.social + counts.clip;
      return { name, platforms, total };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "fi"));

  if (!rows.length) return "```\nEi vielä koomikkoklikkejä\n```";

  const activePlatforms = PLATFORM_ORDER.filter((platform) =>
    rows.some((row) => (row.platforms[platform] || 0) > 0),
  );
  for (const row of rows) {
    for (const platform of Object.keys(row.platforms)) {
      if (
        !activePlatforms.includes(platform as (typeof PLATFORM_ORDER)[number]) &&
        (row.platforms[platform] || 0) > 0
      ) {
        activePlatforms.push(platform as (typeof PLATFORM_ORDER)[number]);
      }
    }
  }

  const nameWidth = Math.max(8, ...rows.map((row) => row.name.length));
  const colWidth = Math.max(
    4,
    ...activePlatforms.map((platform) => shortPlatform(platform).length),
  );
  const header = [
    pad("Koomikko", nameWidth),
    ...activePlatforms.map((platform) =>
      pad(shortPlatform(platform), colWidth),
    ),
    pad("Yht", 3),
  ].join("  ");
  const line = [
    "-".repeat(nameWidth),
    ...activePlatforms.map(() => "-".repeat(colWidth)),
    "---",
  ].join("  ");
  const body = rows.map((row) =>
    [
      pad(row.name, nameWidth),
      ...activePlatforms.map((platform) =>
        padNum(row.platforms[platform] || 0, colWidth),
      ),
      padNum(row.total, 3),
    ].join("  "),
  );
  const platformTotals = activePlatforms.map((platform) =>
    rows.reduce((sum, row) => sum + (row.platforms[platform] || 0), 0),
  );
  const grand = rows.reduce((sum, row) => sum + row.total, 0);
  const footer = [
    pad("YHTEENSÄ", nameWidth),
    ...platformTotals.map((value) => padNum(value, colWidth)),
    padNum(grand, 3),
  ].join("  ");

  return ["```", header, line, ...body, line, footer, "```"].join("\n");
}

function formatPlatformTable(stats: ClickTotals) {
  const rows = Object.entries(stats.platforms)
    .map(([name, count]) => ({ name, count }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"));

  if (!rows.length) return "```\nEi vielä alustaklikkejä\n```";

  const nameWidth = Math.max(6, ...rows.map((row) => row.name.length));
  const header = `${pad("Alusta", nameWidth)}  Klikit`;
  const line = `${"-".repeat(nameWidth)}  ------`;
  const body = rows.map(
    (row) => `${pad(row.name, nameWidth)}  ${padNum(row.count, 6)}`,
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const footer = `${pad("YHTEENSÄ", nameWidth)}  ${padNum(total, 6)}`;
  return ["```", header, line, ...body, line, footer, "```"].join("\n");
}

function formatTicketTable(stats: ClickTotals) {
  const rows = Object.entries(stats.shows)
    .map(([name, counts]) => ({ name, ticket: counts.ticket || 0 }))
    .filter((row) => row.ticket > 0)
    .sort(
      (a, b) => b.ticket - a.ticket || a.name.localeCompare(b.name, "fi"),
    );

  if (!rows.length) return "```\nEi vielä lippuklikkejä\n```";

  const nameWidth = Math.max(6, ...rows.map((row) => row.name.length));
  const header = `${pad("Keikka", nameWidth)}  Liput`;
  const line = `${"-".repeat(nameWidth)}  -----`;
  const body = rows.map(
    (row) => `${pad(row.name, nameWidth)}  ${padNum(row.ticket, 5)}`,
  );
  const footer = `${pad("YHTEENSÄ", nameWidth)}  ${padNum(stats.totals.ticket, 5)}`;
  return ["```", header, line, ...body, line, footer, "```"].join("\n");
}

function incrementMemory(client: {
  kind: string;
  meta: Record<string, string>;
  label: string;
}) {
  if (client.kind === "ticket") {
    const key =
      [client.meta.venue, client.meta.city].filter(Boolean).join(", ") ||
      client.label ||
      "Tuntematon keikka";
    const row = memoryStats.shows[key] || { ticket: 0 };
    row.ticket += 1;
    memoryStats.shows[key] = row;
    memoryStats.totals.ticket += 1;
    return memoryStats;
  }

  const comedian = client.meta.comedian || "Tuntematon";
  const platform = normalizePlatform(
    client.kind,
    client.meta.platform || client.meta.clip || "",
  );
  const row = memoryStats.comedians[comedian] || {
    social: 0,
    clip: 0,
    platforms: {},
  };
  row.platforms[platform] = (row.platforms[platform] || 0) + 1;
  if (client.kind === "clip" || platform === "Klippi") {
    row.clip += 1;
    memoryStats.totals.clip += 1;
  } else {
    row.social += 1;
    memoryStats.totals.social += 1;
  }
  memoryStats.comedians[comedian] = row;
  memoryStats.platforms[platform] = (memoryStats.platforms[platform] || 0) + 1;
  return memoryStats;
}

function readBody(raw: string) {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const kind = String(parsed.kind || "").trim();
  const metaRaw =
    parsed.meta && typeof parsed.meta === "object" && !Array.isArray(parsed.meta)
      ? (parsed.meta as Record<string, unknown>)
      : {};
  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(metaRaw).slice(0, 8)) {
    meta[String(key).slice(0, 40)] = String(value ?? "").slice(0, 200);
  }

  return {
    kind,
    label: String(parsed.label || "").slice(0, 200),
    href: String(parsed.href || "").slice(0, 500),
    pageUrl: String(parsed.pageUrl || "").slice(0, 500),
    meta,
  };
}

function buildAlert(
  client: ReturnType<typeof readBody>,
  stats: ClickTotals,
) {
  const time = formatTime();
  const comedianTable = formatComedianTable(stats);
  const platformTable = formatPlatformTable(stats);
  const ticketTable = formatTicketTable(stats);

  if (client.kind === "ticket") {
    const place =
      [client.meta.venue, client.meta.city].filter(Boolean).join(", ") ||
      client.label ||
      "—";
    return {
      username: "Klikkiseuranta",
      content: `🎫 Lippuklikki · ${place}`,
      title: "Klikit · Vuoden Tulokas",
      color: 15844367,
      fields: [
        { name: "Nyt", value: place },
        { name: "Aika", value: time, inline: true },
        {
          name: "Liput yhteensä",
          value: String(stats.totals.ticket),
          inline: true,
        },
        { name: "Keikat", value: ticketTable },
        { name: "Koomikot × alustat", value: comedianTable },
        { name: "Alustat", value: platformTable },
      ],
      footerText: "vuoden-tulokas-kiertue • clicks",
    };
  }

  if (client.kind === "clip") {
    const comedian = client.meta.comedian || client.label || "—";
    return {
      username: "Klikkiseuranta",
      content: `▶️ Klippi · ${comedian}`,
      title: "Klikit · Vuoden Tulokas",
      color: 10181046,
      fields: [
        {
          name: "Nyt",
          value: `${comedian} · ${client.meta.clip || "Klippi"}`,
        },
        { name: "Aika", value: time, inline: true },
        {
          name: "Klipit yhteensä",
          value: String(stats.totals.clip),
          inline: true,
        },
        { name: "Koomikot × alustat", value: comedianTable },
        { name: "Alustat", value: platformTable },
        { name: "Liput", value: ticketTable },
      ],
      footerText: "vuoden-tulokas-kiertue • clicks",
    };
  }

  const comedian = client.meta.comedian || client.label || "—";
  const platform = client.meta.platform || "some";
  return {
    username: "Klikkiseuranta",
    content: `📱 ${platform} · ${comedian}`,
    title: "Klikit · Vuoden Tulokas",
    color: 5793266,
    fields: [
      { name: "Nyt", value: `${comedian} · ${platform}` },
      { name: "Aika", value: time, inline: true },
      {
        name: "Klikit yhteensä",
        value: String(stats.totals.social + stats.totals.clip),
        inline: true,
      },
      { name: "Koomikot × alustat", value: comedianTable },
      { name: "Alustat", value: platformTable },
      { name: "Liput", value: ticketTable },
    ],
    footerText: "vuoden-tulokas-kiertue • clicks",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!getDiscordWebhookUrl()) {
      return json(503, { error: "Discord webhook not configured" });
    }

    const client = readBody(await request.text());
    if (!ALLOWED_KINDS.has(client.kind)) {
      return json(400, { error: "Unsupported click kind" });
    }
    if (!client.href && !client.label) {
      return json(400, { error: "Missing click target" });
    }

    const headers = headerMap(request);
    const ip = readClientIp(headers) || "unknown";
    const dedupeKey = `${ip}:${client.kind}:${client.href || client.label}`;
    const now = Date.now();
    pruneDedupe(now);
    if (recentClicks.has(dedupeKey)) {
      return json(200, { ok: true, discord: false, skipped: "duplicate" });
    }
    recentClicks.set(dedupeKey, now + DEDUPE_MS);

    const stats = incrementMemory(client);
    const alert = buildAlert(client, stats);
    const discordOk = await postDiscordEmbed(alert);
    if (!discordOk) {
      return json(502, { error: "Discord webhook failed" });
    }

    return json(200, { ok: true, discord: true, totals: stats.totals });
  } catch (error) {
    console.error("site-click failed", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to record click",
    });
  }
}
