"use client";

import { useId, useState, type FormEvent } from "react";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { ApiError } from "@/lib/api";
import { VAULT_DESCRIPTION_MAX, VAULT_NAME_MAX } from "@/lib/limits";
import { deleteVault, updateVault, type Vault } from "@/lib/vaults/client";

type Props = {
  vault: Vault;
  vaultKey: CryptoKey;
  userKey: CryptoKey;
  entryCount: number;
  onUpdated: (vault: Vault) => void;
  onDeleted: () => void;
  onClose: () => void;
};

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export function VaultSettings({ vault, vaultKey, userKey, entryCount, onUpdated, onDeleted, onClose }: Props) {
  const descId = useId();
  const confirmId = useId();
  const [name, setName] = useState(vault.name);
  const [description, setDescription] = useState(vault.description);
  const [nameError, setNameError] = useState<string>();
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return setNameError("Podaj nazwę sejfu.");
    setNameError(undefined);
    setNotice(null);
    setSaving(true);
    try {
      onUpdated(await updateVault(vaultKey, userKey, vault.id, { name: name.trim(), description: description.trim() }));
      setNotice({ tone: "info", text: "Zapisano zmiany." });
    } catch (err) {
      setNotice({ tone: "error", text: message(err, "Nie udało się zapisać zmian.") });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteVault(vault.id);
      onDeleted();
    } catch (err) {
      setDeleteError(message(err, "Nie udało się usunąć sejfu."));
      setDeleting(false);
    }
  }

  const canDelete = confirmName.trim() === vault.name;

  return (
    <section className="space-y-6 rounded-xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Ustawienia sejfu</h2>
          <p className="mt-1 text-sm text-muted">Nazwa i opis są ponownie szyfrowane kluczem tego sejfu.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij ustawienia"
          className="grid h-9 w-9 place-items-center rounded-md border border-line text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <form onSubmit={onSave} noValidate className="space-y-5">
        {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}
        <TextField
          label="Nazwa"
          name="vault-name"
          autoComplete="off"
          maxLength={VAULT_NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
        />
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={descId} className="text-sm font-medium">
              Opis (opcjonalnie)
            </label>
            <span className="font-mono text-xs text-muted">
              {description.length}/{VAULT_DESCRIPTION_MAX}
            </span>
          </div>
          <textarea
            id={descId}
            rows={3}
            maxLength={VAULT_DESCRIPTION_MAX}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 w-full resize-none rounded-md border border-line bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <div className="sm:w-56">
          <SubmitButton pending={saving}>{saving ? "Szyfrowanie…" : "Zapisz zmiany"}</SubmitButton>
        </div>
      </form>

      <div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/5 p-5">
        <div>
          <h3 className="font-medium text-red-500">Usuń sejf</h3>
          <p className="mt-1 text-sm text-muted">
            Sejf i {entryCount === 0 ? "jego zawartość" : `wszystkie wpisy w nim (${entryCount})`} zostaną
            usunięte na zawsze. Tej operacji nie da się cofnąć.
          </p>
        </div>
        {deleteError && <FormNotice tone="error">{deleteError}</FormNotice>}
        <div>
          <label htmlFor={confirmId} className="text-sm">
            Wpisz <span className="font-mono font-semibold text-foreground">{vault.name}</span>, aby potwierdzić
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id={confirmId}
              autoComplete="off"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="h-11 flex-1 rounded-md border border-line bg-background px-4 text-sm outline-none focus:border-red-500/70 focus:ring-2 focus:ring-red-500/20"
            />
            <button
              type="button"
              onClick={onDelete}
              disabled={!canDelete || deleting}
              className="h-11 rounded-md bg-red-500 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {deleting ? "Usuwanie…" : "Usuń sejf"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
