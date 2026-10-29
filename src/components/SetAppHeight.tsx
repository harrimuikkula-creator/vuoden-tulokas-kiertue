"use client";

import { useEffect } from "react";

/** Mobiiliheron korkeus = Safarin näkyvä alue. Ajetaan vasta hydraation jälkeen. */
export default function SetAppHeight() {
  useEffect(() => {
    const apply = () => {
      if (window.scrollY > 2) return;
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${Math.ceil(height)}px`,
      );
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    window.addEventListener("scroll", apply, { passive: true });
    window.visualViewport?.addEventListener("resize", apply);

    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      window.removeEventListener("scroll", apply);
      window.visualViewport?.removeEventListener("resize", apply);
    };
  }, []);

  return null;
}
