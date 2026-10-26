/// <reference lib="webworker" />
/** Argon2id poza głównym wątkiem – UI nie zamarza podczas wyprowadzania klucza. */
import { argon2id } from "hash-wasm";

type Request = {
  password: Uint8Array<ArrayBuffer>;
  salt: Uint8Array<ArrayBuffer>;
  iterations: number;
  memoryKiB: number;
  parallelism: number;
};

self.onmessage = async (event: MessageEvent<Request>) => {
  const { password, salt, iterations, memoryKiB, parallelism } = event.data;
  try {
    const hash = await argon2id({
      password,
      salt,
      iterations,
      memorySize: memoryKiB,
      parallelism,
      hashLength: 32,
      outputType: "binary",
    });
    password.fill(0);
    self.postMessage({ ok: true, hash }, [hash.buffer]);
  } catch (error) {
    self.postMessage({ ok: false, error: String(error) });
  }
};
