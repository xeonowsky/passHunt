"use client";

import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { unlock, type Me } from "@/lib/auth/client";

export function UnlockForm({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) return setError("Podaj hasło główne.");
    setError(null);
    setPending(true);
    const res = await unlock(me, password);
    setPending(false);
    if (!res.ok) setError(res.error);
    else setPassword("");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Odblokuj sejf</h1>
        <p className="mt-2 text-sm text-muted">
          Zalogowano jako <span className="text-foreground">{me.email}</span>. Klucz szyfrujący
          zniknął z pamięci – podaj hasło główne.
        </p>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {/* Ukryte pole pomaga menedżerom haseł dopasować konto */}
      <input type="email" name="email" autoComplete="username" value={me.email} readOnly hidden />

      <PasswordField
        label="Hasło główne"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <SubmitButton pending={pending}>{pending ? "Odblokowywanie…" : "Odblokuj"}</SubmitButton>

      <button
        type="button"
        onClick={onLogout}
        className="w-full text-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
      >
        Wyloguj się
      </button>
    </form>
  );
}
