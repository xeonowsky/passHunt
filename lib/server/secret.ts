import "server-only";

export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Brak AUTH_SECRET w .env (min. 32 znaki).");
  }
  return secret;
}
