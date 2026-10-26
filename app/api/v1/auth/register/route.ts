import { sql } from "@/lib/db";
import { HINT_MAX } from "@/lib/limits";
import {
  HttpError,
  base64,
  email as parseEmail,
  encString,
  handleError,
  json,
  kdf as parseKdf,
  readJson,
} from "@/lib/server/http";
import { hashAuth } from "@/lib/server/password";
import { createSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = parseEmail(body.email);
    const salt = base64(body.salt, "salt", 64);
    const kdf = parseKdf(body.kdf);
    const authHash = base64(body.authHash, "authHash", 64);
    const encryptedUserKey = encString(body.encryptedUserKey, "encryptedUserKey", 200);
    const hint =
      typeof body.hint === "string" && body.hint.trim() ? body.hint.trim().slice(0, HINT_MAX) : null;

    const rows = await sql`
      INSERT INTO users (email, kdf_salt, kdf_iterations, kdf_memory_kib, kdf_parallelism,
                         auth_hash, encrypted_user_key, password_hint)
      VALUES (${email}, ${salt}, ${kdf.iterations}, ${kdf.memoryKiB}, ${kdf.parallelism},
              ${await hashAuth(authHash)}, ${encryptedUserKey}, ${hint})
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;
    if (!rows[0]) throw new HttpError(409, "Konto z tym adresem e-mail już istnieje.");

    await createSession(rows[0].id as string);
    return json({ ok: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
