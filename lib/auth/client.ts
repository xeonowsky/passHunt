/**
 * Warstwa klienta uwierzytelniania.
 *
 * ZASADA ZERO-KNOWLEDGE: hasło główne NIGDY nie opuszcza przeglądarki.
 *   rejestracja: Argon2id(hasło, sól) → klucz główny → HKDF → authHash + encKey
 *                losowy klucz użytkownika szyfrowany encKey → POST /api/v1/auth/register
 *   logowanie:   POST /api/v1/auth/prelogin (email) → sól + parametry KDF
 *                → Argon2id → authHash → POST /api/v1/auth/login → odszyfrowanie klucza użytkownika
 */
import { api, ApiError } from "@/lib/api";
import { createAccountKeys, deriveAuth, unwrapUserKey } from "@/lib/crypto/account";
import type { KdfParams } from "@/lib/crypto/kdf";
import { setUserKey } from "@/lib/crypto/keystore";
import { clearSessionHint, notifySessionChange } from "@/lib/auth/session-hint";

export type AuthResult = { ok: true } | { ok: false; error: string };

export const AUTH_BACKEND_READY = true;

export type Me = {
  email: string;
  salt: string;
  kdf: KdfParams;
  encryptedUserKey: string;
  createdAt: string;
  vaultCount: number;
};

const fail = (error: unknown): AuthResult => ({
  ok: false,
  error: error instanceof ApiError ? error.message : "Nie udało się wykonać operacji. Spróbuj ponownie.",
});

export async function registerAccount(input: {
  email: string;
  masterPassword: string;
  hint?: string;
}): Promise<AuthResult> {
  try {
    const keys = await createAccountKeys(input.masterPassword);
    await api("/auth/register", {
      body: {
        email: input.email,
        salt: keys.salt,
        kdf: keys.kdf,
        authHash: keys.authHash,
        encryptedUserKey: keys.encryptedUserKey,
        hint: input.hint,
      },
    });
    setUserKey(keys.userKey);
    notifySessionChange();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export type LoginStage = "kdf" | "server" | "unlock";

export async function login(
  input: { email: string; masterPassword: string },
  onStage?: (stage: LoginStage) => void,
): Promise<AuthResult> {
  try {
    onStage?.("kdf");
    const pre = await api<{ salt: string; kdf: KdfParams }>("/auth/prelogin", {
      body: { email: input.email },
    });
    const { authHash, encKey } = await deriveAuth(input.masterPassword, pre.salt, pre.kdf);
    onStage?.("server");
    const res = await api<{ encryptedUserKey: string }>("/auth/login", {
      body: { email: input.email, authHash },
    });
    onStage?.("unlock");
    setUserKey(await unwrapUserKey(encKey, res.encryptedUserKey));
    notifySessionChange();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/** Odblokowanie po odświeżeniu strony – lokalnie, bez wysyłania czegokolwiek na serwer. */
export async function unlock(me: Me, masterPassword: string): Promise<AuthResult> {
  try {
    const { encKey } = await deriveAuth(masterPassword, me.salt, me.kdf);
    setUserKey(await unwrapUserKey(encKey, me.encryptedUserKey));
    return { ok: true };
  } catch {
    return { ok: false, error: "Nieprawidłowe hasło główne." };
  }
}

export async function fetchMe(): Promise<Me | null> {
  try {
    return await api<Me>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearSessionHint(); // sesja wygasła – pasek ma znów pokazać „Zaloguj się”
      return null;
    }
    throw error;
  }
}

export async function logout() {
  setUserKey(null);
  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
  clearSessionHint();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
