"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  label: string;
  error?: string;
  /** Dodatkowa treść pod polem, np. miernik siły hasła */
  children?: ReactNode;
  labelAside?: ReactNode;
};

export function PasswordField({ label, error, children, labelAside, ...input }: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`h-12 w-full rounded-md border bg-background pl-4 pr-12 font-mono text-sm outline-none transition-colors placeholder:font-sans placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 ${
            error ? "border-red-500/70" : "border-line"
          }`}
          {...input}
          onKeyDown={(e) => {
            checkCaps(e);
            input.onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            checkCaps(e);
            input.onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            input.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted transition-colors hover:text-accent-text"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c5 0 9 4.5 10 8a11.6 11.6 0 0 1-2.9 4.4M6.6 6.6A11.4 11.4 0 0 0 2 12c1 3.5 5 8 10 8a10 10 0 0 0 5.4-1.6" />
              </>
            ) : (
              <>
                <path d="M2 12c1-3.5 5-8 10-8s9 4.5 10 8c-1 3.5-5 8-10 8s-9-4.5-10-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {capsLock && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-500" role="status">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 4 4 13h5v6h6v-6h5z" />
          </svg>
          Caps Lock jest włączony
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
