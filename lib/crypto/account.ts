/** Operacje kryptograficzne na koncie i sejfach (tylko przeglądarka). */
import {
  decryptBytes,
  decryptText,
  encryptBytes,
  encryptText,
  generateKeyBytes,
  importAesKey,
  type EncString,
} from "@/lib/crypto/cipher";
import { DEFAULT_KDF, deriveKeys, deriveMasterKey, generateSalt, type KdfParams } from "@/lib/crypto/kdf";

/** Nowe konto: sól, klucze pochodne i losowy klucz użytkownika zaszyfrowany encKey. */
export async function createAccountKeys(password: string) {
  const salt = generateSalt();
  const kdf = DEFAULT_KDF;
  const { authHash, encKey } = await deriveKeys(await deriveMasterKey(password, salt, kdf));
  const userKeyBytes = generateKeyBytes();
  const encryptedUserKey = await encryptBytes(encKey, userKeyBytes);
  const userKey = await importAesKey(userKeyBytes);
  userKeyBytes.fill(0);
  return { salt, kdf, authHash, encryptedUserKey, userKey };
}

export async function deriveAuth(password: string, salt: string, kdf: KdfParams) {
  return deriveKeys(await deriveMasterKey(password, salt, kdf));
}

/** Rzuca wyjątek przy złym haśle (nie przejdzie weryfikacja tagu GCM). */
export async function unwrapUserKey(encKey: CryptoKey, encryptedUserKey: EncString) {
  const bytes = await decryptBytes(encKey, encryptedUserKey);
  const key = await importAesKey(bytes);
  bytes.fill(0);
  return key;
}

export type VaultPlain = { name: string; description: string };

export type VaultCipher = {
  encryptedKey: EncString;
  encryptedName: EncString;
  encryptedDescription: EncString | null;
};

/** Każdy sejf ma własny losowy klucz, zaszyfrowany kluczem użytkownika. */
export async function encryptNewVault(userKey: CryptoKey, plain: VaultPlain): Promise<VaultCipher> {
  const vaultKeyBytes = generateKeyBytes();
  const vaultKey = await importAesKey(vaultKeyBytes);
  const encryptedKey = await encryptBytes(userKey, vaultKeyBytes);
  vaultKeyBytes.fill(0);
  return {
    encryptedKey,
    encryptedName: await encryptText(vaultKey, plain.name),
    encryptedDescription: plain.description ? await encryptText(vaultKey, plain.description) : null,
  };
}

export async function decryptVault(userKey: CryptoKey, vault: VaultCipher): Promise<VaultPlain> {
  const vaultKeyBytes = await decryptBytes(userKey, vault.encryptedKey);
  const vaultKey = await importAesKey(vaultKeyBytes);
  vaultKeyBytes.fill(0);
  return {
    name: await decryptText(vaultKey, vault.encryptedName),
    description: vault.encryptedDescription ? await decryptText(vaultKey, vault.encryptedDescription) : "",
  };
}

export async function unwrapVaultKey(userKey: CryptoKey, encryptedKey: EncString): Promise<CryptoKey> {
  const bytes = await decryptBytes(userKey, encryptedKey);
  const key = await importAesKey(bytes);
  bytes.fill(0);
  return key;
}

/** Cały wpis (łącznie z nazwą i typem) szyfrowany jednym blokiem – serwer nie widzi nawet, czy to hasło, czy karta. */
export type EntryType = "login" | "card" | "wifi" | "note" | "custom" | "env";

export type CustomField = {
  label: string;
  value: string;
  secret: boolean;
  /** Tylko typ "env": środowiska zmiennej (production / preview / development). */
  envs?: string[];
};

export type EntryPlain = {
  type: EntryType;
  title: string;
  /** Pola zależne od typu, np. { url, username, password } dla loginu. */
  fields: Record<string, string>;
  /** Własne pary „nazwa: wartość”, dostępne w każdym typie. */
  custom: CustomField[];
  notes: string;
};

const ENTRY_TYPE_SET = new Set<EntryType>(["login", "card", "wifi", "note", "custom", "env"]);

export async function encryptEntry(vaultKey: CryptoKey, entry: EntryPlain): Promise<EncString> {
  return encryptText(vaultKey, JSON.stringify({ v: 2, ...entry }));
}

const asString = (v: unknown) => (typeof v === "string" ? v : "");

export async function decryptEntry(vaultKey: CryptoKey, value: EncString): Promise<EntryPlain> {
  const data = JSON.parse(await decryptText(vaultKey, value)) as Record<string, unknown>;

  // Format v1 (przed typami): { title, username, password, url, notes } → login
  if (typeof data.type !== "string") {
    return {
      type: "login",
      title: asString(data.title),
      fields: { url: asString(data.url), username: asString(data.username), password: asString(data.password) },
      custom: [],
      notes: asString(data.notes),
    };
  }

  const fields: Record<string, string> = {};
  if (data.fields && typeof data.fields === "object") {
    for (const [k, v] of Object.entries(data.fields as Record<string, unknown>)) fields[k] = asString(v);
  }
  const custom = Array.isArray(data.custom)
    ? (data.custom as Record<string, unknown>[]).map((f) => {
        const field: CustomField = { label: asString(f?.label), value: asString(f?.value), secret: f?.secret === true };
        if (Array.isArray(f?.envs)) field.envs = (f.envs as unknown[]).filter((e): e is string => typeof e === "string");
        return field;
      })
    : [];

  return {
    type: ENTRY_TYPE_SET.has(data.type as EntryType) ? (data.type as EntryType) : "custom",
    title: asString(data.title),
    fields,
    custom,
    notes: asString(data.notes),
  };
}

/** Nowa nazwa/opis istniejącego sejfu – szyfrowane jego dotychczasowym kluczem. */
export async function encryptVaultMeta(vaultKey: CryptoKey, plain: VaultPlain) {
  return {
    encryptedName: await encryptText(vaultKey, plain.name),
    encryptedDescription: plain.description ? await encryptText(vaultKey, plain.description) : null,
  };
}
