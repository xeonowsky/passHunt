"use client";

import { useId, useState, type FormEvent } from "react";
import { TextField } from "@/components/auth/TextField";
import { PasswordField } from "@/components/auth/PasswordField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { TypeIcon } from "@/components/vault/TypeIcon";
import { EyeIcon } from "@/components/vault/EyeIcon";
import { EnvVarsEditor, newEnvRow, validateEnvRows, type EnvRow } from "@/components/vault/EnvVarsEditor";
import { ApiError } from "@/lib/api";
import type { EntryPlain, EntryType } from "@/lib/crypto/account";
import { generatePassword } from "@/lib/crypto/generator";
import { ENTRY_LIMITS } from "@/lib/limits";
import { ALL_ENV_TARGETS, ENTRY_TYPES, ENTRY_TYPE_ORDER, validateField, type FieldDef } from "@/lib/vaults/entry-types";
import { ENV_KEY_PATTERN } from "@/lib/vaults/dotenv";
import type { Entry } from "@/lib/vaults/client";
import { safeHref } from "@/lib/vaults/url";

type Props = {
  /** Wartości startowe przy edycji; brak = nowy wpis. */
  initial?: EntryPlain;
  defaultType?: EntryType;
  /** Szyfruje i zapisuje wpis (tworzenie albo edycja). */
  onSave: (plain: EntryPlain) => Promise<Entry>;
  onSaved: (entry: Entry) => void;
  onCancel: () => void;
};

type CustomRow = { id: number; label: string; value: string; secret: boolean };

let rowId = 0;
const toRows = (custom: EntryPlain["custom"]): CustomRow[] => custom.map((c) => ({ ...c, id: ++rowId }));

const inputClass =
  "h-12 w-full rounded-md border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25";

