import { createHmac } from "node:crypto";
import { sql } from "@/lib/db";
import { DEFAULT_KDF } from "@/lib/limits";
import { email as parseEmail, handleError, json, readJson } from "@/lib/server/http";
import { authSecret } from "@/lib/server/secret";

/** Zwraca sól i parametry Argon2id. Dla nieznanego e-maila – stała, fałszywa sól (bez zdradzania, czy konto istnieje). */
export async function POST(request: Request) {
  try {
    const email = parseEmail((await readJson(request)).email);
    const rows = await sql`
      SELECT kdf_salt, kdf_iterations, kdf_memory_kib, kdf_parallelism
      FROM users WHERE email = ${email}
    `;
    const user = rows[0];

    if (!user) {
      const salt = createHmac("sha256", authSecret()).update(`salt:${email}`).digest().subarray(0, 16);
      return json({ salt: salt.toString("base64"), kdf: DEFAULT_KDF });
    }

    return json({
      salt: user.kdf_salt,
      kdf: {
        iterations: user.kdf_iterations,
        memoryKiB: user.kdf_memory_kib,
        parallelism: user.kdf_parallelism,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
