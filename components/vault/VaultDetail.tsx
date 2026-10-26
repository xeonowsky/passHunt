"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormNotice } from "@/components/auth/FormNotice";
import { EntryForm } from "@/components/vault/EntryForm";
import { EntryRow } from "@/components/vault/EntryRow";
import { EyeIcon } from "@/components/vault/EyeIcon";
import { TypeIcon } from "@/components/vault/TypeIcon";
import { UnlockGate } from "@/components/vault/UnlockGate";
import { VaultSettings } from "@/components/vault/VaultSettings";
import { ApiError } from "@/lib/api";
import type { EntryType } from "@/lib/crypto/account";
import { setUserKey } from "@/lib/crypto/keystore";
import { ENTRY_TYPES, ENTRY_TYPE_ORDER, searchText } from "@/lib/vaults/entry-types";
import { createEntry, deleteEntry, openVault, updateEntry, type Entry, type Vault } from "@/lib/vaults/client";

export function VaultDetail() {
  const { id } = useParams<{ id: string }>();
  return <UnlockGate>{({ userKey }) => <VaultEntries key={id} userKey={userKey} vaultId={id} />}</UnlockGate>;
}

type Loaded = { vault: Vault; vaultKey: CryptoKey; entries: Entry[] };

function VaultEntries({ userKey, vaultId }: { userKey: CryptoKey; vaultId: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<EntryType | "all">("all");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;
    openVault(userKey, vaultId)
      .then((loaded) => {
        if (!active) return;
        setData(loaded);
        if (loaded.entries.length === 0) setCreating(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Nie znaleziono sejfu."
            : "Nie udało się wczytać lub odszyfrować sejfu.",
        );
      });
    return () => {
      active = false;
    };
  }, [userKey, vaultId]);

  // Karta w tle = wszystko znów ukryte.
  useEffect(() => {
    const hide = () => document.visibilityState === "hidden" && setRevealed(new Set());
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.entries.filter(
      (e) => (typeFilter === "all" || e.type === typeFilter) && (!q || searchText(e).includes(q)),
    );
  }, [data, query, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts = Object.fromEntries(ENTRY_TYPE_ORDER.map((t) => [t, 0])) as Record<EntryType, number>;
    data?.entries.forEach((e) => counts[e.type]++);
    return counts;
  }, [data]);

  const allRevealed = filtered.length > 0 && filtered.every((e) => revealed.has(e.id));

  function toggle(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setRevealed(allRevealed ? new Set() : new Set(filtered.map((e) => e.id)));
  }

  const replaceEntry = (entry: Entry) =>
    setData((d) => (d ? { ...d, entries: d.entries.map((e) => (e.id === entry.id ? entry : e)) } : d));

  async function removeEntry(id: string) {
    setActionError(null);
    try {
      await deleteEntry(vaultId, id);
      setData((d) => (d ? { ...d, entries: d.entries.filter((e) => e.id !== id) } : d));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Nie udało się usunąć wpisu.");
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BackLink />
        <FormNotice tone="error">{error}</FormNotice>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-muted">Odszyfrowywanie sejfu…</p>;

  const { vault, vaultKey, entries } = data;

  return (
    <div className="space-y-8">
      <BackLink />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text">
            {entries.length} {plural(entries.length)}
          </p>
          <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight">{vault.name}</h1>
          {vault.description && <p className="mt-2 max-w-2xl text-sm text-muted">{vault.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-expanded={settingsOpen}
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm transition-colors ${
              settingsOpen ? "border-accent/60 text-accent-text" : "border-line text-muted hover:text-foreground"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
              <circle cx="16" cy="6" r="2" />
              <circle cx="10" cy="12" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            Ustawienia
          </button>
          <button
            type="button"
            onClick={() => setUserKey(null)}
            className="h-10 rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-foreground"
          >
            Zablokuj
          </button>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nowy wpis
            </button>
          )}
        </div>
      </header>

      {settingsOpen && (
        <VaultSettings
          vault={vault}
          vaultKey={vaultKey}
          userKey={userKey}
          entryCount={entries.length}
          onUpdated={(updated) => setData((d) => (d ? { ...d, vault: updated } : d))}
          onDeleted={() => router.push("/vault")}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {actionError && <FormNotice tone="error">{actionError}</FormNotice>}

      {creating && (
        <EntryForm
          defaultType={typeFilter === "all" ? "login" : typeFilter}
          onSave={(plain) => createEntry(vaultKey, vault.id, plain)}
          onSaved={(entry) => {
            setData((d) => (d ? { ...d, entries: [entry, ...d.entries] } : d));
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      {entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtruj po typie">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} count={entries.length}>
              Wszystkie
            </FilterChip>
            {ENTRY_TYPE_ORDER.filter((t) => typeCounts[t] > 0).map((t) => (
              <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} count={typeCounts[t]}>
                <TypeIcon type={t} className="h-3.5 w-3.5" />
                {ENTRY_TYPES[t].plural}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj po nazwie, loginie, adresie…"
              aria-label="Szukaj wpisów"
              className="h-11 flex-1 rounded-md border border-line bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
            />
            <button
              type="button"
              onClick={toggleAll}
              disabled={filtered.length === 0}
              aria-pressed={allRevealed}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line px-4 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
            >
              <EyeIcon open={!allRevealed} />
              {allRevealed ? "Ukryj wszystkie" : "Pokaż wszystkie"}
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {query ? <>Brak wpisów pasujących do „{query}”.</> : "Brak wpisów tego typu."}
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((entry) =>
                editingId === entry.id ? (
                  <li key={entry.id}>
                    <EntryForm
                      initial={entry}
                      onSave={(plain) => updateEntry(vaultKey, vault.id, entry.id, plain)}
                      onSaved={(updated) => {
                        replaceEntry(updated);
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  </li>
                ) : (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    revealed={revealed.has(entry.id)}
                    onToggle={() => toggle(entry.id)}
                    onEdit={() => setEditingId(entry.id)}
                    onDelete={() => removeEntry(entry.id)}
                  />
                ),
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors ${
        active ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-foreground"
      }`}
    >
      {children}
      <span className={`font-mono text-xs ${active ? "opacity-70" : "text-muted"}`}>{count}</span>
    </button>
  );
}

function BackLink() {
  return (
    <Link href="/vault" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
      <span aria-hidden="true">←</span> Wszystkie sejfy
    </Link>
  );
}

function plural(n: number) {
  if (n === 1) return "wpis";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? "wpisy" : "wpisów";
}
