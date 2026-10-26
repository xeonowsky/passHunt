import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";

/**
 * authHash z przeglądarki to już 256-bitowy wynik Argon2id + HKDF.
 * Serwer dodatkowo haszuje go scryptem, żeby wyciek bazy nie dawał gotowego "hasła" do logowania.
 */
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

function scryptAsync(input: BinaryLike, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(input, salt, KEY_LENGTH, { N, r: R, p: P }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashAuth(authHash: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(authHash, salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyAuth(authHash: string, stored: string): Promise<boolean> {
  const [, , , , salt, key] = stored.split("$");
  if (!salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scryptAsync(authHash, Buffer.from(salt, "base64"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Stały hasz do porównania, gdy konto nie istnieje (wyrównuje czas odpowiedzi). */
let dummy: Promise<string> | null = null;
export function dummyHash() {
  dummy ??= hashAuth("passhunt-dummy");
  return dummy;
}
