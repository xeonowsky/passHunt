"use client";

import { useState, type ClipboardEvent } from "react";
import { EyeIcon } from "@/components/vault/EyeIcon";
import { ENV_LIMITS } from "@/lib/limits";
import { ALL_ENV_TARGETS, ENV_TARGETS } from "@/lib/vaults/entry-types";
import { looksLikeDotenv, parseDotenv, type DotenvVar } from "@/lib/vaults/dotenv";

export type EnvRow = { id: number; key: string; value: string; envs: string[] };

let nextId = 0;
export const newEnvRow = (v: Partial<EnvRow> = {}): EnvRow => ({
  id: ++nextId,
  key: "",
  value: "",
  envs: [...ALL_ENV_TARGETS],
  ...v,
});

type Props = {
  rows: EnvRow[];
  onChange: (rows: EnvRow[]) => void;
  errors: Record<string, string>;
};

const input =
  "h-11 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none transition-colors placeholder:font-sans placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25";

/** Scala zmienne z .env: istniejący klucz dostaje nową wartość, nowe trafiają na koniec. */
function mergeVars(rows: EnvRow[], vars: DotenvVar[], replaceId?: number): EnvRow[] {
  let next = rows.filter((r) => !(r.id === replaceId && !r.key.trim() && !r.value));
  for (const v of vars) {
    const existing = next.find((r) => r.key === v.key);
    if (existing) next = next.map((r) => (r.id === existing.id ? { ...r, value: v.value } : r));
    else next = [...next, newEnvRow({ key: v.key, value: v.value })];
  }
  return next.slice(0, ENV_LIMITS.vars);
}

