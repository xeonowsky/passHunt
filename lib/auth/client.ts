/**
 * Warstwa klienta uwierzytelniania.
 *
 * ZASADA ZERO-KNOWLEDGE: hasło główne NIGDY nie opuszcza przeglądarki.
 * Docelowy przepływ (etap E2):
 *   rejestracja: Argon2id(hasło, sól) → klucz główny → hash uwierzytelniający
 *                + zaszyfrowany klucz sejfu → POST /api/v1/auth/register
 *   logowanie:   POST /api/v1/auth/prelogin (email) → parametry KDF
 *                → Argon2id → hash uwierzytelniający → POST /api/v1/auth/login
 *
 * Do czasu podłączenia KDF i API funkcje poniżej tylko symulują wywołanie
 * i niczego nie wysyłają.
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

export const AUTH_BACKEND_READY = false;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function registerAccount(input: {
  email: string;
  masterPassword: string;
  hint?: string;
}): Promise<AuthResult> {
  void input; // TODO(E2): Argon2id + POST /api/v1/auth/register
  await delay(600);
  return {
    ok: false,
    error: "Rejestracja nie jest jeszcze podłączona do serwera (etap E2). Formularz jest poprawny.",
  };
}

export async function login(input: {
  email: string;
  masterPassword: string;
}): Promise<AuthResult> {
  void input; // TODO(E2): prelogin → Argon2id → POST /api/v1/auth/login
  await delay(600);
  return {
    ok: false,
    error: "Logowanie nie jest jeszcze podłączone do serwera (etap E2). Formularz jest poprawny.",
  };
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
