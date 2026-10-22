"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Siatka z seledynową poświatą podążającą za kursorem.
 * - podświetla linie siatki (obramowania) najbliżej kursora,
 * - rozjaśnia wnętrze kart oznaczonych [data-spotlight-card].
 * Kursor jest śledzony na całej stronie, więc poświata „dojeżdża”
 * do siatki także wtedy, gdy kursor jest tuż obok niej.
 */
export function SpotlightGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Na ekranach dotykowych nie ma kursora – efekt wyłączony
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let x = -9999;
    let y = -9999;
    let raf = 0;

    const setVars = (node: HTMLElement) => {
      const r = node.getBoundingClientRect();
      node.style.setProperty("--mx", `${x - r.left}px`);
      node.style.setProperty("--my", `${y - r.top}px`);
    };

    const update = () => {
      raf = 0;
      setVars(el);
      el.querySelectorAll<HTMLElement>("[data-spotlight-card]").forEach(setVars);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      schedule();
    };

    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget === null) {
        x = -9999;
        y = -9999;
        schedule();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="spotlight rounded-xl p-px">
      <div className={`grid gap-px overflow-hidden rounded-[11px] ${className}`}>
        {children}
      </div>
    </div>
  );
}
