"use client";

import { useEffect, useRef, useState } from "react";

const CLEAR_AFTER_MS = 30_000;

/** Kopiuje do schowka i czyści go po 30 s (jeśli nadal jest tam skopiowana wartość). */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    timers.current.push(window.setTimeout(() => setCopied(false), 1500));
    timers.current.push(
      window.setTimeout(async () => {
        try {
          if ((await navigator.clipboard.readText()) === value) await navigator.clipboard.writeText("");
        } catch {
          // brak uprawnień do odczytu schowka – nie nadpisujemy cudzej zawartości
        }
      }, CLEAR_AFTER_MS),
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      aria-label={copied ? `${label} skopiowano` : `Kopiuj ${label}`}
      title={copied ? "Skopiowano – schowek wyczyści się za 30 s" : `Kopiuj ${label}`}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        copied ? "border-accent/60 text-accent-text" : "border-line text-muted hover:text-foreground"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {copied ? (
          <path d="M5 12l5 5L20 7" />
        ) : (
          <>
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
    </button>
  );
}
