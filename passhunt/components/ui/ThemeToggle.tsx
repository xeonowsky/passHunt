"use client";

import { THEME_STORAGE_KEY } from "@/lib/theme";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* tryb prywatny / zablokowany storage – motyw działa do odświeżenia */
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Przełącz motyw dzień / noc"
      title="Dzień / noc"
      className={`grid h-10 w-10 place-items-center rounded-md border border-line text-foreground transition-colors hover:border-accent hover:text-accent-text ${className}`}
    >
      {/* Słońce – widoczne w trybie nocnym (kliknięcie → dzień) */}
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 light:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {/* Księżyc – widoczny w trybie dziennym (kliknięcie → noc) */}
      <svg
        viewBox="0 0 24 24"
        className="hidden h-5 w-5 light:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
