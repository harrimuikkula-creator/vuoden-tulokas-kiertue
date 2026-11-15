/**
 * Persistent click counters for comedians (by platform) and shows (tickets).
 * Stored in Netlify Blobs when available.
 */

const STORE_NAME = 'click-stats'
const STORE_KEY = 'vuoden-tulokas-clicks'

/** Stable column order in Discord tables. */
const PLATFORM_ORDER = [
  'Instagram',
  'TikTok',
  'Facebook',
  'YouTube',
  'Verkkosivu',
  'Klippi',
  'Video',
  'Muu',
]

const PLATFORM_ALIASES = {
  instagram: 'Instagram',
  ig: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  fb: 'Facebook',
  youtube: 'YouTube',
  yt: 'YouTube',
  website: 'Verkkosivu',
  verkkosivu: 'Verkkosivu',
  web: 'Verkkosivu',
  klippi: 'Klippi',
  clip: 'Klippi',
  video: 'Video',
  some: 'Muu',
}

export function emptyClickStats() {
  return {
    comedians: {},
    shows: {},
    platforms: {},
    totals: { social: 0, clip: 0, ticket: 0 },
  }
}

export function normalizePlatform(kind, platform) {
  if (kind === 'clip') return 'Klippi'
  const raw = String(platform || '')
    .trim()
  if (!raw) return kind === 'ticket' ? '' : 'Muu'
  const aliased = PLATFORM_ALIASES[raw.toLowerCase()]
  if (aliased) return aliased
  return raw.slice(0, 24)
}

export function parseClickStats(raw) {
  if (!raw) return emptyClickStats()
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return {
      comedians: sanitizeComedians(parsed?.comedians),
      shows: sanitizeShows(parsed?.shows),
      platforms: sanitizePlatformTotals(parsed?.platforms),
      totals: {
        social: num(parsed?.totals?.social),
        clip: num(parsed?.totals?.clip),
        ticket: num(parsed?.totals?.ticket),
      },
    }
  } catch {
    return emptyClickStats()
  }
}

export function nextClickStats(previous, event) {
  const next = {
    comedians: sanitizeComedians(previous?.comedians),
    shows: sanitizeShows(previous?.shows),
    platforms: sanitizePlatformTotals(previous?.platforms),
    totals: {
      social: num(previous?.totals?.social),
      clip: num(previous?.totals?.clip),
      ticket: num(previous?.totals?.ticket),
    },
  }

  if (event.kind === 'ticket') {
    const showKey =
      label(event.showLabel) ||
      [label(event.venue), label(event.city)].filter(Boolean).join(', ') ||
      'Tuntematon keikka'
    const row = next.shows[showKey] || { ticket: 0 }
    row.ticket = num(row.ticket) + 1
    next.shows[showKey] = row
    next.totals.ticket += 1
    return next
  }

  const comedianKey = label(event.comedian) || 'Tuntematon'
  const platform = normalizePlatform(event.kind, event.platform)
  const row = next.comedians[comedianKey] || emptyComedianRow()

  row.platforms[platform] = num(row.platforms[platform]) + 1
  if (event.kind === 'clip' || platform === 'Klippi') {
    row.clip = num(row.clip) + 1
    next.totals.clip += 1
  } else {
    row.social = num(row.social) + 1
    next.totals.social += 1
  }
  next.comedians[comedianKey] = row
  next.platforms[platform] = num(next.platforms[platform]) + 1
  return next
}

export async function incrementClickStats(event) {
  try {
    const { getStore } = await import('@netlify/blobs')
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
    const token = process.env.NETLIFY_BLOB_READ_WRITE_TOKEN
    const store =
      siteID && token
        ? getStore({ name: STORE_NAME, siteID, token })
        : getStore(STORE_NAME)

    const stored = await store.get(STORE_KEY, { type: 'text' })
    const previous = parseClickStats(stored)
    const next = nextClickStats(previous, event)
    await store.set(STORE_KEY, JSON.stringify(next))
    return next
  } catch (error) {
    console.warn(
      'click stats: Netlify Blobs unavailable',
      error?.message || error,
    )
    return nextClickStats(emptyClickStats(), event)
  }
}