export function EnvVarsEditor({ rows, onChange, errors }: Props) {
  const [visible, setVisible] = useState<Set<number>>(() => new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importInfo, setImportInfo] = useState<string | null>(null);

  const update = (id: number, patch: Partial<EnvRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  function toggleEnv(row: EnvRow, env: string) {
    const envs = row.envs.includes(env) ? row.envs.filter((e) => e !== env) : [...row.envs, env];
    update(row.id, { envs: ALL_ENV_TARGETS.filter((e) => envs.includes(e)) });
  }

  // Jak w Vercel: wklejenie całego .env w pole klucza rozbija go na zmienne.
  function onKeyPaste(e: ClipboardEvent<HTMLInputElement>, row: EnvRow) {
    const text = e.clipboardData.getData("text");
    if (!looksLikeDotenv(text)) return;
    e.preventDefault();
    const vars = parseDotenv(text);
    if (vars.length) onChange(mergeVars(rows, vars, row.id));
  }

  function importDotenv() {
    const vars = parseDotenv(importText);
    if (!vars.length) {
      setImportInfo("Nie znaleziono żadnych zmiennych w formacie KLUCZ=wartość.");
      return;
    }
    onChange(mergeVars(rows, vars, rows.length === 1 ? rows[0].id : undefined));
    setImportText("");
    setImportOpen(false);
    setImportInfo(`Zaimportowano ${vars.length} ${vars.length === 1 ? "zmienną" : "zmiennych"}.`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Zmienne <span className="font-mono text-xs text-muted">{rows.length}/{ENV_LIMITS.vars}</span>
        </p>
        <button
          type="button"
          onClick={() => setImportOpen((v) => !v)}
          aria-expanded={importOpen}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
          </svg>
          Importuj .env
        </button>
      </div>

      <p className="text-xs text-muted">
        Wskazówka: wklej całą zawartość pliku <span className="font-mono">.env</span> w pole „Klucz” – zmienne
        rozdzielą się same.
      </p>

      {importInfo && <p className="text-sm text-accent-text" role="status">{importInfo}</p>}

      {importOpen && (
        <div className="space-y-2 rounded-lg border border-line bg-background p-3">
          <textarea
            aria-label="Zawartość pliku .env"
            rows={6}
            autoFocus
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={"DATABASE_URL=postgres://…\nAUTH_SECRET=…"}
            spellCheck={false}
            className="w-full resize-y rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setImportOpen(false)} className="h-9 rounded-md border border-line px-3 text-sm text-muted hover:text-foreground">
              Anuluj
            </button>
            <button type="button" onClick={importDotenv} className="h-9 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90">
              Dodaj zmienne
            </button>
          </div>
        </div>
      )}

      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_auto] gap-2 px-1 text-xs text-muted sm:grid">
        <span>Klucz</span>
        <span>Wartość</span>
        <span className="w-[13.5rem]">Środowiska</span>
        <span className="w-11" />
      </div>

      {rows.map((row) => {
        const show = visible.has(row.id);
        const keyError = errors[`env-key-${row.id}`];
        return (
          <div key={row.id} className="space-y-1">
            <div className="grid gap-2 rounded-lg border border-line p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto_auto] sm:items-center sm:border-0 sm:p-0">
              <input
                aria-label="Klucz"
                placeholder="np. DATABASE_URL"
                maxLength={ENV_LIMITS.key}
                value={row.key}
                spellCheck={false}
                autoCapitalize="characters"
                onPaste={(e) => onKeyPaste(e, row)}
                onChange={(e) => update(row.id, { key: e.target.value.replace(/\s/g, "") })}
                className={`${input} ${keyError ? "border-red-500/70" : "border-line"}`}
              />
              <div className="relative">
                <input
                  aria-label={`Wartość ${row.key}`}
                  placeholder="Wartość"
                  type={show ? "text" : "password"}
                  maxLength={ENV_LIMITS.value}
                  value={row.value}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => update(row.id, { value: e.target.value })}
                  className={`${input} border-line pr-11`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisible((s) => {
                      const n = new Set(s);
                      if (n.has(row.id)) n.delete(row.id);
                      else n.add(row.id);
                      return n;
                    })
                  }
                  aria-label={show ? "Ukryj wartość" : "Pokaż wartość"}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-accent-text"
                >
                  <EyeIcon open={!show} />
                </button>
              </div>
              <div className="flex gap-1" role="group" aria-label={`Środowiska ${row.key}`}>
                {ENV_TARGETS.map((t) => {
                  const on = row.envs.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      aria-pressed={on}
                      title={t.label}
                      onClick={() => toggleEnv(row, t.key)}
                      className={`h-11 w-[4.4rem] rounded-md border text-xs transition-colors ${
                        on ? "border-accent/60 bg-accent/10 text-foreground" : "border-line text-muted/70 line-through hover:text-muted"
                      }`}
                    >
                      {t.short}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => onChange(rows.length === 1 ? [newEnvRow()] : rows.filter((r) => r.id !== row.id))}
                aria-label={`Usuń zmienną ${row.key}`}
                className="grid h-11 w-11 place-items-center rounded-md border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            {(keyError || errors[`env-envs-${row.id}`]) && (
              <p className="text-sm text-red-500">{keyError ?? errors[`env-envs-${row.id}`]}</p>
            )}
          </div>
        );
      })}

      {errors.envEmpty && <p className="text-sm text-red-500">{errors.envEmpty}</p>}

      {rows.length < ENV_LIMITS.vars && (
        <button
          type="button"
          onClick={() => onChange([...rows, newEnvRow()])}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-line px-4 text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Dodaj kolejną
        </button>
      )}
    </div>
  );
}

/** Błędy walidacji zmiennych: format klucza, brak środowiska, duplikaty w tym samym środowisku. */
export function validateEnvRows(rows: EnvRow[], keyPattern: RegExp): Record<string, string> {
  const errors: Record<string, string> = {};
  const filled = rows.filter((r) => r.key.trim() || r.value);
  if (!filled.length) errors.envEmpty = "Dodaj co najmniej jedną zmienną.";
  const seen = new Map<string, Set<string>>();
  for (const r of filled) {
    if (!r.key.trim()) errors[`env-key-${r.id}`] = "Podaj klucz zmiennej.";
    else if (!keyPattern.test(r.key)) errors[`env-key-${r.id}`] = "Klucz: litery, cyfry i _ (nie może zaczynać się cyfrą).";
    else {
      const envs = seen.get(r.key) ?? new Set<string>();
      if (r.envs.some((e) => envs.has(e))) errors[`env-key-${r.id}`] = `Zmienna ${r.key} już istnieje w tym środowisku.`;
      r.envs.forEach((e) => envs.add(e));
      seen.set(r.key, envs);
    }
    if (!r.envs.length) errors[`env-envs-${r.id}`] = "Wybierz co najmniej jedno środowisko.";
  }
  return errors;
}
