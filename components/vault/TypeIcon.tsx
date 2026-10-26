import type { EntryType } from "@/lib/crypto/account";
import { ENTRY_TYPES } from "@/lib/vaults/entry-types";

export function TypeIcon({ type, className = "h-5 w-5" }: { type: EntryType; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ENTRY_TYPES[type].icon} />
    </svg>
  );
}
