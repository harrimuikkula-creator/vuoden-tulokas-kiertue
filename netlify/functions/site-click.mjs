import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from './lib/discordWebhook.mjs'
import {
  formatComedianTable,
  formatTicketTable,
  incrementClickStats,
} from './lib/clickStats.mjs'

const ALLOWED_KINDS = new Set(['ticket', 'social', 'clip'])
const DEDUPE_MS = 45 * 1000
const recentClicks = new Map()

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function headerMap(headers) {
  const map = {}
  headers.forEach((value, key) => {
    map[key.toLowerCase()] = value
  })
  return map
}

function readClientIp(headers) {
  const nf = String(headers['x-nf-client-connection-ip'] || '').trim()
  if (nf) return nf
  const forwarded = String(headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim()
  if (forwarded) return forwarded
  return String(headers['x-real-ip'] || '').trim()
}

function pruneDedupe(now = Date.now()) {
  for (const [key, expiresAt] of recentClicks) {
    if (expiresAt <= now) recentClicks.delete(key)
  }
}

function readBody(raw) {
  let parsed = {}
  try {
    parsed = JSON.parse(raw || '{}')
  } catch {
    parsed = {}
  }

  const kind = String(parsed.kind || '').trim()
  const meta =
    parsed.meta && typeof parsed.meta === 'object' && !Array.isArray(parsed.meta)
      ? Object.fromEntries(
          Object.entries(parsed.meta)
            .slice(0, 8)
            .map(([key, value]) => [
              String(key).slice(0, 40),
              String(value ?? '').slice(0, 200),
            ]),
        )
      : {}

  return {
    kind,
    label: String(parsed.label || '').slice(0, 200),
    href: String(parsed.href || '').slice(0, 500),
    pageUrl: String(parsed.pageUrl || '').slice(0, 500),
    meta,
  }
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function buildAlert(client, stats) {
  const time = formatTime()
  const comedianTable = formatComedianTable(stats)
  const ticketTable = formatTicketTable(stats)

  if (client.kind === 'ticket') {
    const city = client.meta.city || ''
    const venue = client.meta.venue || ''
    const date = client.meta.date || ''
    const place = [venue, city].filter(Boolean).join(', ') || client.label || '—'
    return {
      username: 'Klikkiseuranta',
      content: `🎫 Lippuklikki · ${place}`,
      title: 'Klikit · Vuoden Tulokas',
      color: 15844367,
      fields: [
        { name: 'Nyt', value: `${place}${date ? ` · ${date}` : ''}` },
        { name: 'Aika', value: time, inline: true },
        {
          name: 'Liput yhteensä',
          value: String(stats?.totals?.ticket || 0),
          inline: true,
        },
        { name: 'Keikat', value: ticketTable },
        { name: 'Koomikot', value: comedianTable },
      ],
      footerText: 'vuoden-tulokas-kiertue • clicks',
    }
  }

  if (client.kind === 'clip') {
    const comedian = client.meta.comedian || client.label || '—'
    const clipLabel = client.meta.clip || 'Klippi'
    return {
      username: 'Klikkiseuranta',
      content: `▶️ Klippi · ${comedian}`,
      title: 'Klikit · Vuoden Tulokas',
      color: 10181046,
      fields: [
        { name: 'Nyt', value: `${comedian} · ${clipLabel}` },
        { name: 'Aika', value: time, inline: true },
        {
          name: 'Klipit yhteensä',
          value: String(stats?.totals?.clip || 0),
          inline: true,
        },
        { name: 'Koomikot', value: comedianTable },
        { name: 'Liput', value: ticketTable },
      ],
      footerText: 'vuoden-tulokas-kiertue • clicks',
    }
  }

  const comedian = client.meta.comedian || client.label || '—'
  const platform = client.meta.platform || 'some'
  return {
    username: 'Klikkiseuranta',
    content: `📱 Someklikki · ${platform} · ${comedian}`,
    title: 'Klikit · Vuoden Tulokas',
    color: 5793266,
    fields: [
      { name: 'Nyt', value: `${comedian} · ${platform}` },
      { name: 'Aika', value: time, inline: true },
      {
        name: 'Some yhteensä',
        value: String(stats?.totals?.social || 0),
        inline: true,
      },
      { name: 'Koomikot', value: comedianTable },
      { name: 'Liput', value: ticketTable },
    ],
    footerText: 'vuoden-tulokas-kiertue • clicks',
  }
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    if (!getDiscordWebhookUrl()) {
      return json(503, { error: 'Discord webhook not configured' })
    }

    const client = readBody(await req.text())
    if (!ALLOWED_KINDS.has(client.kind)) {
      return json(400, { error: 'Unsupported click kind' })
    }
    if (!client.href && !client.label) {
      return json(400, { error: 'Missing click target' })
    }

    const headers = headerMap(req.headers)
    const ip = readClientIp(headers) || 'unknown'
    const dedupeKey = `${ip}:${client.kind}:${client.href || client.label}`
    const now = Date.now()
    pruneDedupe(now)
    if (recentClicks.has(dedupeKey)) {
      return json(200, { ok: true, discord: false, skipped: 'duplicate' })
    }
    recentClicks.set(dedupeKey, now + DEDUPE_MS)

    const stats = await incrementClickStats({
      kind: client.kind,
      comedian: client.meta.comedian || '',
      venue: client.meta.venue || '',
      city: client.meta.city || '',
      showLabel: client.label || '',
    })

    const alert = buildAlert(client, stats)
    const discordOk = await postDiscordEmbed(alert)
    if (!discordOk) {
      return json(502, { error: 'Discord webhook failed' })
    }

    return json(200, {
      ok: true,
      discord: true,
      totals: stats?.totals || null,
    })
  } catch (error) {
    console.error('site-click failed', error)
    return json(500, { error: error?.message || 'Failed to record click' })
  }
}
