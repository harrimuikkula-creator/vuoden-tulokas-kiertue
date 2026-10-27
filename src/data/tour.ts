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
  /** Desktop hero — suositus 2400×1350 (16:9) */
  posterSrc: "/tour-poster.jpg",
  /**
   * Mobiilihero (valinnainen). Kun tiedosto on valmis, aseta polku tähän.
   * Suositus 1080×1920 (9:16) tai 1080×1620.
   */
  posterSrcMobile: null as string | null,
} as const;
