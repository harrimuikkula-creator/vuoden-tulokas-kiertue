import { parseCsv, rowsToObjects } from "@/lib/csv";

export type SheetTab = "Site" | "Shows" | "Quotes";

function sheetCsvUrl(spreadsheetId: string, tab: SheetTab): string {
  const params = new URLSearchParams({
    tqx: "out:csv",
    sheet: tab,
  });
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params}`;
}

async function fetchSheetRows(
  spreadsheetId: string,
  tab: SheetTab,
): Promise<Record<string, string>[] | null> {
  const url = sheetCsvUrl(spreadsheetId, tab);
  try {
    const res = await fetch(url, {
      // Next.js data cache — paired with page `revalidate`
      next: { revalidate: 60, tags: ["site-content"] },
    });
    if (!res.ok) {
      console.warn(`[sheets] ${tab} HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    // Unpublished / private sheets often return HTML login pages
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      console.warn(`[sheets] ${tab} returned HTML — share the sheet as "Anyone with the link can view"`);
      return null;
    }
    return rowsToObjects(parseCsv(text));
  } catch (err) {
    console.warn(`[sheets] ${tab} fetch failed`, err);
    return null;
  }
}

export type RawSheets = {
  site: Record<string, string>[] | null;
  shows: Record<string, string>[] | null;
  quotes: Record<string, string>[] | null;
};

export async function fetchRawSheets(spreadsheetId: string): Promise<RawSheets> {
  const [site, shows, quotes] = await Promise.all([
    fetchSheetRows(spreadsheetId, "Site"),
    fetchSheetRows(spreadsheetId, "Shows"),
    fetchSheetRows(spreadsheetId, "Quotes"),
  ]);
  return { site, shows, quotes };
}
