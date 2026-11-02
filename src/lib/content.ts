import { defaultSiteCopy, siteCopyKeys, type SiteCopy } from "@/data/siteCopy";
import { quotes as fallbackQuotes, type Quote } from "@/data/quotes";
import { shows as fallbackShows, type Show } from "@/data/shows";
import { tour } from "@/data/tour";
import { fetchRawSheets } from "@/lib/sheets";

export type SiteContent = {
  copy: SiteCopy;
  shows: Show[];
  quotes: Quote[];
  assets: {
    logoSrc: string;
    posterSrc: string;
    posterSrcMobile: string | null;
    teaserImageSrc: string;
  };
  /** True when at least one sheet tab loaded successfully. */
  fromSheets: boolean;
};

function parseSiteCopy(rows: Record<string, string>[] | null): SiteCopy {
  const copy: SiteCopy = { ...defaultSiteCopy };
  if (!rows) return copy;

  for (const row of rows) {
    const key = (row.key ?? "").trim();
    if (!key || !(key in siteCopyKeys)) continue;
    const field = siteCopyKeys[key as keyof typeof siteCopyKeys];
    const raw = row.value ?? "";

    if (field === "teaserVideoUrl") {
      const trimmed = raw.trim();
      copy.teaserVideoUrl = trimmed.length > 0 ? trimmed : null;
      continue;
    }

    // Keep fallback when the cell is empty — easier incremental editing
    if (raw.trim().length === 0) continue;
    copy[field] = raw.trim();
  }

  return copy;
}

function parseShows(rows: Record<string, string>[] | null): Show[] {
  if (!rows || rows.length === 0) return [...fallbackShows];

  const parsed = rows
    .filter((row) => (row.date ?? "").trim() || (row.venue ?? "").trim())
    .map((row, index) => {
      const date = (row.date ?? "").trim();
      const dateIso = (row.dateIso ?? "").trim();
      const venue = (row.venue ?? "").trim();
      const city = (row.city ?? "").trim();
      const ticket = (row.ticketUrl ?? "").trim();
      const id =
        dateIso && city
          ? `${city.toLowerCase().replace(/\s+/g, "-")}-${dateIso}`
          : `show-${index + 1}`;

      return {
        id,
        date,
        dateIso: dateIso || date,
        venue,
        city,
        ticketUrl: ticket.length > 0 ? ticket : null,
      } satisfies Show;
    });

  return parsed.length > 0 ? parsed : [...fallbackShows];
}

function parseQuotes(rows: Record<string, string>[] | null): Quote[] {
  if (!rows || rows.length === 0) return [...fallbackQuotes];

  const parsed = rows
    .filter((row) => (row.text ?? "").trim())
    .map((row, index) => {
      const text = (row.text ?? "").trim();
      const attribution = (row.attribution ?? "").trim();
      return {
        id: `q${index + 1}`,
        text,
        attribution,
        placeholder: text.startsWith("LUONNOS") || attribution.startsWith("LUONNOS"),
      } satisfies Quote;
    });

  return parsed.length > 0 ? parsed : [...fallbackQuotes];
}

export async function getSiteContent(): Promise<SiteContent> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID?.trim();
  let fromSheets = false;
  let copy = { ...defaultSiteCopy };
  let shows = [...fallbackShows];
  let quotes = [...fallbackQuotes];

  if (spreadsheetId) {
    const raw = await fetchRawSheets(spreadsheetId);
    fromSheets = Boolean(raw.site || raw.shows || raw.quotes);
    if (raw.site) copy = parseSiteCopy(raw.site);
    if (raw.shows) shows = parseShows(raw.shows);
    if (raw.quotes) quotes = parseQuotes(raw.quotes);

    // Prefer sheet tour name/story for assets-adjacent fields already in copy
    if (!raw.site) {
      copy.tourName = tour.name;
      copy.tourTagline = tour.tagline;
      copy.tourStory = tour.story;
      copy.teaserVideoUrl = tour.teaserVideoUrl;
    }
  } else {
    copy.tourName = tour.name;
    copy.tourTagline = tour.tagline;
    copy.tourStory = tour.story;
    copy.teaserVideoUrl = tour.teaserVideoUrl;
  }

  return {
    copy,
    shows,
    quotes,
    assets: {
      logoSrc: tour.logoSrc,
      posterSrc: tour.posterSrc,
      posterSrcMobile: tour.posterSrcMobile,
      teaserImageSrc: tour.teaserImageSrc,
    },
    fromSheets,
  };
}
