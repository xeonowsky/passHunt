import "server-only";
import { unstable_rethrow } from "next/navigation";
import { KDF_BOUNDS } from "@/lib/limits";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });

/** Wymaga application/json – formularz z obcej strony nie wyśle takiego żądania bez preflightu (ochrona CSRF). */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "Oczekiwano application/json.");
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Nieprawidłowe dane.");
  }
  return body as Record<string, unknown>;
}

export function handleError(error: unknown) {
  // Wewnętrzne sygnały Next.js (np. przerwanie prerenderu) muszą przejść dalej.
  unstable_rethrow(error);
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(error);
  // W trybie deweloperskim pokazujemy przyczynę – na produkcji nie zdradzamy szczegółów.
  const detail =
    process.env.NODE_ENV === "development" && error instanceof Error ? ` (${error.message})` : "";
  return json({ error: `Błąd serwera. Spróbuj ponownie.${detail}` }, 500);
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const ENC_STRING = /^v1\.[A-Za-z0-9+/]{16}\.[A-Za-z0-9+/]+={0,2}$/;

export function str(value: unknown, field: string, { max, pattern }: { max: number; pattern?: RegExp }) {
  if (typeof value !== "string" || !value || value.length > max || (pattern && !pattern.test(value))) {
    throw new HttpError(400, `Nieprawidłowe pole: ${field}.`);
  }
  return value;
}

export const encString = (value: unknown, field: string, max: number) =>
  str(value, field, { max, pattern: ENC_STRING });

export const base64 = (value: unknown, field: string, max: number) =>
  str(value, field, { max, pattern: BASE64 });

export function email(value: unknown) {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    throw new HttpError(400, "Nieprawidłowy adres e-mail.");
  }
  return v;
}

export function kdf(value: unknown) {
  const v = (value ?? {}) as Record<string, unknown>;
  const pick = (key: keyof typeof KDF_BOUNDS) => {
    const n = v[key];
    const { min, max } = KDF_BOUNDS[key];
    if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
      throw new HttpError(400, "Nieprawidłowe parametry KDF.");
    }
    return n;
  };
  return { iterations: pick("iterations"), memoryKiB: pick("memoryKiB"), parallelism: pick("parallelism") };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function uuid(value: unknown, what = "Nie znaleziono.") {
  if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(404, what);
  return value;
}
