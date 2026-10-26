"use client";

import { useState } from "react";

/** Dwuetapowe potwierdzenie bez okienek przeglądarki: „Usuń” → „Na pewno? Tak / Nie”. */
export function ConfirmButton({
  label,
  question = "Na pewno?",
  onConfirm,
}: {
  label: string;
  question?: string;
  onConfirm: () => Promise<void>;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="h-9 rounded-md border border-line px-3 text-sm text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm" role="group" aria-label={question}>
      <span className="text-red-500">{question}</span>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            await onConfirm();
          } finally {
            setPending(false);
            setAsking(false);
          }
        }}
        className="h-9 rounded-md bg-red-500 px-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Usuwanie…" : "Tak, usuń"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setAsking(false)}
        className="h-9 rounded-md border border-line px-3 text-muted hover:text-foreground"
      >
        Nie
      </button>
    </span>
  );
}
