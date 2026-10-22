import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} – strona główna`}
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface transition-colors group-hover:border-accent">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-accent-text"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="15" r="4" />
          <path d="M10.85 12.15 19 4" />
          <path d="m18 5 2 2" />
          <path d="m15 8 2 2" />
        </svg>
      </span>
      <span className="font-mono text-lg font-semibold tracking-tight text-foreground">
        pass<span className="text-accent-text">Hunt</span>
      </span>
    </Link>
  );
}
