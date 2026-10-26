import { sql } from "@/lib/db";
import { HttpError, base64, email as parseEmail, handleError, json, readJson } from "@/lib/server/http";
import { dummyHash, verifyAuth } from "@/lib/server/password";
import { assertLoginAllowed, clearFailedLogins, clientIp, recordFailedLogin } from "@/lib/server/rate-limit";
import { createSession } from "@/lib/server/session";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const email = parseEmail(body.email);
    const authHash = base64(body.authHash, "authHash", 64);
    const ip = clientIp(request);

    await assertLoginAllowed(email, ip);

    const rows = await sql`SELECT id, auth_hash, encrypted_user_key FROM users WHERE email = ${email}`;
    const user = rows[0];

    // Weryfikacja wykonuje się zawsze – czas odpowiedzi nie zdradza, czy konto istnieje.
    const valid = await verifyAuth(authHash, (user?.auth_hash as string) ?? (await dummyHash()));
    if (!user || !valid) {
      await recordFailedLogin(email, ip);
      throw new HttpError(401, "Nieprawidłowy e-mail lub hasło główne.");
    }

    await clearFailedLogins(email);
    await createSession(user.id as string);
    return json({ encryptedUserKey: user.encrypted_user_key });
  } catch (error) {
    return handleError(error);
  }
}
