"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { isValidEmail, login, AUTH_BACKEND_READY, type LoginStage } from "@/lib/auth/client";

type Errors = Partial<Record<"email" | "password", string>>;

const STAGE_LABEL: Record<LoginStage, string> = {
  kdf: "Wyprowadzanie klucza…",
  server: "Logowanie…",
  unlock: "Odblokowywanie sejfu…",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState<LoginStage>("kdf");
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);

    const next: Errors = {};
    if (!isValidEmail(email)) next.email = "Podaj poprawny adres e-mail.";
    if (!password) next.password = "Podaj hasło główne.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await login({ email: email.trim().toLowerCase(), masterPassword: password }, setStage);
    setPending(false);

    if (res.ok) {
      router.push("/vault");
      return;
    }
    setNotice({ tone: AUTH_BACKEND_READY ? "error" : "info", text: res.error });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {notice && <FormNotice tone={notice.tone}>{notice.text}</FormNotice>}

      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        placeholder="ty@przyklad.pl"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <PasswordField
        label="Hasło główne"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        labelAside={
          <button
            type="button"
            onClick={() => setShowRecoveryInfo((v) => !v)}
            aria-expanded={showRecoveryInfo}
            className="text-xs text-muted underline-offset-4 transition-colors hover:text-accent-text hover:underline"
          >
            Nie pamiętasz hasła?
          </button>
        }
      >
        {showRecoveryInfo && (
          <p className="mt-3 rounded-md border border-line bg-background p-3 text-xs leading-5 text-muted">
            passHunt nie zna Twojego hasła głównego, więc nie może go zresetować ani
            odzyskać – to cena architektury zero-knowledge. Wysyłanie podpowiedzi
            do hasła na e-mail jest w przygotowaniu.
          </p>
        )}
      </PasswordField>

      <SubmitButton pending={pending}>
        {pending ? STAGE_LABEL[stage] : "Zaloguj się"}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Nie masz konta?{" "}
        <Link href="/register" className="font-medium text-accent-text hover:underline">
          Załóż sejf
        </Link>
      </p>
    </form>
  );
}
