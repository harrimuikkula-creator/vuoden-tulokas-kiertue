import Image from "next/image";
import { comedians, clipToEmbedUrl } from "@/data/comedians";
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
            className={styles.heroPoster}
            src={tour.posterSrc}
            alt=""
            fill
            priority
            sizes="100vw"
          />
          <div className={styles.heroScrim} />
        </div>
        <div className={styles.heroInner}>
          <Image
            className={styles.brandMark}
            src={tour.logoSrc}
            alt={tour.name}
            width={840}
            height={560}
            priority
          />
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
      </header>

      <main>
        <section className={`${styles.section} ${styles.teaser}`} id="tarina">
          <div className={`${styles.sectionInner} ${styles.teaserGrid}`}>
            <div>
              <p className={styles.sectionEyebrow}>Tarina</p>
              <h2 className={styles.sectionTitle}>Kiertue lähtee liikkeelle</h2>
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
                <div className={styles.teaserSlot} role="img" aria-label={tour.teaserNote}>
                  <div>
                    <p className={styles.teaserSlotLabel}>{tour.teaserNote}</p>
                    <p className={styles.teaserSlotHint}>Videoembed päivitetään tähän.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.quotes}`} id="arvostelut">
          <div className={styles.sectionInner}>
            <p className={styles.sectionEyebrow}>Arvostelut</p>
            <h2 className={styles.sectionTitle}>Mitä sanotaan</h2>
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
              Seitsemän koomikkoa — bios, some ja klipit päivittyvät kiertueen myötä.
            </p>
            <ul className={styles.comedianGrid}>
              {comedians.map((comedian) => {
                const socialEntries = Object.entries(comedian.socials).filter(
                  ([, url]) => Boolean(url),
                ) as [string, string][];
                const socialLabels: Record<string, string> = {
                  instagram: "Instagram",
                  website: "Verkkosivu",
                  tiktok: "TikTok",
                  facebook: "Facebook",
                  youtube: "YouTube",
                };

                return (
                  <li key={comedian.id} className={styles.comedian} id={comedian.id}>
                    <div className={styles.photoWrap}>
                      {comedian.photo ? (
                        <Image
                          className={styles.photo}
                          src={comedian.photo}
                          alt={comedian.name}
                          width={640}
                          height={800}
                          sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
                        />
                      ) : (
                        <div className={styles.photoFallback} aria-hidden="true">
                          {comedian.initials}
                        </div>
                      )}
                    </div>
                    <h3 className={styles.comedianName}>{comedian.name}</h3>
                    <p className={styles.comedianBio}>{comedian.bio}</p>
                    {socialEntries.length > 0 ? (
                      <ul className={styles.socials}>
                        {socialEntries.map(([key, url]) => (
                          <li key={key}>
                            <a
                              className={styles.socialLink}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {socialLabels[key] ?? key}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {comedian.clips.length > 0 ? (
                      <div className={styles.clips}>
                        {comedian.clips.map((clip) => {
                          const embed = clipToEmbedUrl(clip);
                          if (!embed) return null;
                          return (
                            <iframe
                              key={clip}
                              className={styles.clipFrame}
                              src={embed}
                              title={`${comedian.name} — klippi`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        })}
                      </div>
                    ) : comedian.placeholder ? (
                      <p className={styles.clipNote}>Klipit tulossa</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>{tour.name}</p>
          <p className={styles.footerCredit}>Stand up -kiertue · Suomi</p>
        </div>
      </footer>
    </div>
  );
}
