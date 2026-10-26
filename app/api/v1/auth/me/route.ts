import { sql } from "@/lib/db";
import { HttpError, handleError, json } from "@/lib/server/http";
import { getSessionUserId } from "@/lib/server/session";

/** Dane potrzebne do odblokowania sejfu po odświeżeniu strony (sesja jest, klucza w pamięci już nie). */
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) throw new HttpError(401, "Nie jesteś zalogowany.");

    const rows = await sql`
      SELECT email, kdf_salt, kdf_iterations, kdf_memory_kib, kdf_parallelism, encrypted_user_key,
             created_at, (SELECT count(*)::int FROM vaults WHERE user_id = users.id) AS vault_count
      FROM users WHERE id = ${userId}
    `;
    const user = rows[0];
    if (!user) throw new HttpError(401, "Nie jesteś zalogowany.");

    return json({
      email: user.email,
      salt: user.kdf_salt,
      kdf: {
        iterations: user.kdf_iterations,
        memoryKiB: user.kdf_memory_kib,
        parallelism: user.kdf_parallelism,
      },
      encryptedUserKey: user.encrypted_user_key,
      createdAt: user.created_at,
      vaultCount: user.vault_count,
    });
  } catch (error) {
    return handleError(error);
  }
}
