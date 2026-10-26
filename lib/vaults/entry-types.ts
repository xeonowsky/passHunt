import type { EntryPlain, EntryType } from "@/lib/crypto/account";

export type FieldKind = "text" | "url" | "card" | "expiry" | "digits";

export type FieldDef = {
  key: string;
  label: string;
  secret?: boolean;
  kind?: FieldKind;
  placeholder?: string;
  maxLength?: number;
  /** Przycisk „Generuj” przy polu hasła. */
  generator?: boolean;
};

export type TypeDef = {
  label: string;
  /** Etykieta na filtrze listy, np. „Loginy”. */
  plural: string;
  /** Ścieżka SVG (viewBox 0 0 24 24). */
  icon: string;
  titlePlaceholder: string;
  notesLabel: string;
  fields: FieldDef[];
  /** Pola pokazywane (zamaskowane) w linijce na liście. */
  preview: string[];
};

export const ENTRY_TYPE_ORDER: EntryType[] = ["login", "env", "card", "wifi", "note", "custom"];

/** Środowiska zmiennych – jak w Vercel. */
export const ENV_TARGETS = [
  { key: "production", label: "Production", short: "Prod" },
  { key: "preview", label: "Preview", short: "Preview" },
  { key: "development", label: "Development", short: "Dev" },
] as const;

export const ALL_ENV_TARGETS: string[] = ENV_TARGETS.map((t) => t.key);

export const ENTRY_TYPES: Record<EntryType, TypeDef> = {
  login: {
    label: "Login",
    plural: "Loginy",
    icon: "M15 7a4 4 0 1 1-3.9 4.9L4 19v2h3v-2h2v-2h2l1.1-1.1A4 4 0 0 1 15 7zM16 10h.01",
    titlePlaceholder: "np. Gmail, USOS, Allegro",
    notesLabel: "Notatka (opcjonalnie)",
    fields: [
      { key: "url", label: "Adres strony", kind: "url", placeholder: "https://…" },
      { key: "username", label: "Login lub e-mail" },
      { key: "password", label: "Hasło", secret: true, generator: true },
    ],
    preview: ["username", "password"],
  },
  card: {
    label: "Karta płatnicza",
    plural: "Karty",
    icon: "M3 6h18v12H3zM3 10h18M7 15h3",
    titlePlaceholder: "np. Visa mBank, Revolut",
    notesLabel: "Notatka (opcjonalnie)",
    fields: [
      { key: "cardholder", label: "Posiadacz karty", placeholder: "IMIĘ NAZWISKO" },
      { key: "number", label: "Numer karty", secret: true, kind: "card", placeholder: "0000 0000 0000 0000", maxLength: 23 },
      { key: "expiry", label: "Ważność", kind: "expiry", placeholder: "MM/RR", maxLength: 5 },
      { key: "cvv", label: "CVV", secret: true, kind: "digits", placeholder: "123", maxLength: 4 },
      { key: "pin", label: "PIN", secret: true, kind: "digits", maxLength: 8 },
    ],
    preview: ["number", "expiry"],
  },
  wifi: {
    label: "Wi-Fi",
    plural: "Wi-Fi",
    icon: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
    titlePlaceholder: "np. Dom, Akademik",
    notesLabel: "Notatka (opcjonalnie)",
    fields: [
      { key: "ssid", label: "Nazwa sieci (SSID)" },
      { key: "password", label: "Hasło", secret: true, generator: true },
      { key: "security", label: "Zabezpieczenia", placeholder: "np. WPA2, WPA3" },
    ],
    preview: ["ssid", "password"],
  },
  note: {
    label: "Notatka",
    plural: "Notatki",
    icon: "M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4",
    titlePlaceholder: "np. Kody zapasowe 2FA",
    notesLabel: "Treść notatki",
    fields: [],
    preview: [],
  },
  env: {
    label: "Zmienne środowiskowe",
    plural: "Sekrety",
    icon: "M8 4H6a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-2M10 12h.01M14 12h.01",
    titlePlaceholder: "np. passHunt – Vercel",
    notesLabel: "Notatka (opcjonalnie)",
    fields: [{ key: "url", label: "Projekt / adres", kind: "url", placeholder: "https://vercel.com/…" }],
    preview: [],
  },
  custom: {
    label: "Własny",
    plural: "Własne",
    icon: "M4 6h16M4 12h16M4 18h10",
    titlePlaceholder: "np. Numer klienta, Dowód, Licencja",
    notesLabel: "Notatka (opcjonalnie)",
    fields: [],
    preview: [],
  },
};

export type DisplayItem = { label: string; value: string; secret: boolean; kind?: FieldKind };

/** Do dwóch pozycji widocznych (zamaskowanych) w linijce na liście. */
export function previewItems(entry: EntryPlain): DisplayItem[] {
  if (entry.type === "env") return [];
  const def = ENTRY_TYPES[entry.type];
  const items: DisplayItem[] = def.fields
    .filter((f) => def.preview.includes(f.key))
    .map((f) => ({ label: f.label, value: entry.fields[f.key] ?? "", secret: !!f.secret, kind: f.kind }));
  if (items.length === 0 && entry.type === "note") {
    items.push({ label: "Treść", value: entry.notes, secret: true });
  }
  for (const c of entry.custom) {
    if (items.length >= 2) break;
    items.push({ label: c.label, value: c.value, secret: c.secret });
  }
  return items.slice(0, 2);
}

/** Wszystkie niepuste pola wpisu w kolejności definicji, potem własne. */
export function detailItems(entry: EntryPlain): DisplayItem[] {
  const def = ENTRY_TYPES[entry.type];
  const custom = entry.type === "env" ? [] : entry.custom; // zmienne env mają własną tabelę
  return [
    ...def.fields.map((f) => ({ label: f.label, value: entry.fields[f.key] ?? "", secret: !!f.secret, kind: f.kind })),
    ...custom.map((c) => ({ label: c.label || "Pole", value: c.value, secret: c.secret })),
  ].filter((i) => i.value.trim());
}

/** Tekst do wyszukiwania – bez wartości tajnych. */
export function searchText(entry: EntryPlain): string {
  const def = ENTRY_TYPES[entry.type];
  return [
    entry.title,
    def.label,
    ...def.fields.filter((f) => !f.secret).map((f) => entry.fields[f.key] ?? ""),
    ...entry.custom.flatMap((c) => (c.secret ? [c.label] : [c.label, c.value])),
  ]
    .join(" ")
    .toLowerCase();
}

export function formatValue(item: DisplayItem): string {
  if (item.kind === "card") return item.value.replace(/\D/g, "").replace(/(.{4})(?=.)/g, "$1 ");
  return item.value;
}

/** Komunikat błędu lub undefined. */
export function validateField(def: FieldDef, raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  switch (def.kind) {
    case "card": {
      const digits = value.replace(/[\s-]/g, "");
      return /^\d{12,19}$/.test(digits) ? undefined : "Numer karty to 12–19 cyfr.";
    }
    case "expiry":
      return /^(0[1-9]|1[0-2])\/\d{2}$/.test(value) ? undefined : "Podaj datę w formacie MM/RR.";
    case "digits":
      return /^\d+$/.test(value) ? undefined : "Tylko cyfry.";
    default:
      return undefined;
  }
}
