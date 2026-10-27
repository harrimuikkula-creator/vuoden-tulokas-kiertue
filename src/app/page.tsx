import Image from "next/image";
import ComedianStage from "@/components/ComedianStage";
import { quotes } from "@/data/quotes";
import { shows } from "@/data/shows";
import { tour } from "@/data/tour";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true">
          <Image
            className={`${styles.heroPoster} ${styles.heroPosterDesktop}`}
            src={tour.posterSrc}
            alt=""
            fill
            priority
            sizes="100vw"
          />
          {tour.posterSrcMobile ? (
            <Image
              className={`${styles.heroPoster} ${styles.heroPosterMobile}`}
              src={tour.posterSrcMobile}
              alt=""
              fill
              priority
              sizes="100vw"
            />
          ) : null}
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroBanner}>
          <div className={styles.heroBannerCopy}>
            <p className={styles.heroTagline}>{tour.tagline}</p>
            <div className={styles.ctaGroup}>
              <a className={styles.ctaPrimary} href="#keikat">
                Keikat
              </a>
              <a className={styles.ctaSecondary} href="#koomikot">
                Koomikot
              </a>
            </div>
          </div>
          <Image
            className={styles.brandMark}
            src={tour.logoSrc}
            alt={tour.name}
            width={840}
            height={560}
            priority
          />
        </div>
      </header>

      <main>
        <section className={`${styles.section} ${styles.teaser}`} id="tarina">
          <div className={`${styles.sectionInner} ${styles.teaserGrid}`}>
            <div>
              <p className={styles.sectionEyebrow}>Tarina</p>
              <h2 className={styles.sectionTitle}>LUONNOS Standupin tuoreet kasvot</h2>
              <p className={styles.sectionLead}>{tour.story}</p>
            </div>
            <div>
              {tour.teaserVideoUrl ? (
                <iframe
                  className={styles.teaserFrame}
                  src={tour.teaserVideoUrl}
                  title="Kiertueen teaser"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className={styles.teaserImageWrap}>
                  <Image
                    className={styles.teaserImage}
                    src={tour.teaserImageSrc}
                    alt={`${tour.name} lavalla`}
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
            <p className={styles.sectionEyebrow}>LUONNOS Arvostelut</p>
            <h2 className={styles.sectionTitle}>LUONNOS Mitä sanotaan</h2>
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
            <p className={styles.sectionEyebrow}>Keikat</p>
            <h2 className={styles.sectionTitle}>Missä nähdään</h2>
            <p className={styles.sectionLead}>
              Seuraavat esitykset — lippulinkit päivitetään heti kun ne aukeavat.
            </p>
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
                      Liput
                    </a>
                  ) : (
                    <span className={styles.ticketSoon}>Liput tulossa</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.comedians}`} id="koomikot">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Koomikot</p>
            <h2 className={styles.sectionTitle}>Lavalla</h2>
            <p className={styles.sectionLead}>
              Seitsemän koomikkoa — bios, some ja klipit päivittyvät...
            </p>
            <ComedianStage />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>{tour.name}</p>
          <Image
            className={styles.footerLogo}
            src={tour.logoSrc}
            alt={tour.name}
            width={840}
            height={560}
          />
        </div>
      </footer>
    </div>
  );
}
