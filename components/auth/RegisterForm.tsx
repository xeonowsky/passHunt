"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { TextField } from "@/components/auth/TextField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { FormNotice } from "@/components/auth/FormNotice";
import { isValidEmail, registerAccount, AUTH_BACKEND_READY } from "@/lib/auth/client";
import { isMasterPasswordAcceptable } from "@/lib/auth/password-strength";

type Field = "email" | "password" | "confirm" | "hint" | "ack";
type Errors = Partial<Record<Field, string>>;

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hint, setHint] = useState("");
  const [ack, setAck] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): Errors {
    const next: Errors = {};
    if (!isValidEmail(email)) next.email = "Podaj poprawny adres e-mail.";
    if (password.length < 12) next.password = "Hasło główne musi mieć co najmniej 12 znaków.";
    else if (!isMasterPasswordAcceptable(password))
      next.password = "Hasło jest zbyt słabe – wydłuż je lub dodaj różne typy znaków.";
    if (confirm !== password) next.confirm = "Hasła nie są identyczne.";
    if (hint && password && hint.toLowerCase().includes(password.toLowerCase()))
      next.hint = "Podpowiedź nie może zawierać hasła.";
    if (!ack) next.ack = "Potwierdź, że rozumiesz zasady odzyskiwania hasła.";
    return next;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await registerAccount({
      email: email.trim(),
      masterPassword: password,
      hint: hint.trim() || undefined,
    });
    setPending(false);

    if (res.ok) {
      // TODO(E2): przekierowanie do /vault (lub konfiguracji 2FA)
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
        name="new-password"
        autoComplete="new-password"
        placeholder="min. 12 znaków"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      >
        <PasswordStrength password={password} />
      </PasswordField>

      <PasswordField
        label="Powtórz hasło główne"
        name="confirm-password"
        autoComplete="new-password"
        placeholder="••••••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
      />

      <TextField
        label="Podpowiedź do hasła (opcjonalnie)"
        name="hint"
        autoComplete="off"
        placeholder="np. ulubiona książka + rok"
        maxLength={100}
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        error={errors.hint}
        hint="Przechowywana bez szyfrowania – nie wpisuj tu hasła."
      />

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-background p-4 text-sm leading-6">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            aria-invalid={!!errors.ack}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-muted">
            Rozumiem, że <span className="text-foreground">passHunt nie może odzyskać</span>{" "}
            mojego hasła głównego. Jeśli je zapomnę, stracę dostęp do sejfu.
          </span>
        </label>
        {errors.ack && <p className="mt-2 text-sm text-red-500">{errors.ack}</p>}
      </div>

      <SubmitButton pending={pending}>
        {pending ? "Tworzenie sejfu…" : "Załóż konto"}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Masz już konto?{" "}
        <Link href="/login" className="font-medium text-accent-text hover:underline">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
