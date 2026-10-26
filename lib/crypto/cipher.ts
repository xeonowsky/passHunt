/**
 * AES-256-GCM przez WebCrypto.
 * Format zaszyfrowanego tekstu: "v1.<iv base64>.<szyfrogram+tag base64>"
 */
import { fromBase64, randomBytes, toBase64, utf8 } from "@/lib/crypto/encoding";

export type EncString = string;

const VERSION = "v1";
const IV_LENGTH = 12;

export async function importAesKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  if (raw.length !== 32) throw new Error("Klucz AES musi mieć 32 bajty.");
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export function generateKeyBytes(): Uint8Array<ArrayBuffer> {
  return randomBytes(32);
}

export async function encryptBytes(key: CryptoKey, data: Uint8Array<ArrayBuffer>): Promise<EncString> {
  const iv = randomBytes(IV_LENGTH);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return `${VERSION}.${toBase64(iv)}.${toBase64(new Uint8Array(cipher))}`;
}

/** Rzuca wyjątek, gdy klucz jest zły lub dane zostały zmienione (tag GCM). */
export async function decryptBytes(key: CryptoKey, value: EncString): Promise<Uint8Array<ArrayBuffer>> {
  const [version, iv, data] = value.split(".");
  if (version !== VERSION || !iv || !data) throw new Error("Nieznany format szyfrogramu.");
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(data),
  );
  return new Uint8Array(plain);
}

export async function encryptText(key: CryptoKey, text: string): Promise<EncString> {
  return encryptBytes(key, utf8.encode(text));
}

export async function decryptText(key: CryptoKey, value: EncString): Promise<string> {
  return utf8.decode(await decryptBytes(key, value));
}
