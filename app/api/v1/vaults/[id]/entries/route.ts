import { sql } from "@/lib/db";
import { ENTRIES_PER_VAULT_MAX, ENTRY_ENCRYPTED_MAX } from "@/lib/limits";
import { HttpError, encString, handleError, json, readJson, uuid } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { requireOwnedVault } from "@/lib/server/vaults";

type Ctx = { params: Promise<{ id: string }> };

type EntryRow = { id: string; encrypted_data: string; created_at: string; updated_at: string };

const toDto = (e: EntryRow) => ({
  id: e.id,
  encryptedData: e.encrypted_data,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

async function ownedVaultId(params: Ctx["params"]) {
  const userId = await requireUser();
  const vaultId = uuid((await params).id, "Nie znaleziono sejfu.");
  await requireOwnedVault(userId, vaultId);
  return vaultId;
}

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const vaultId = await ownedVaultId(params);
    const rows = (await sql`
      SELECT id, encrypted_data, created_at, updated_at
      FROM entries WHERE vault_id = ${vaultId}
      ORDER BY created_at DESC
    `) as EntryRow[];
    return json({ entries: rows.map(toDto) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const vaultId = await ownedVaultId(params);
    const body = await readJson(request);
    const encryptedData = encString(body.encryptedData, "encryptedData", ENTRY_ENCRYPTED_MAX);

    const rows = (await sql`
      INSERT INTO entries (vault_id, encrypted_data)
      SELECT ${vaultId}, ${encryptedData}
      WHERE (SELECT count(*) FROM entries WHERE vault_id = ${vaultId}) < ${ENTRIES_PER_VAULT_MAX}
      RETURNING id, encrypted_data, created_at, updated_at
    `) as EntryRow[];
    if (!rows[0]) throw new HttpError(409, `Osiągnięto limit ${ENTRIES_PER_VAULT_MAX} wpisów w sejfie.`);

    return json({ entry: toDto(rows[0]) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
