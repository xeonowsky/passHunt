export function EyeIcon({ open, className = "h-4 w-4" }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <path d="M2 12c1-3.5 5-8 10-8s9 4.5 10 8c-1 3.5-5 8-10 8s-9-4.5-10-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c5 0 9 4.5 10 8a11.6 11.6 0 0 1-2.9 4.4M6.6 6.6A11.4 11.4 0 0 0 2 12c1 3.5 5 8 10 8a10 10 0 0 0 5.4-1.6" />
        </>
      )}
    </svg>
  );
}
