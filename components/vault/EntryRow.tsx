"use client";

import { ConfirmButton } from "@/components/vault/ConfirmButton";
import { CopyButton } from "@/components/vault/CopyButton";
import { EyeIcon } from "@/components/vault/EyeIcon";
import { EnvVarsTable } from "@/components/vault/EnvVarsTable";
import { TypeIcon } from "@/components/vault/TypeIcon";
import { ENTRY_TYPES, ENV_TARGETS, detailItems, formatValue, previewItems, type DisplayItem } from "@/lib/vaults/entry-types";
import { safeHref } from "@/lib/vaults/url";
import type { Entry } from "@/lib/vaults/client";

/** Stała liczba kropek – nie zdradza długości wartości. */
const MASK = "••••••••••";

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

type Props = {
  entry: Entry;
  revealed: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function EntryRow({ entry, revealed, onToggle, onEdit, onDelete }: Props) {
  const detailsId = `entry-${entry.id}`;
  const type = ENTRY_TYPES[entry.type];
  const preview = previewItems(entry);
  const details = detailItems(entry);

  return (
    <li className={`rounded-xl border bg-surface transition-colors ${revealed ? "border-accent/50" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:flex-nowrap">
        <span
          title={type.label}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-line bg-background text-accent-text"
        >
          <TypeIcon type={entry.type} />
          <span className="sr-only">{type.label}</span>
        </span>

        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate font-medium">{entry.title}</p>
          <p className="truncate font-mono text-xs uppercase tracking-wider text-muted">{type.label}</p>
        </div>

        {entry.type === "env" && <EnvSummary entry={entry} />}

        {preview.map((item, i) => (
          <Field key={i} label={item.label} value={revealed ? formatValue(item) || "—" : MASK} mono={item.secret} />
        ))}

        <div className="flex shrink-0 items-center gap-2">
          {preview.map((item, i) => (
            <CopyButton key={i} value={item.value} label={item.label.toLowerCase()} />
          ))}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={revealed}
            aria-controls={detailsId}
            aria-label={revealed ? `Ukryj dane: ${entry.title}` : `Pokaż dane: ${entry.title}`}
            title={revealed ? "Ukryj dane" : "Pokaż dane"}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border transition-colors ${
              revealed ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-accent-text"
            }`}
          >
            <EyeIcon open={!revealed} />
          </button>
        </div>
      </div>

      {revealed && (
        <dl id={detailsId} className="grid gap-x-6 gap-y-3 border-t border-line px-4 py-4 text-sm sm:grid-cols-[160px_1fr]">
          {entry.type === "env" && <EnvVarsTable vars={entry.custom} />}
          {details.map((item, i) => (
            <Detail key={i} item={item} />
          ))}
          {entry.notes && (
            <>
              <dt className="text-muted">{entry.type === "note" ? "Treść" : "Notatka"}</dt>
              <dd className="flex min-w-0 items-start justify-between gap-2">
                <span className="whitespace-pre-wrap break-words">{entry.notes}</span>
                {entry.type === "note" && <CopyButton value={entry.notes} label="treść" />}
              </dd>
            </>
          )}
          <dt className="text-muted">Dodano</dt>
          <dd className="font-mono text-xs text-muted">
            {dateFormat.format(new Date(entry.createdAt))}
            {entry.updatedAt !== entry.createdAt && <> · zmieniono {dateFormat.format(new Date(entry.updatedAt))}</>}
          </dd>
          <dd className="flex flex-wrap items-center gap-2 pt-2 sm:col-span-2">
            <button
              type="button"
              onClick={onEdit}
              className="h-9 rounded-md border border-line px-3 text-sm text-muted transition-colors hover:border-accent/60 hover:text-accent-text"
            >
              Edytuj
            </button>
            <ConfirmButton label="Usuń" question="Usunąć ten wpis?" onConfirm={onDelete} />
          </dd>
        </dl>
      )}
    </li>
  );
}

function Detail({ item }: { item: DisplayItem }) {
  const href = item.kind === "url" ? safeHref(item.value) : null;
  return (
    <>
      <dt className="text-muted">{item.label}</dt>
      <dd className="flex min-w-0 items-center justify-between gap-2">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-accent-text hover:underline">
            {item.value}
          </a>
        ) : (
          <span className={`min-w-0 break-all ${item.secret ? "font-mono" : ""}`}>{formatValue(item)}</span>
        )}
        <CopyButton value={item.value} label={item.label.toLowerCase()} />
      </dd>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 basis-full sm:w-44 sm:basis-auto">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={`truncate text-sm ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function EnvSummary({ entry }: { entry: Entry }) {
  const n = entry.custom.length;
  const envs = new Set(entry.custom.flatMap((c) => c.envs ?? []));
  return (
    <div className="min-w-0 basis-full sm:w-52 sm:basis-auto">
      <p className="text-xs text-muted">Zmienne</p>
      <p className="flex flex-wrap items-center gap-1 text-sm">
        <span className="mr-1">{n} {n === 1 ? "zmienna" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "zmienne" : "zmiennych"}</span>
        {ENV_TARGETS.filter((t) => envs.has(t.key)).map((t) => (
          <span key={t.key} className="rounded-full border border-line px-1.5 font-mono text-[10px] text-muted">
            {t.short}
          </span>
        ))}
      </p>
    </div>
  );
}
