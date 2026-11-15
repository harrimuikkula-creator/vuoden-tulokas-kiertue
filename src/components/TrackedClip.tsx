"use client";

import { useEffect, useId, useRef } from "react";
import { trackSiteClick } from "@/lib/trackSiteClick";

type TrackedClipProps = {
  className?: string;
  embedUrl: string;
  sourceUrl: string;
  title: string;
  comedianName: string;
  comedianId: string;
  clipLabel: string;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          events?: {
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => { destroy?: () => void };
      PlayerState?: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoader: Promise<void> | null = null;

function loadYoutubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoader) return apiLoader;

  apiLoader = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return apiLoader;
}

function withApiParams(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("enablejsapi", "1");
    if (typeof window !== "undefined") {
      url.searchParams.set("origin", window.location.origin);
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}

/** YouTube embed that pulses Discord once when playback starts. */
export default function TrackedClip({
  className,
  embedUrl,
  sourceUrl,
  title,
  comedianName,
  comedianId,
  clipLabel,
}: TrackedClipProps) {
  const reactId = useId().replace(/:/g, "");
  const iframeId = `yt-${reactId}`;
  const sentRef = useRef(false);
  const src = withApiParams(embedUrl);

  useEffect(() => {
    let player: { destroy?: () => void } | null = null;
    let cancelled = false;

    loadYoutubeApi().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const playing = window.YT.PlayerState?.PLAYING ?? 1;
      player = new window.YT.Player(iframeId, {
        events: {
          onStateChange: (event) => {
            if (event.data !== playing || sentRef.current) return;
            sentRef.current = true;
            trackSiteClick({
              kind: "clip",
              label: `${comedianName} · ${clipLabel}`,
              href: sourceUrl,
              meta: {
                comedian: comedianName,
                comedianId,
                clip: clipLabel,
                platform: "YouTube",
              },
            });
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        player?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, [iframeId, comedianName, comedianId, clipLabel, sourceUrl]);

  return (
    <iframe
      id={iframeId}
      className={className}
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
