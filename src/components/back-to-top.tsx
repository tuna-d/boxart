"use client";

import { useEffect, useState } from "react";

/** Shows once the page has been scrolled one and a half screens down. */
const SHOW_AFTER_SCREENS = 1.5;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > window.innerHeight * SHOW_AFTER_SCREENS);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }}
      className={`fixed right-4 bottom-4 z-50 flex h-12 items-center gap-2 border-2 border-accent bg-screen px-3.5 font-pixel text-sm text-accent shadow-[4px_4px_0_var(--color-shade)] transition-[opacity,translate] hover:bg-accent hover:text-screen md:right-8 md:bottom-8 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 7 5" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className="h-2.5 w-3.5">
        <path d="M3 0h1v1H3zM2 1h3v1H2zM1 2h5v1H1zM0 3h7v2H0z" />
      </svg>
      Top
    </button>
  );
}
