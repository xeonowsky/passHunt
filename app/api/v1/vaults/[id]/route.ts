import { sql } from "@/lib/db";
import { encString, handleError, json, readJson, uuid } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { requireOwnedVault, toDto, type VaultRow } from "@/lib/server/vaults";

type Ctx = { params: Promise<{ id: string }> };

async function owned(params: Ctx["params"]) {
  const userId = await requireUser();
  const vaultId = uuid((await params).id, "Nie znaleziono sejfu.");
  await requireOwnedVault(userId, vaultId);
  return { userId, vaultId };
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const userId = await requireUser();
    const vaultId = uuid((await params).id, "Nie znaleziono sejfu.");
    return json({ vault: toDto(await requireOwnedVault(userId, vaultId)) });
  } catch (error) {
    return handleError(error);
  }
}

/** Zmiana nazwy/opisu – klient szyfruje je ponownie tym samym kluczem sejfu. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { userId, vaultId } = await owned(params);
    const body = await readJson(request);
    const encryptedName = encString(body.encryptedName, "encryptedName", 500);
    const encryptedDescription =
      body.encryptedDescription == null ? null : encString(body.encryptedDescription, "encryptedDescription", 1500);

    const rows = (await sql`
      UPDATE vaults
      SET encrypted_name = ${encryptedName}, encrypted_description = ${encryptedDescription}, updated_at = now()
      WHERE id = ${vaultId} AND user_id = ${userId}
      RETURNING id, encrypted_key, encrypted_name, encrypted_description, created_at
    `) as VaultRow[];
    return json({ vault: toDto(rows[0]) });
  } catch (error) {
    return handleError(error);
  }
}

/** Usuwa sejf razem ze wszystkimi wpisami (ON DELETE CASCADE). */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { userId, vaultId } = await owned(params);
    await sql`DELETE FROM vaults WHERE id = ${vaultId} AND user_id = ${userId}`;
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
