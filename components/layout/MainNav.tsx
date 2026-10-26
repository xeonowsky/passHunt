"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { mainNav } from "@/lib/site";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { isLoggedInHint, subscribeSessionHint } from "@/lib/auth/session-hint";

export function MainNav() {
  const pathname = usePathname();
  const loggedIn = useSyncExternalStore(subscribeSessionHint, isLoggedInHint, () => false);
  // Menu jest otwarte tylko dla trasy, na której je otwarto –
  // po nawigacji zamyka się samo (bez setState w efekcie).
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean | ((v: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(open) : value;
    setOpenOn(next ? pathname : null);
  };

  // Zamknij menu klawiszem Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Główna nawigacja" className="hidden md:block">
        <ul className="flex items-center gap-8 text-sm">
          {mainNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-muted transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <ThemeToggle />
        {loggedIn ? (
          <Link
            href="/account"
            aria-current={pathname === "/account" ? "page" : undefined}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            <AccountIcon />
            Moje konto
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className={`rounded-md px-3 py-2 text-sm transition-colors hover:text-foreground ${
                pathname === "/login" ? "text-foreground" : "text-muted"
              }`}
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              Załóż konto
            </Link>
          </>
        )}
      </div>

      {/* Mobile: motyw + menu */}
      <div className="flex items-center gap-2 md:hidden">
      <ThemeToggle />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        className="grid h-10 w-10 place-items-center rounded-md border border-line text-foreground md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 6l12 12M18 6 6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-background md:hidden"
      >
        <nav aria-label="Nawigacja mobilna" className="mx-auto max-w-6xl px-4 py-4">
          <ul className="flex flex-col">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-base text-muted transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {loggedIn ? (
            <div className="mt-4 border-t border-line pt-4">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-ink"
              >
                <AccountIcon />
                Moje konto
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-md border border-line px-4 py-2.5 text-center text-sm text-foreground"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-md bg-accent px-4 py-2.5 text-center text-sm font-medium text-accent-ink"
              >
                Załóż konto
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
