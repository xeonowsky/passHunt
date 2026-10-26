/**
 * Hasło główne → klucz główny (Argon2id) → dwa klucze pochodne (HKDF-SHA256):
 *  - authHash: wysyłany na serwer jako "hasło" do logowania (serwer i tak go haszuje),
 *  - encKey:   klucz AES, który szyfruje losowy klucz użytkownika. Nie opuszcza przeglądarki.
 * Z authHash nie da się odtworzyć encKey, więc serwer nie odszyfruje sejfów.
 */
import { argon2id } from "hash-wasm";
import { fromBase64, randomBytes, toBase64, utf8 } from "@/lib/crypto/encoding";
import { DEFAULT_KDF as LIMITS_DEFAULT_KDF } from "@/lib/limits";

export type KdfParams = {
  iterations: number;
  memoryKiB: number;
  parallelism: number;
};

export const DEFAULT_KDF: KdfParams = LIMITS_DEFAULT_KDF;

export function generateSalt(): string {
  return toBase64(randomBytes(16));
}

export async function deriveMasterKey(
  password: string,
  salt: string,
  params: KdfParams,
): Promise<Uint8Array<ArrayBuffer>> {
  const input = {
    password: utf8.encode(password.normalize("NFKC")),
    salt: fromBase64(salt),
    iterations: params.iterations,
    memoryKiB: params.memoryKiB,
    parallelism: params.parallelism,
  };

  try {
    if (typeof Worker !== "undefined") {
      try {
        return await deriveInWorker(input);
      } catch {
        // np. blokada workerów przez rozszerzenie – liczymy w głównym wątku
      }
    }

    const hash = await argon2id({
      password: input.password,
      salt: input.salt,
      iterations: input.iterations,
      memorySize: input.memoryKiB,
      parallelism: input.parallelism,
      hashLength: 32,
      outputType: "binary",
    });
    return new Uint8Array(hash);
  } finally {
    input.password.fill(0);
  }
}

function deriveInWorker(input: {
  password: Uint8Array<ArrayBuffer>;
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
  memoryKiB: number;
  parallelism: number;
}): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./kdf.worker.ts", import.meta.url), { type: "module" });
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Przekroczono czas Argon2id w workerze"));
    }, 30_000);
    const done = () => {
      clearTimeout(timer);
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<{ ok: boolean; hash?: Uint8Array<ArrayBuffer>; error?: string }>) => {
      done();
      if (event.data.ok && event.data.hash) resolve(new Uint8Array(event.data.hash));
      else reject(new Error(event.data.error ?? "Błąd Argon2id"));
    };
    worker.onerror = (event) => {
      done();
      event.preventDefault();
      reject(new Error("Worker Argon2id nie wystartował"));
    };
    // Worker dostaje kopię hasła i sam ją zeruje; oryginał zeruje deriveMasterKey.
    worker.postMessage({ ...input, password: input.password.slice() });
  });
}

export async function deriveKeys(masterKey: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey("raw", masterKey, "HKDF", false, [
    "deriveBits",
    "deriveKey",
  ]);
  const hkdf = (info: string) => ({
    name: "HKDF",
    hash: "SHA-256",
    salt: new Uint8Array(0),
    info: utf8.encode(info),
  });

  const authBits = await crypto.subtle.deriveBits(hkdf("passhunt-auth-v1"), base, 256);
  const encKey = await crypto.subtle.deriveKey(
    hkdf("passhunt-enc-v1"),
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );

  return { authHash: toBase64(new Uint8Array(authBits)), encKey };
}
