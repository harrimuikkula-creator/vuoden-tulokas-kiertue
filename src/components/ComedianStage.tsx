"use client";

import Image from "next/image";
import { useEffect, useState, type KeyboardEvent } from "react";
import { clipToEmbedUrl, comedians } from "@/data/comedians";
import styles from "@/app/page.module.css";

const socialLabels: Record<string, string> = {
  instagram: "Instagram",
  website: "Verkkosivu",
  tiktok: "TikTok",
  facebook: "Facebook",
  youtube: "YouTube",
};

const clipSlots = [0, 1] as const;
/** Long enough to read a short intro; a full round of seven takes about a minute. */
const ROTATE_MS = 9_000;

export default function ComedianStage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = comedians.length;
  const comedian = comedians[index];

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    const found = comedians.findIndex((person) => person.id === id);
    if (found >= 0) setIndex(found);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (paused || motion.matches) return;

    let timer = 0;
    const start = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      timer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % count);
      }, ROTATE_MS);
    };

    const onVisibility = () => {
      if (document.hidden) window.clearTimeout(timer);
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused, index, count]);

  function show(next: number) {
    setIndex((next + count) % count);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(index + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(index - 1);
    }
  }

  const socialEntries = Object.entries(comedian.socials).filter(([, url]) => Boolean(url)) as [
    string,
    string,
  ][];

  return (
    <div
      className={styles.comedianDeck}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className={styles.comedianToolbar}>
        <button
          type="button"
          className={styles.comedianArrow}
          onClick={() => show(index - 1)}
          aria-label="Edellinen koomikko"
        >
          ←
        </button>
        <p className={styles.comedianCount}>
          {index + 1} / {count}
        </p>
        <button
          type="button"
          className={styles.comedianArrow}
          onClick={() => show(index + 1)}
          aria-label="Seuraava koomikko"
        >
          →
        </button>
        <ul className={styles.comedianPicker}>
          {comedians.map((person, personIndex) => {
            const active = personIndex === index;
            return (
              <li key={person.id}>
                <button
                  type="button"
                  className={active ? styles.comedianPickActive : styles.comedianPick}
                  aria-current={active ? "true" : undefined}
                  aria-label={person.name}
                  onClick={() => show(personIndex)}
                >
                  {person.initials}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <article key={comedian.id} className={styles.stage} id={comedian.id} aria-label={comedian.name}>
        <div className={styles.photoWrap}>
          {comedian.photo ? (
            <Image
              className={styles.photo}
              src={comedian.photo}
              alt={comedian.name}
              fill
              sizes="(max-width: 860px) 100vw, 32vw"
            />
          ) : (
            <div className={styles.photoFallback} aria-hidden="true">
              {comedian.initials}
            </div>
          )}
        </div>
        {socialEntries.length > 0 ? (
          <ul className={styles.socials}>
            {socialEntries.map(([key, url]) => (
              <li key={key}>
                <a className={styles.socialLink} href={url} target="_blank" rel="noopener noreferrer">
                  {socialLabels[key] ?? key}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.socialNote}>Some tulossa</p>
        )}
        <h3 className={styles.comedianName}>{comedian.name}</h3>
        <p className={styles.comedianBio}>{comedian.bio}</p>
        <ul className={styles.clips}>
          {clipSlots.map((slot) => {
            const url = comedian.clips[slot];
            const embed = url ? clipToEmbedUrl(url) : null;
            const label = `Klippi ${slot + 1}`;
            return (
              <li key={label} className={styles.clipSlot}>
                {embed ? (
                  <iframe
                    className={styles.clipFrame}
                    src={embed}
                    title={`${comedian.name}, ${label}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p className={styles.clipPending}>{label} · tulossa</p>
                )}
              </li>
            );
          })}
        </ul>
      </article>
    </div>
  );
}
