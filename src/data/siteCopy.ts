/** Default UI copy — overridden by Google Sheet "Site" tab when configured. */
export type SiteCopy = {
  tourName: string;
  tourTagline: string;
  tourStory: string;
  metaDescription: string;
  navShows: string;
  navComedians: string;
  storyEyebrow: string;
  storyTitle: string;
  quotesEyebrow: string;
  quotesTitle: string;
  showsEyebrow: string;
  showsTitle: string;
  showsLead: string;
  ticketLabel: string;
  ticketSoon: string;
  comediansEyebrow: string;
  comediansTitle: string;
  comediansLead: string;
  teaserVideoUrl: string | null;
};

/** Maps Google Sheet "Site" keys → SiteCopy fields. */
export const siteCopyKeys = {
  tour_name: "tourName",
  tour_tagline: "tourTagline",
  tour_story: "tourStory",
  meta_description: "metaDescription",
  nav_shows: "navShows",
  nav_comedians: "navComedians",
  story_eyebrow: "storyEyebrow",
  story_title: "storyTitle",
  quotes_eyebrow: "quotesEyebrow",
  quotes_title: "quotesTitle",
  shows_eyebrow: "showsEyebrow",
  shows_title: "showsTitle",
  shows_lead: "showsLead",
  ticket_label: "ticketLabel",
  ticket_soon: "ticketSoon",
  comedians_eyebrow: "comediansEyebrow",
  comedians_title: "comediansTitle",
  comedians_lead: "comediansLead",
  teaser_video_url: "teaserVideoUrl",
} as const satisfies Record<string, keyof SiteCopy>;

export const defaultSiteCopy: SiteCopy = {
  tourName: "Vuoden Tulokas Stand Up -kiertue",
  tourTagline: "Seitsemän koomikkoa. Yksi kiertue.",
  tourStory:
    "LUONNOS Vuoden Tulokas Stand Up -kiertue tuo lavalle seitsemän ainutlaatuista esiintyjää — TEKSTIÄ TÄHÄN.",
  metaDescription:
    "LUONNOS Seitsemän koomikkoa, kaksi keikkaa — Vuoden Tulokas Stand Up -kiertue. Liput ja teaser tulossa.",
  navShows: "Keikat",
  navComedians: "Koomikot",
  storyEyebrow: "Tarina",
  storyTitle: "LUONNOS Standupin tuoreet kasvot",
  quotesEyebrow: "LUONNOS Arvostelut",
  quotesTitle: "LUONNOS Mitä sanotaan",
  showsEyebrow: "Keikat",
  showsTitle: "Missä nähdään",
  showsLead: "Seuraavat esitykset — lippulinkit päivitetään heti kun ne aukeavat.",
  ticketLabel: "Liput",
  ticketSoon: "Liput tulossa",
  comediansEyebrow: "Koomikot",
  comediansTitle: "Lavalla",
  comediansLead: "Seitsemän koomikkoa — bios, some ja klipit päivittyvät...",
  teaserVideoUrl: null,
};
