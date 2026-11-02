import Image from "next/image";
import type { Metadata } from "next";
import ComedianStage from "@/components/ComedianStage";
import { getSiteContent } from "@/lib/content";
import { loadSiteComedians } from "@/lib/publicCast";
import styles from "./page.module.css";

/** Refresh sheet content about once a minute. */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { copy, assets } = await getSiteContent();
  return {
    title: copy.tourName,
    description: copy.metaDescription,
    openGraph: {
      title: copy.tourName,
      description: copy.metaDescription,
      images: [assets.posterSrc],
      locale: "fi_FI",
      type: "website",
    },
  };
}

export default async function Home() {
  const [{ copy, shows, quotes, assets }, lineup] = await Promise.all([
    getSiteContent(),
    loadSiteComedians(),
  ]);
  const teaserVideoUrl = copy.teaserVideoUrl;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <nav className={styles.topBar} aria-label="Päänavigaatio">
          <div className={styles.ctaGroup}>
            <a className={styles.ctaPrimary} href="#keikat">
              {copy.navShows}
            </a>
            <a className={styles.ctaSecondary} href="#koomikot">
              {copy.navComedians}
            </a>
          </div>
        </nav>
        <div className={styles.heroStage}>
          <div className={styles.heroMedia} aria-hidden="true">
            <Image
              className={`${styles.heroPoster} ${styles.heroPosterFill}`}
              src={assets.posterSrc}
              alt=""
              fill
              priority
              sizes="100vw"
            />
            {/* Mobiili: leveyteen skaalautuva posteri — bränditeksti ei leikkaudu */}
            <Image
              className={styles.heroPosterIntrinsic}
              src={assets.posterSrcMobile ?? assets.posterSrc}
              alt=""
              width={1143}
              height={1600}
              priority
              sizes="100vw"
            />
            <div className={styles.heroScrim} />
          </div>
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerCopy}>
              <p className={styles.heroTagline}>{copy.tourTagline}</p>
            </div>
            <Image
              className={styles.brandMark}
              src={assets.logoSrc}
              alt={copy.tourName}
              width={840}
              height={560}
              priority
            />
          </div>
        </div>
      </header>

      <main>
        <section className={`${styles.section} ${styles.teaser}`} id="tarina">
          <div className={`${styles.sectionInner} ${styles.teaserGrid}`}>
            <div>
              <p className={styles.sectionEyebrow}>{copy.storyEyebrow}</p>
              <h2 className={styles.sectionTitle}>{copy.storyTitle}</h2>
              <p className={styles.sectionLead}>{copy.tourStory}</p>
            </div>
            <div>
              {teaserVideoUrl ? (
                <iframe
                  className={styles.teaserFrame}
                  src={teaserVideoUrl}
                  title="Kiertueen teaser"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className={styles.teaserImageWrap}>
                  <Image
                    className={styles.teaserImage}
                    src={assets.teaserImageSrc}
                    alt={`${copy.tourName} lavalla`}
                    width={1600}
                    height={1200}
                    sizes="(max-width: 860px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.quotes}`} id="arvostelut">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>{copy.quotesEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.quotesTitle}</h2>
            <ul className={styles.quoteList}>
              {quotes.map((quote) => (
                <li key={quote.id} className={styles.quoteItem}>
                  <blockquote>
                    <p className={styles.quoteText}>{quote.text}</p>
                    <footer className={styles.quoteAttr}>{quote.attribution}</footer>
                  </blockquote>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.shows}`} id="keikat">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>{copy.showsEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.showsTitle}</h2>
            <p className={styles.sectionLead}>{copy.showsLead}</p>
            <ul className={styles.showList}>
              {shows.map((show) => (
                <li key={show.id} className={styles.showRow}>
                  <time className={styles.showDate} dateTime={show.dateIso}>
                    {show.date}
                  </time>
                  <div>
                    <p className={styles.showVenue}>{show.venue}</p>
                    <p className={styles.showCity}>{show.city}</p>
                  </div>
                  {show.ticketUrl ? (
                    <a
                      className={styles.ticketBtn}
                      href={show.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {copy.ticketLabel}
                    </a>
                  ) : (
                    <span className={styles.ticketSoon}>{copy.ticketSoon}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.comedians}`} id="koomikot">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>{copy.comediansEyebrow}</p>
            <h2 className={styles.sectionTitle}>{copy.comediansTitle}</h2>
            <p className={styles.sectionLead}>{copy.comediansLead}</p>
            <ComedianStage comedians={lineup} />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>{copy.tourName}</p>
          <Image
            className={styles.footerLogo}
            src={assets.logoSrc}
            alt={copy.tourName}
            width={840}
            height={560}
          />
        </div>
      </footer>
    </div>
  );
}
