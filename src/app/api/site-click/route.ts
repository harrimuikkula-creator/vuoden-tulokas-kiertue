import { NextRequest, NextResponse } from "next/server";
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from "@/lib/sitePulse/discordWebhook";

export const runtime = "nodejs";

const ALLOWED_KINDS = new Set(["ticket", "social"]);
const DEDUPE_MS = 45 * 1000;
const recentClicks = new Map<string, number>();

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

function buildAlert(client: ReturnType<typeof readBody>) {
  if (client.kind === "ticket") {
    const city = client.meta.city || "";
    const venue = client.meta.venue || "";
    const date = client.meta.date || "";
    const place =
      [venue, city].filter(Boolean).join(", ") || client.label || "—";
    return {
      username: "Klikkiseuranta",
      content: "🎫 Lippuklikki",
      title: "Liput · Vuoden Tulokas",
      color: 15844367,
      fields: [
        { name: "Keikka", value: place },
        { name: "Päivä", value: date || "—", inline: true },
        { name: "Aika", value: formatTime(), inline: true },
        { name: "Linkki", value: client.href || "—" },
      ],
      footerText: "vuoden-tulokas-kiertue • ticket",
    };
  }

  const comedian = client.meta.comedian || client.label || "—";
  const platform = client.meta.platform || "some";
  return {
    username: "Klikkiseuranta",
    content: `📱 Someklikki · ${platform}`,
    title: "Some · Vuoden Tulokas",
    color: 5793266,
    fields: [
      { name: "Koomikko", value: comedian, inline: true },
      { name: "Alusta", value: platform, inline: true },
      { name: "Aika", value: formatTime(), inline: true },
      { name: "Linkki", value: client.href || "—" },
    ],
    footerText: "vuoden-tulokas-kiertue • social",
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

    const alert = buildAlert(client);
    const discordOk = await postDiscordEmbed(alert);
    if (!discordOk) {
      return json(502, { error: "Discord webhook failed" });
    }

    return json(200, { ok: true, discord: true });
  } catch (error) {
    console.error("site-click failed", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to record click",
    });
  }
}