export function formatComedianTable(stats) {
  const rows = Object.entries(stats?.comedians || {})
    .map(([name, counts]) => {
      const platforms = sanitizePlatformTotals(counts?.platforms)
      // Back-compat: old rows only had social/clip totals.
      if (!Object.keys(platforms).length) {
        if (num(counts?.social)) platforms.Muu = num(counts.social)
        if (num(counts?.clip)) platforms.Klippi = num(counts.clip)
      }
      const total =
        Object.values(platforms).reduce((sum, n) => sum + num(n), 0) ||
        num(counts?.social) + num(counts?.clip)
      return { name, platforms, total }
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'fi'))

  if (!rows.length) {
    return '```\nEi vielä koomikkoklikkejä\n```'
  }

  const activePlatforms = PLATFORM_ORDER.filter((platform) =>
    rows.some((row) => num(row.platforms[platform]) > 0),
  )
  for (const row of rows) {
    for (const platform of Object.keys(row.platforms)) {
      if (!activePlatforms.includes(platform) && num(row.platforms[platform]) > 0) {
        activePlatforms.push(platform)
      }
    }
  }

  const nameWidth = Math.max(8, ...rows.map((row) => row.name.length))
  const colWidth = Math.max(
    4,
    ...activePlatforms.map((platform) => platform.length),
  )

  const header = [
    pad('Koomikko', nameWidth),
    ...activePlatforms.map((platform) => pad(shortPlatform(platform), colWidth)),
    pad('Yht', 3),
  ].join('  ')

  const line = [
    '-'.repeat(nameWidth),
    ...activePlatforms.map(() => '-'.repeat(colWidth)),
    '---',
  ].join('  ')

  const body = rows.map((row) =>
    [
      pad(row.name, nameWidth),
      ...activePlatforms.map((platform) =>
        padNum(num(row.platforms[platform]), colWidth),
      ),
      padNum(row.total, 3),
    ].join('  '),
  )

  const platformTotals = activePlatforms.map((platform) =>
    rows.reduce((sum, row) => sum + num(row.platforms[platform]), 0),
  )
  const grand = rows.reduce((sum, row) => sum + row.total, 0)
  const footer = [
    pad('YHTEENSÄ', nameWidth),
    ...platformTotals.map((value) => padNum(value, colWidth)),
    padNum(grand, 3),
  ].join('  ')

  return ['```', header, line, ...body, line, footer, '```'].join('\n')
}

export function formatPlatformTable(stats) {
  const rows = Object.entries(stats?.platforms || {})
    .map(([name, count]) => ({ name, count: num(count) }))
    .filter((row) => row.count > 0)
    .sort((a, b) => {
      const ai = PLATFORM_ORDER.indexOf(a.name)
      const bi = PLATFORM_ORDER.indexOf(b.name)
      if (ai !== bi) {
        if (ai === -1) return 1
        if (bi === -1) return -1
        return ai - bi
      }
      return b.count - a.count || a.name.localeCompare(b.name, 'fi')
    })

  if (!rows.length) {
    return '```\nEi vielä alustaklikkejä\n```'
  }

  const nameWidth = Math.max(6, ...rows.map((row) => row.name.length))
  const header = `${pad('Alusta', nameWidth)}  Klikit`
  const line = `${'-'.repeat(nameWidth)}  ------`
  const body = rows.map(
    (row) => `${pad(row.name, nameWidth)}  ${padNum(row.count, 6)}`,
  )
  const total = rows.reduce((sum, row) => sum + row.count, 0)
  const footer = `${pad('YHTEENSÄ', nameWidth)}  ${padNum(total, 6)}`
  return ['```', header, line, ...body, line, footer, '```'].join('\n')
}

export function formatTicketTable(stats) {
  const rows = Object.entries(stats?.shows || {})
    .map(([name, counts]) => ({
      name,
      ticket: num(counts?.ticket),
    }))
    .filter((row) => row.ticket > 0)
    .sort((a, b) => b.ticket - a.ticket || a.name.localeCompare(b.name, 'fi'))

  if (!rows.length) {
    return '```\nEi vielä lippuklikkejä\n```'
  }

  const nameWidth = Math.max(6, ...rows.map((row) => row.name.length))
  const header = `${pad('Keikka', nameWidth)}  Liput`
  const line = `${'-'.repeat(nameWidth)}  -----`
  const body = rows.map(
    (row) => `${pad(row.name, nameWidth)}  ${padNum(row.ticket, 5)}`,
  )
  const footer = `${pad('YHTEENSÄ', nameWidth)}  ${padNum(num(stats?.totals?.ticket), 5)}`

  return ['```', header, line, ...body, line, footer, '```'].join('\n')
}

function emptyComedianRow() {
  return { social: 0, clip: 0, platforms: {} }
}

function sanitizeComedians(value) {
  if (!value || typeof value !== 'object') return {}
  const clean = {}
  for (const [name, counts] of Object.entries(value)) {
    const key = label(name)
    if (!key || !counts || typeof counts !== 'object') continue
    clean[key] = {
      social: num(counts.social),
      clip: num(counts.clip),
      platforms: sanitizePlatformTotals(counts.platforms),
    }
  }
  return clean
}

function sanitizeShows(value) {
  if (!value || typeof value !== 'object') return {}
  const clean = {}
  for (const [name, counts] of Object.entries(value)) {
    const key = label(name)
    if (!key || !counts || typeof counts !== 'object') continue
    clean[key] = { ticket: num(counts.ticket) }
  }
  return clean
}

function sanitizePlatformTotals(value) {
  if (!value || typeof value !== 'object') return {}
  const clean = {}
  for (const [name, count] of Object.entries(value)) {
    const key = label(name).slice(0, 24)
    const n = num(count)
    if (!key || !n) continue
    clean[key] = n
  }
  return clean
}

function shortPlatform(name) {
  if (name === 'Instagram') return 'IG'
  if (name === 'Facebook') return 'FB'
  if (name === 'YouTube') return 'YT'
  if (name === 'Verkkosivu') return 'Web'
  if (name === 'TikTok') return 'TT'
  if (name === 'Klippi') return 'Klip'
  return name.slice(0, 4)
}

function label(value) {
  return String(value || '')
    .trim()
    .slice(0, 80)
}

function num(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

function pad(text, width) {
  return String(text).padEnd(width, ' ')
}

function padNum(value, width) {
  return String(value).padStart(width, ' ')
}