export function EntryForm({ initial, defaultType = "login", onSave, onSaved, onCancel }: Props) {
  const notesId = useId();
  const editing = !!initial;
  const [type, setType] = useState<EntryType>(initial?.type ?? defaultType);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [fields, setFields] = useState<Record<string, string>>(initial?.fields ?? {});
  const [custom, setCustom] = useState<CustomRow[]>(() =>
    initial && initial.type !== "env" ? toRows(initial.custom) : [],
  );
  const [envRows, setEnvRows] = useState<EnvRow[]>(() =>
    initial?.type === "env" && initial.custom.length
      ? initial.custom.map((c) => newEnvRow({ key: c.label, value: c.value, envs: c.envs ?? [...ALL_ENV_TARGETS] }))
      : [newEnvRow()],
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const def = ENTRY_TYPES[type];

  function chooseType(next: EntryType) {
    setType(next);
    setErrors({});
    // „Własny” bez pól nie ma sensu – dodaj pierwszy wiersz od razu.
    if (next === "custom" && custom.length === 0) setCustom([{ id: ++rowId, label: "", value: "", secret: false }]);
  }

  const setField = (key: string, value: string) => setFields((f) => ({ ...f, [key]: value }));

  function updateRow(id: number, patch: Partial<CustomRow>) {
    setCustom((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Podaj nazwę wpisu.";
    for (const f of def.fields) {
      const value = fields[f.key] ?? "";
      const msg = f.kind === "url" ? (value.trim() && !safeHref(value) ? "Podaj poprawny adres strony." : undefined) : validateField(f, value);
      if (msg) next[f.key] = msg;
    }
    custom.forEach((r) => {
      if (r.value.trim() && !r.label.trim()) next[`custom-${r.id}`] = "Podaj nazwę pola.";
    });
    if (type === "custom" && !custom.some((r) => r.value.trim())) next.customEmpty = "Dodaj co najmniej jedno pole z wartością.";
    if (type === "env") Object.assign(next, validateEnvRows(envRows, ENV_KEY_PATTERN));
    return next;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    // Zapisujemy tylko pola bieżącego typu (po zmianie typu stare pola znikają).
    const cleanFields: Record<string, string> = {};
    for (const f of def.fields) {
      const value = fields[f.key] ?? "";
      if (!value.trim()) continue;
      cleanFields[f.key] = f.secret ? value : value.trim();
    }

    setError(null);
    setPending(true);
    try {
      const entry = await onSave({
        type,
        title: title.trim(),
        fields: cleanFields,
        custom:
          type === "env"
            ? envRows
                .filter((r) => r.key.trim())
                .map((r) => ({ label: r.key.trim(), value: r.value, secret: true, envs: r.envs }))
            : custom
                .filter((r) => r.label.trim() || r.value.trim())
                .map((r) => ({ label: r.label.trim(), value: r.secret ? r.value : r.value.trim(), secret: r.secret })),
        notes: notes.trim(),
      });
      onSaved(entry);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nie udało się zapisać wpisu.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      className="space-y-6 rounded-xl border border-line bg-surface p-6 shadow-[0_0_80px_-30px_rgba(215,255,58,0.35)]"
    >
      <div>
        <h2 className="text-lg font-semibold">{editing ? "Edytuj wpis" : "Nowy wpis"}</h2>
        <p className="mt-1 text-sm text-muted">Cały wpis – razem z typem – jest szyfrowany kluczem tego sejfu.</p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      <fieldset>
        <legend className="text-sm font-medium">Typ rekordu</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="radiogroup">
          {ENTRY_TYPE_ORDER.map((t) => {
            const active = t === type;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => chooseType(t)}
                className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-line text-muted hover:border-accent/40 hover:text-foreground"
                }`}
              >
                <span className={active ? "text-accent-text" : ""}>
                  <TypeIcon type={t} className="h-4 w-4" />
                </span>
                {ENTRY_TYPES[t].label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <TextField
        label="Nazwa"
        name="entry-title"
        placeholder={def.titlePlaceholder}
        maxLength={ENTRY_LIMITS.title}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
      />

      {def.fields.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {def.fields.map((f) => (
            <TypedField
              key={`${type}-${f.key}`}
              def={f}
              value={fields[f.key] ?? ""}
              error={errors[f.key]}
              onChange={(v) => setField(f.key, v)}
              onGenerate={() => setField(f.key, generatePassword(20))}
            />
          ))}
        </div>
      )}

      {type === "env" ? (
        <EnvVarsEditor rows={envRows} onChange={setEnvRows} errors={errors} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{type === "custom" ? "Pola" : "Własne pola"}</p>
            <span className="font-mono text-xs text-muted">
              {custom.length}/{ENTRY_LIMITS.customMax}
            </span>
          </div>

          {custom.map((row) => (
            <div key={row.id} className="space-y-1">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  aria-label="Nazwa pola"
                  placeholder="Nazwa, np. PIN, Numer klienta"
                  maxLength={ENTRY_LIMITS.customLabel}
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  className={`${inputClass} sm:w-56 ${errors[`custom-${row.id}`] ? "border-red-500/70" : "border-line"}`}
                />
                <div className="flex flex-1 gap-2">
                  <input
                    aria-label={`Wartość pola ${row.label}`}
                    placeholder="Wartość"
                    type={row.secret ? "password" : "text"}
                    maxLength={ENTRY_LIMITS.customValue}
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    className={`${inputClass} border-line ${row.secret ? "font-mono" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => updateRow(row.id, { secret: !row.secret })}
                    aria-pressed={row.secret}
                    title={row.secret ? "Pole tajne – ukrywane na liście" : "Oznacz jako tajne"}
                    aria-label={row.secret ? "Pole tajne" : "Oznacz pole jako tajne"}
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-md border transition-colors ${
                      row.secret ? "border-accent/60 text-accent-text" : "border-line text-muted hover:text-foreground"
                    }`}
                  >
                    <EyeIcon open={!row.secret} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustom((rows) => rows.filter((r) => r.id !== row.id))}
                    aria-label="Usuń pole"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </div>
              {errors[`custom-${row.id}`] && <p className="text-sm text-red-500">{errors[`custom-${row.id}`]}</p>}
            </div>
          ))}

          {errors.customEmpty && <p className="text-sm text-red-500">{errors.customEmpty}</p>}

          {custom.length < ENTRY_LIMITS.customMax && (
            <button
              type="button"
              onClick={() => setCustom((rows) => [...rows, { id: ++rowId, label: "", value: "", secret: false }])}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-dashed border-line px-4 text-sm text-muted transition-colors hover:border-accent/50 hover:text-accent-text"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Dodaj pole
            </button>
          )}
        </div>
      )}

      <div>
        <label htmlFor={notesId} className="text-sm font-medium">
          {def.notesLabel}
        </label>
        <textarea
          id={notesId}
          name="entry-notes"
          rows={type === "note" ? 8 : 3}
          maxLength={ENTRY_LIMITS.notes}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 w-full resize-y rounded-md border border-line bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-md border border-line px-5 text-sm text-muted transition-colors hover:text-foreground sm:w-40"
        >
          Anuluj
        </button>
        <div className="sm:w-56">
          <SubmitButton pending={pending}>{pending ? "Szyfrowanie…" : editing ? "Zapisz zmiany" : "Zapisz wpis"}</SubmitButton>
        </div>
      </div>
    </form>
  );
}

function TypedField({
  def,
  value,
  error,
  onChange,
  onGenerate,
}: {
  def: FieldDef;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
}) {
  const numeric = def.kind === "card" || def.kind === "digits" || def.kind === "expiry";
  const common = {
    label: def.label,
    name: `entry-${def.key}`,
    placeholder: def.placeholder,
    maxLength: def.maxLength ?? ENTRY_LIMITS.field,
    value,
    error,
    inputMode: numeric ? ("numeric" as const) : def.kind === "url" ? ("url" as const) : undefined,
    onChange: (e: { target: { value: string } }) => onChange(def.kind === "expiry" ? formatExpiry(e.target.value, value) : e.target.value),
  };

  if (def.secret) {
    return (
      <PasswordField
        {...common}
        autoComplete={def.generator ? "new-password" : "off"}
        labelAside={
          def.generator ? (
            <button type="button" onClick={onGenerate} className="text-xs font-medium text-accent-text underline-offset-4 hover:underline">
              Generuj
            </button>
          ) : undefined
        }
      />
    );
  }
  return <TextField {...common} autoComplete="off" />;
}

/** „0127” → „01/27”, kasowanie ukośnika działa normalnie. */
function formatExpiry(next: string, prev: string) {
  const digits = next.replace(/\D/g, "").slice(0, 4);
  if (next.length < prev.length) return next;
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits.length === 2 ? `${digits}/` : digits;
}
