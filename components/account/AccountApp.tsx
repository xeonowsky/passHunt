"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { fetchMe, logout, type Me } from "@/lib/auth/client";
import { getUserKey, setUserKey, subscribeUserKey } from "@/lib/crypto/keystore";

type State = { status: "loading" } | { status: "guest" } | { status: "error" } | { status: "ok"; me: Me };

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" });

export function AccountApp() {
  const router = useRouter();
  const unlocked = useSyncExternalStore(subscribeUserKey, () => !!getUserKey(), () => false);
  const [state, setState] = useState<State>({ status: "loading" });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((me) => active && setState(me ? { status: "ok", me } : { status: "guest" }))
      .catch(() => active && setState({ status: "error" }));
    return () => {
      active = false;
    };
  }, []);

  async function onLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
  }

  if (state.status === "loading") return <p className="text-sm text-muted">Wczytywanie…</p>;

  if (state.status === "error") {
    return <p className="text-sm text-muted">Nie udało się połączyć z serwerem. Odśwież stronę za chwilę.</p>;
  }

  if (state.status === "guest") {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Nie jesteś zalogowany</h1>
        <p className="mt-2 text-sm text-muted">Zaloguj się, aby zobaczyć ustawienia konta.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Zaloguj się
        </Link>
      </div>
    );
  }

  const { me } = state;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-accent-text">Moje konto</p>
        <h1 className="mt-2 break-all text-3xl font-semibold tracking-tight">{me.email}</h1>
        <p className="mt-2 text-sm text-muted">
          Konto założone {dateFormat.format(new Date(me.createdAt))}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Sejfy">
          <p className="text-3xl font-semibold">{me.vaultCount}</p>
          <Link href="/vault" className="mt-3 inline-block text-sm font-medium text-accent-text hover:underline">
            Przejdź do sejfów →
          </Link>
        </Card>

        <Card title="Stan sejfu">
          <p className="flex items-center gap-2 font-medium">
            <span
              className={`h-2 w-2 rounded-full ${unlocked ? "bg-accent shadow-[0_0_12px_var(--accent)]" : "bg-muted"}`}
            />
            {unlocked ? "Odblokowany" : "Zablokowany"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {unlocked
              ? "Klucz szyfrujący jest w pamięci tej karty."
              : "Podaj hasło główne w sejfie, aby go odblokować."}
          </p>
          {unlocked && (
            <button
              type="button"
              onClick={() => setUserKey(null)}
              className="mt-3 text-sm font-medium text-accent-text hover:underline"
            >
              Zablokuj teraz
            </button>
          )}
        </Card>
      </div>

      <Card title="Bezpieczeństwo">
        <dl className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
          <dt className="text-muted">Wyprowadzanie klucza</dt>
          <dd className="font-mono">
            Argon2id · {Math.round(me.kdf.memoryKiB / 1024)} MiB · {me.kdf.iterations} iter. ·{" "}
            {me.kdf.parallelism} {me.kdf.parallelism === 1 ? "wątek" : "wątki"}
          </dd>
          <dt className="text-muted">Szyfrowanie</dt>
          <dd className="font-mono">AES-256-GCM, osobny klucz dla każdego sejfu</dd>
          <dt className="text-muted">Hasło główne</dt>
          <dd>Znane tylko Tobie – serwer go nie zna i nie może go zresetować.</dd>
        </dl>
      </Card>

      <div className="flex justify-end border-t border-line pt-6">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="h-11 rounded-md border border-line px-5 text-sm text-muted transition-colors hover:border-red-500/50 hover:text-red-500 disabled:opacity-60"
        >
          {loggingOut ? "Wylogowywanie…" : "Wyloguj się"}
        </button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}
