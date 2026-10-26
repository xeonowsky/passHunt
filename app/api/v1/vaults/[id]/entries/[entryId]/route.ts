import { sql } from "@/lib/db";
import { ENTRY_ENCRYPTED_MAX } from "@/lib/limits";
import { HttpError, encString, handleError, json, readJson, uuid } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

type Ctx = { params: Promise<{ id: string; entryId: string }> };

type EntryRow = { id: string; encrypted_data: string; created_at: string; updated_at: string };

async function ids(params: Ctx["params"]) {
  const userId = await requireUser();
  const p = await params;
  return {
    userId,
    vaultId: uuid(p.id, "Nie znaleziono sejfu."),
    entryId: uuid(p.entryId, "Nie znaleziono wpisu."),
  };
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { userId, vaultId, entryId } = await ids(params);
    const encryptedData = encString((await readJson(request)).encryptedData, "encryptedData", ENTRY_ENCRYPTED_MAX);

    // Wpis musi należeć do sejfu, a sejf do zalogowanego użytkownika.
    const rows = (await sql`
      UPDATE entries e
      SET encrypted_data = ${encryptedData}, updated_at = now()
      FROM vaults v
      WHERE e.id = ${entryId} AND e.vault_id = ${vaultId}
        AND v.id = e.vault_id AND v.user_id = ${userId}
      RETURNING e.id, e.encrypted_data, e.created_at, e.updated_at
    `) as EntryRow[];
    if (!rows[0]) throw new HttpError(404, "Nie znaleziono wpisu.");

    const e = rows[0];
    return json({
      entry: { id: e.id, encryptedData: e.encrypted_data, createdAt: e.created_at, updatedAt: e.updated_at },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { userId, vaultId, entryId } = await ids(params);
    const rows = await sql`
      DELETE FROM entries e
      USING vaults v
      WHERE e.id = ${entryId} AND e.vault_id = ${vaultId}
        AND v.id = e.vault_id AND v.user_id = ${userId}
      RETURNING e.id
    `;
    if (!rows[0]) throw new HttpError(404, "Nie znaleziono wpisu.");
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
