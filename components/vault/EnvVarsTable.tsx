"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/vault/CopyButton";
import { EyeIcon } from "@/components/vault/EyeIcon";
import type { CustomField } from "@/lib/crypto/account";
import { ALL_ENV_TARGETS, ENV_TARGETS } from "@/lib/vaults/entry-types";
import { toDotenv } from "@/lib/vaults/dotenv";

const MASK = "••••••••••••";

/** Widok zmiennych jak w Vercel: wartości ukryte, oko i kopiowanie przy każdej zmiennej, eksport do .env. */
export function EnvVarsTable({ vars }: { vars: CustomField[] }) {
  const [env, setEnv] = useState<string>("all");
  const [shown, setShown] = useState<Set<number>>(() => new Set());

  const rows = useMemo(
    () =>
      vars
        .map((v, i) => ({ ...v, i, envs: v.envs ?? ALL_ENV_TARGETS }))
        .filter((v) => env === "all" || v.envs.includes(env)),
    [vars, env],
  );

  const allShown = rows.length > 0 && rows.every((r) => shown.has(r.i));
  const dotenv = toDotenv(rows.map((r) => ({ key: r.label, value: r.value })));

  const toggle = (i: number) =>
    setShown((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Środowisko"
          value={env}
          onChange={(e) => setEnv(e.target.value)}
          className="h-9 rounded-md border border-line bg-background px-3 text-sm outline-none focus:border-accent"
        >
          <option value="all">Wszystkie środowiska</option>
          {ENV_TARGETS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShown(allShown ? new Set() : new Set(rows.map((r) => r.i)))}
          disabled={!rows.length}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
        >
          <EyeIcon open={!allShown} />
          {allShown ? "Ukryj wartości" : "Pokaż wartości"}
        </button>
        <span className="ml-auto inline-flex items-center gap-2 text-sm text-muted">
          Kopiuj jako .env
          <CopyButton value={rows.length ? dotenv : ""} label="zmienne jako .env" />
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted">Brak zmiennych w tym środowisku.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {rows.map((r) => {
            const visible = shown.has(r.i);
            return (
              <li key={r.i} className="grid items-center gap-x-3 gap-y-2 bg-background px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
                <div className="flex min-w-0 items-center gap-1">
                  <span className="truncate font-mono text-sm font-medium" title={r.label}>
                    {r.label}
                  </span>
                  <span className="shrink-0 opacity-60">
                    <CopyButton value={r.label} label={`klucz ${r.label}`} />
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <code className={`min-w-0 flex-1 truncate text-sm ${visible ? "text-foreground" : "text-muted"}`} title={visible ? r.value : undefined}>
                    {visible ? r.value || "(pusta)" : MASK}
                  </code>
                  <button
                    type="button"
                    onClick={() => toggle(r.i)}
                    aria-label={visible ? `Ukryj wartość ${r.label}` : `Pokaż wartość ${r.label}`}
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors ${
                      visible ? "border-accent/60 text-accent-text" : "border-line text-muted hover:text-accent-text"
                    }`}
                  >
                    <EyeIcon open={!visible} />
                  </button>
                  <CopyButton value={r.value} label={`wartość ${r.label}`} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {ENV_TARGETS.filter((t) => r.envs.includes(t.key)).map((t) => (
                    <span key={t.key} className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
                      {t.short}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
