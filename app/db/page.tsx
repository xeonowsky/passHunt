import { Suspense } from "react";
import { connection } from "next/server";
import { sql } from "@/lib/db";

async function DbVersion() {
  // Zapytanie ma się wykonać przy każdym żądaniu, a nie podczas prerenderu.
  await connection();

  const result = await sql`SELECT version()`;
  const { version } = result[0] as { version: string };

  return <code className="break-all text-sm">{version}</code>;
}

export default function DbPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-4 text-2xl font-semibold">Połączenie z bazą Neon</h1>
      <Suspense fallback={<p>Łączenie z bazą…</p>}>
        <DbVersion />
      </Suspense>
    </main>
  );
}
