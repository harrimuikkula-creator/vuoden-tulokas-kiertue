/**
 * Persistent click counters for comedians (social/clip) and shows (tickets).
 * Stored in Netlify Blobs when available.
 */

const STORE_NAME = 'click-stats'
const STORE_KEY = 'vuoden-tulokas-clicks'

export function emptyClickStats() {
  return {
    comedians: {},
    shows: {},
    totals: { social: 0, clip: 0, ticket: 0 },
  }
}

export function parseClickStats(raw) {
  if (!raw) return emptyClickStats()
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return {
      comedians: sanitizeNamedCounts(parsed?.comedians),
      shows: sanitizeNamedCounts(parsed?.shows),
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
    comedians: { ...sanitizeNamedCounts(previous?.comedians) },
    shows: { ...sanitizeNamedCounts(previous?.shows) },
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
  const row = next.comedians[comedianKey] || { social: 0, clip: 0 }
  if (event.kind === 'clip') {
    row.clip = num(row.clip) + 1
    next.totals.clip += 1
  } else {
    row.social = num(row.social) + 1
    next.totals.social += 1
  }
  next.comedians[comedianKey] = row
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
    .map(([name, counts]) => ({
      name,
      social: num(counts?.social),
      clip: num(counts?.clip),
      total: num(counts?.social) + num(counts?.clip),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'fi'))

  if (!rows.length) {
    return '```\nEi vielä koomikkoklikkejä\n```'
  }

  const nameWidth = Math.max(8, ...rows.map((row) => row.name.length))
  const header = `${pad('Koomikko', nameWidth)}  Some  Klipit  Yht`
  const line = `${'-'.repeat(nameWidth)}  ----  ------  ---`
  const body = rows.map(
    (row) =>
      `${pad(row.name, nameWidth)}  ${padNum(row.social, 4)}  ${padNum(row.clip, 6)}  ${padNum(row.total, 3)}`,
  )
  const totals = stats?.totals || {}
  const footer = `${pad('YHTEENSÄ', nameWidth)}  ${padNum(num(totals.social), 4)}  ${padNum(num(totals.clip), 6)}  ${padNum(num(totals.social) + num(totals.clip), 3)}`

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

function sanitizeNamedCounts(value) {
  if (!value || typeof value !== 'object') return {}
  const clean = {}
  for (const [name, counts] of Object.entries(value)) {
    const key = label(name)
    if (!key || !counts || typeof counts !== 'object') continue
    clean[key] = {
      social: num(counts.social),
      clip: num(counts.clip),
      ticket: num(counts.ticket),
    }
  }
  return clean
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
