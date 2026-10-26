import { api } from "@/lib/api";
import {
  decryptEntry,
  decryptVault,
  encryptEntry,
  encryptNewVault,
  encryptVaultMeta,
  unwrapVaultKey,
  type EntryPlain,
  type VaultCipher,
  type VaultPlain,
} from "@/lib/crypto/account";

type VaultDto = VaultCipher & { id: string; createdAt: string; entryCount?: number };
type EntryDto = { id: string; encryptedData: string; createdAt: string; updatedAt: string };

export type Vault = VaultPlain & { id: string; createdAt: string; entryCount: number };
export type Entry = EntryPlain & { id: string; createdAt: string; updatedAt: string };

async function toVault(userKey: CryptoKey, dto: VaultDto): Promise<Vault> {
  return { id: dto.id, createdAt: dto.createdAt, entryCount: dto.entryCount ?? 0, ...(await decryptVault(userKey, dto)) };
}

async function toEntry(vaultKey: CryptoKey, dto: EntryDto): Promise<Entry> {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    ...(await decryptEntry(vaultKey, dto.encryptedData)),
  };
}

export async function listVaults(userKey: CryptoKey): Promise<Vault[]> {
  const { vaults } = await api<{ vaults: VaultDto[] }>("/vaults");
  return Promise.all(vaults.map((v) => toVault(userKey, v)));
}

export async function createVault(userKey: CryptoKey, plain: VaultPlain): Promise<Vault> {
  const { vault } = await api<{ vault: VaultDto }>("/vaults", {
    body: await encryptNewVault(userKey, plain),
  });
  return toVault(userKey, vault);
}

/** Otwiera sejf: odszyfrowuje jego klucz, nazwę i wszystkie wpisy. */
export async function openVault(userKey: CryptoKey, vaultId: string) {
  const id = encodeURIComponent(vaultId);
  const [{ vault }, { entries }] = await Promise.all([
    api<{ vault: VaultDto }>(`/vaults/${id}`),
    api<{ entries: EntryDto[] }>(`/vaults/${id}/entries`),
  ]);
  const vaultKey = await unwrapVaultKey(userKey, vault.encryptedKey);
  return {
    vault: await toVault(userKey, vault),
    vaultKey,
    entries: await Promise.all(entries.map((e) => toEntry(vaultKey, e))),
  };
}

export async function createEntry(vaultKey: CryptoKey, vaultId: string, plain: EntryPlain): Promise<Entry> {
  const { entry } = await api<{ entry: EntryDto }>(`/vaults/${encodeURIComponent(vaultId)}/entries`, {
    body: { encryptedData: await encryptEntry(vaultKey, plain) },
  });
  return toEntry(vaultKey, entry);
}

export async function updateVault(vaultKey: CryptoKey, userKey: CryptoKey, vaultId: string, plain: VaultPlain) {
  const { vault } = await api<{ vault: VaultDto }>(`/vaults/${encodeURIComponent(vaultId)}`, {
    method: "PATCH",
    body: await encryptVaultMeta(vaultKey, plain),
  });
  return toVault(userKey, vault);
}

export async function deleteVault(vaultId: string) {
  await api(`/vaults/${encodeURIComponent(vaultId)}`, { method: "DELETE" });
}

export async function updateEntry(vaultKey: CryptoKey, vaultId: string, entryId: string, plain: EntryPlain) {
  const { entry } = await api<{ entry: EntryDto }>(
    `/vaults/${encodeURIComponent(vaultId)}/entries/${encodeURIComponent(entryId)}`,
    { method: "PATCH", body: { encryptedData: await encryptEntry(vaultKey, plain) } },
  );
  return toEntry(vaultKey, entry);
}

export async function deleteEntry(vaultId: string, entryId: string) {
  await api(`/vaults/${encodeURIComponent(vaultId)}/entries/${encodeURIComponent(entryId)}`, {
    method: "DELETE",
  });
}
