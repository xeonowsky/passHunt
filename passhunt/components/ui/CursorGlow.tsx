"use client";

import { useEffect } from "react";

/**
 * Globalna seledynowa poświata podążająca za kursorem po całej stronie.
 * Ustawia zmienne --cx / --cy na <html>, a warstwa .cursor-glow
 * (pointer-events: none) rysuje gradient w tym miejscu.
 */
export function CursorGlow() {
  useEffect(() => {
    // Ekrany dotykowe – brak kursora, brak efektu
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const root = document.documentElement;
    let x = -9999;
    let y = -9999;
    let raf = 0;

    const update = () => {
      raf = 0;
      root.style.setProperty("--cx", `${x}px`);
      root.style.setProperty("--cy", `${y}px`);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      root.dataset.cursor = "on";
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget === null) root.dataset.cursor = "off";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      cancelAnimationFrame(raf);
      delete root.dataset.cursor;
    };
  }, []);

  return <div aria-hidden="true" className="cursor-glow" />;
}
