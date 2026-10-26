"use client";

import { useId, useState, type FormEvent } from "react";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { VAULT_DESCRIPTION_MAX, VAULT_NAME_MAX } from "@/lib/limits";
import { ApiError } from "@/lib/api";
import { createVault, type Vault } from "@/lib/vaults/client";

type Props = {
  userKey: CryptoKey;
  existingNames: string[];
  onCreated: (vault: Vault) => void;
  onCancel: () => void;
};

export function CreateVaultForm({ userKey, existingNames, onCreated, onCancel }: Props) {
  const descId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setNameError("Podaj nazwę sejfu.");
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase()))
      return setNameError("Masz już sejf o tej nazwie.");
    setNameError(undefined);
    setError(null);

    setPending(true);
    try {
      onCreated(await createVault(userKey, { name: trimmed, description: description.trim() }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nie udało się utworzyć sejfu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-line bg-surface p-6 shadow-[0_0_80px_-30px_rgba(215,255,58,0.35)]"
    >
      <div>
        <h2 className="text-lg font-semibold">Nowy sejf</h2>
        <p className="mt-1 text-sm text-muted">
          Nazwa i opis są szyfrowane w przeglądarce nowym, losowym kluczem sejfu.
        </p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      <TextField
        label="Nazwa"
        name="vault-name"
        autoComplete="off"
        placeholder="np. Prywatne, Praca, Studia"
        maxLength={VAULT_NAME_MAX}
        autoFocus
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
          name="vault-description"
          rows={3}
          maxLength={VAULT_DESCRIPTION_MAX}
          placeholder="Do czego służy ten sejf?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full resize-none rounded-md border border-line bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-md border border-line px-5 text-sm text-muted transition-colors hover:text-foreground sm:w-40"
        >
          Anuluj
        </button>
        <SubmitButton pending={pending}>{pending ? "Szyfrowanie…" : "Utwórz sejf"}</SubmitButton>
      </div>
    </form>
  );
}
