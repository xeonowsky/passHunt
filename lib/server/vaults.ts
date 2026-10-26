import "server-only";
import { sql } from "@/lib/db";
import { HttpError } from "@/lib/server/http";

export type VaultRow = {
  id: string;
  encrypted_key: string;
  encrypted_name: string;
  encrypted_description: string | null;
  created_at: string;
  entry_count?: number;
};

export const toDto = (v: VaultRow) => ({
  id: v.id,
  encryptedKey: v.encrypted_key,
  encryptedName: v.encrypted_name,
  encryptedDescription: v.encrypted_description,
  createdAt: v.created_at,
  entryCount: v.entry_count ?? 0,
});

/** Zwraca sejf tylko, jeśli należy do zalogowanego użytkownika (inaczej 404 – bez zdradzania, że istnieje). */
export async function requireOwnedVault(userId: string, vaultId: string) {
  const rows = (await sql`
    SELECT id, encrypted_key, encrypted_name, encrypted_description, created_at
    FROM vaults WHERE id = ${vaultId} AND user_id = ${userId}
  `) as VaultRow[];
  if (!rows[0]) throw new HttpError(404, "Nie znaleziono sejfu.");
  return rows[0];
}
