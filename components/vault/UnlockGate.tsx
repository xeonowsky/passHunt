"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { fetchMe, logout, type Me } from "@/lib/auth/client";
import { getUserKey, subscribeUserKey } from "@/lib/crypto/keystore";
import { UnlockForm } from "@/components/vault/UnlockForm";

type Session = { status: "loading" } | { status: "guest" } | { status: "error" } | { status: "ok"; me: Me };

export type Unlocked = { userKey: CryptoKey; me: Me; onLogout: () => void };

/** Pokazuje treść tylko zalogowanemu użytkownikowi z odblokowanym kluczem. */
export function UnlockGate({ children }: { children: (ctx: Unlocked) => ReactNode }) {
  const router = useRouter();
  const userKey = useSyncExternalStore(subscribeUserKey, getUserKey, () => null);
  const [session, setSession] = useState<Session>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetchMe()
      .then((me) => active && setSession(me ? { status: "ok", me } : { status: "guest" }))
      .catch(() => active && setSession({ status: "error" }));
    return () => {
      active = false;
    };
  }, []);

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  if (session.status === "loading") {
    return <p className="text-sm text-muted">Wczytywanie…</p>;
  }

  if (session.status === "error") {
    return <Centered title="Brak połączenia" text="Nie udało się połączyć z serwerem. Odśwież stronę za chwilę." />;
  }

  if (session.status === "guest") {
    return (
      <Centered title="Sejf jest zamknięty" text="Zaloguj się, aby zobaczyć swoje sejfy.">
        <Link
          href="/login"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Zaloguj się
        </Link>
      </Centered>
    );
  }

  if (!userKey) {
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border border-line bg-surface p-6 sm:p-8">
        <UnlockForm me={session.me} onLogout={onLogout} />
      </div>
    );
  }

  return <>{children({ userKey, me: session.me, onLogout })}</>;
}

function Centered({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {children}
    </div>
  );
}
