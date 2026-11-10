/**
 * Brand assets + text fallbacks.
 * Editable copy (name, tagline, story, …) lives in Google Sheets — see README.
 * Image paths stay here (and in `public/`).
 */
export const tour = {
  name: "Vuoden Tulokas Stand Up -kiertue",
  shortName: "Vuoden Tulokas",
  tagline: "Seitsemän koomikkoa. Yksi kiertue.",
  story:
    "LUONNOS Vuoden Tulokas Stand Up -kiertue tuo lavalle seitsemän ainutlaatuista esiintyjää — TEKSTIÄ TÄHÄN.",
  teaserNote: "LUONNOS Teaser tulossa",
  teaserImageSrc: "/tour-teaser.jpg",
  teaserVideoUrl: null as string | null,
  logoSrc: "/tour-logo.jpg",
  /** Desktop hero — alkuperäinen 2400×1350 vaakaposteri */
  posterSrc: "/tour-poster-vaaka.jpg",
  /** Mobiilihero — pystyjuliste */
  posterSrcMobile: "/tour-poster.jpg",
} as const;
