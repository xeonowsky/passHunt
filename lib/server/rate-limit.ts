import "server-only";
import { sql } from "@/lib/db";
import { HttpError } from "@/lib/server/http";

/** Nieudane logowania w oknie 15 minut: max 5 na konto i 20 z jednego adresu IP. */
const WINDOW_MINUTES = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function assertLoginAllowed(email: string, ip: string) {
  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE email = ${email})::int AS by_email,
      count(*) FILTER (WHERE ip = ${ip})::int       AS by_ip,
      min(created_at) FILTER (WHERE email = ${email}) AS oldest_email
    FROM login_attempts
    WHERE created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
      AND (email = ${email} OR ip = ${ip})
  `;
  const { by_email, by_ip, oldest_email } = rows[0] as {
    by_email: number;
    by_ip: number;
    oldest_email: string | null;
  };

  if (by_email >= MAX_PER_EMAIL || by_ip >= MAX_PER_IP) {
    const unlockAt = oldest_email
      ? new Date(oldest_email).getTime() + WINDOW_MINUTES * 60_000
      : Date.now() + WINDOW_MINUTES * 60_000;
    const minutes = Math.max(1, Math.ceil((unlockAt - Date.now()) / 60_000));
    throw new HttpError(429, `Za dużo nieudanych prób logowania. Spróbuj ponownie za ${minutes} min.`);
  }
}

export async function recordFailedLogin(email: string, ip: string) {
  await sql`INSERT INTO login_attempts (email, ip) VALUES (${email}, ${ip})`;
  // Sprzątanie od czasu do czasu: stare próby i wygasłe sesje.
  if (Math.random() < 0.05) {
    await sql`DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'`;
    await sql`DELETE FROM sessions WHERE expires_at < now()`;
  }
}

export async function clearFailedLogins(email: string) {
  await sql`DELETE FROM login_attempts WHERE email = ${email}`;
}
