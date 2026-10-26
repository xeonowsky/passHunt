import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { HttpError } from "@/lib/server/http";

const COOKIE = "ph_session";
/** Jawna flaga dla UI (pasek nawigacji). Nie daje dostępu do niczego – autoryzuje wyłącznie ph_session. */
const HINT_COOKIE = "ph_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dni

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, ${expires.toISOString()})
  `;

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  store.set(HINT_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT user_id FROM sessions
    WHERE token_hash = ${hashToken(token)} AND expires_at > now()
  `;
  return (rows[0]?.user_id as string | undefined) ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  store.delete(COOKIE);
  store.delete(HINT_COOKIE);
}

export async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) throw new HttpError(401, "Nie jesteś zalogowany.");
  return userId;
}
