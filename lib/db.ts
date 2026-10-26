import "server-only";
import { neon } from "@neondatabase/serverless";

// Next.js sam wczytuje .env do process.env – dotenv nie jest potrzebny.
// Bez prefiksu NEXT_PUBLIC_ zmienna jest dostępna wyłącznie po stronie serwera.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Brak DATABASE_URL w .env – dodaj connection string z Neona.");
}

export const sql = neon(databaseUrl);
