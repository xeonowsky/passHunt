import { sql } from "@/lib/db";
import { VAULTS_PER_USER_MAX } from "@/lib/limits";
import { HttpError, encString, handleError, json, readJson } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
import { toDto, type VaultRow } from "@/lib/server/vaults";

export async function GET() {
  try {
    const userId = await requireUser();
    const rows = (await sql`
      SELECT v.id, v.encrypted_key, v.encrypted_name, v.encrypted_description, v.created_at,
             (SELECT count(*)::int FROM entries e WHERE e.vault_id = v.id) AS entry_count
      FROM vaults v WHERE v.user_id = ${userId}
      ORDER BY v.created_at ASC
    `) as VaultRow[];
    return json({ vaults: rows.map(toDto) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUser();
    const body = await readJson(request);
    const encryptedKey = encString(body.encryptedKey, "encryptedKey", 200);
    const encryptedName = encString(body.encryptedName, "encryptedName", 500);
    const encryptedDescription =
      body.encryptedDescription == null
        ? null
        : encString(body.encryptedDescription, "encryptedDescription", 1500);

    // Wstawia tylko, jeśli użytkownik nie przekroczył limitu sejfów.
    const rows = (await sql`
      INSERT INTO vaults (user_id, encrypted_key, encrypted_name, encrypted_description)
      SELECT ${userId}, ${encryptedKey}, ${encryptedName}, ${encryptedDescription}
      WHERE (SELECT count(*) FROM vaults WHERE user_id = ${userId}) < ${VAULTS_PER_USER_MAX}
      RETURNING id, encrypted_key, encrypted_name, encrypted_description, created_at
    `) as VaultRow[];
    if (!rows[0]) throw new HttpError(409, `Osiągnięto limit ${VAULTS_PER_USER_MAX} sejfów.`);

    return json({ vault: toDto(rows[0]) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
