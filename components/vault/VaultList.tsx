"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FormNotice } from "@/components/auth/FormNotice";
import { CreateVaultForm } from "@/components/vault/CreateVaultForm";
import { listVaults, type Vault } from "@/lib/vaults/client";

type Props = {
  userKey: CryptoKey;
  email: string;
  onLock: () => void;
  onLogout: () => void;
};

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" });

export function VaultList({ userKey, email, onLock, onLogout }: Props) {
  const [vaults, setVaults] = useState<Vault[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    listVaults(userKey)
      .then((list) => {
        if (!active) return;
        setVaults(list);
        if (list.length === 0) setCreating(true);
      })
      .catch(() => active && setError("Nie udało się wczytać lub odszyfrować sejfów."));
    return () => {
      active = false;
    };
  }, [userKey]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text">{email}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Twoje sejfy</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLock}
            className="h-10 rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-foreground"
          >
            Zablokuj
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="h-10 rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-foreground"
          >
            Wyloguj
          </button>
          {!creating && vaults && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nowy sejf
            </button>
          )}
        </div>
      </header>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {creating && vaults && (
        <div className="max-w-xl">
          <CreateVaultForm
            userKey={userKey}
            existingNames={vaults.map((v) => v.name)}
            onCreated={(vault) => {
              setVaults((list) => [...(list ?? []), vault]);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {!vaults && !error && <p className="text-sm text-muted">Odszyfrowywanie sejfów…</p>}

      {vaults && vaults.length === 0 && !creating && (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <p className="font-medium">Nie masz jeszcze żadnego sejfu</p>
          <p className="mt-1 text-sm text-muted">Utwórz pierwszy, np. „Prywatne” albo „Praca”.</p>
        </div>
      )}

      {vaults && vaults.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vaults.map((vault) => (
            <li key={vault.id}>
              <Link
                href={`/vault/${vault.id}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent/50 focus-visible:border-accent focus-visible:outline-none"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line bg-background text-accent-text">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-medium transition-colors group-hover:text-accent-text">{vault.name}</h2>
                    <p className="font-mono text-xs text-muted">
                      utworzono {dateFormat.format(new Date(vault.createdAt))}
                    </p>
                  </div>
                </div>
                {vault.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{vault.description}</p>
                )}
                <div aria-hidden="true" className="min-h-5 flex-1" />
                <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
                  <span className="text-muted">
                    {vault.entryCount} {entriesLabel(vault.entryCount)}
                  </span>
                  <span className="font-medium text-accent-text transition-transform group-hover:translate-x-0.5">
                    Otwórz →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function entriesLabel(n: number) {
  if (n === 1) return "wpis";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "wpisy" : "wpisów";
}
