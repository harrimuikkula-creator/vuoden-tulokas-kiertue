import { NextRequest, NextResponse } from "next/server";
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from "@/lib/sitePulse/discordWebhook";
import { incrementVisitCount } from "@/lib/sitePulse/visitCounter";
import {
  evaluateVisitDedupe,
  looksLikeBrowserVisit,
  markHumanVisitAlerted,
  readClientIp,
} from "@/lib/sitePulse/visitDedupe";
import {
  buildVisitAlert,
  classifyVisitor,
  readGeo,
  visitPlace,
} from "@/lib/sitePulse/visitSummary";

export const runtime = "nodejs";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function headerMap(request: NextRequest): Record<string, string> {
  const map: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    map[key.toLowerCase()] = value;
  });
  return map;
}

function readClient(body: string) {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(body || "{}") as Record<string, unknown>;
  } catch {
    parsed = {};
  }

  const siteLanguage =
    parsed.siteLanguage === "en"
      ? "en"
      : parsed.siteLanguage === "fi"
        ? "fi"
        : "";
  const screen = String(parsed.screen || "").slice(0, 20);
  const languageCount = Number(parsed.languageCount);

  return {
    pageUrl: String(parsed.pageUrl || "").slice(0, 500),
    referrer: String(parsed.referrer || "").slice(0, 500),
    siteLanguage,
    screen,
    returning: parsed.returning === true,
    automation: parsed.automation === true,
    languageCount: Number.isFinite(languageCount) ? languageCount : null,
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
    const body = await request.text();
    const client = readClient(body);
    const headers = headerMap(request);
    const userAgent = headers["user-agent"] || "";
    const acceptLanguage = headers["accept-language"] || "";
    const visitor = classifyVisitor({
      userAgent,
      automation: client.automation,
      screen: client.screen,
      hints: {
        webdriver: client.automation === true,
      },
    });

    const geo = readGeo(headers);
    const ip = readClientIp(headers);
    const trustHuman = looksLikeBrowserVisit({
      userAgent,
      screen: client.screen,
      automation: client.automation,
    });
    const dedupe = await evaluateVisitDedupe({
      ip,
      bot: visitor.bot && !visitor.uncertain,
      trustHuman: trustHuman && !visitor.bot && !visitor.uncertain,
    });

    if (visitor.bot || visitor.uncertain || dedupe.skipCount) {
      return json(200, {
        ok: true,
        totalVisits: null,
        bot: visitor.bot,
        uncertain: visitor.uncertain,
        discord: false,
        skipped:
          dedupe.reason ||
          (visitor.bot ? "bot" : visitor.uncertain ? "uncertain" : "dedupe"),
        label: visitor.label || null,
      });
    }

    let stats = null;
    try {
      stats = await incrementVisitCount(visitPlace(geo));
    } catch (counterError) {
      console.warn("site-pulse: visit counter failed", counterError);
    }

    if (dedupe.skipDiscord) {
      return json(200, {
        ok: true,
        totalVisits: stats?.totalVisits ?? null,
        bot: false,
        discord: false,
        skipped: dedupe.reason,
      });
    }

    const alert = buildVisitAlert({
      totalVisits: stats?.totalVisits ?? null,
      countries: stats?.countries ?? null,
      cities: stats?.cities ?? null,
      pageUrl: client.pageUrl,
      referrer: client.referrer,
      siteLanguage: client.siteLanguage,
      screen: client.screen,
      returning: client.returning,
      userAgent,
      automation: client.automation,
      acceptLanguage,
      headers,
      geo,
    });

    const discordOk = await postDiscordEmbed(alert);
    if (discordOk) {
      await markHumanVisitAlerted(ip);
    }

    if (!discordOk && !getDiscordWebhookUrl()) {
      return json(503, { error: "Discord webhook not configured" });
    }

    return json(200, {
      ok: true,
      totalVisits: stats?.totalVisits ?? null,
      bot: false,
      discord: discordOk,
    });
  } catch (error) {
    console.error("site-pulse failed", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Failed to record visit",
    });
  }
}
