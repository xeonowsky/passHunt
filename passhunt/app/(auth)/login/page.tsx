import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się i odblokuj swój sejf passHunt.",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Odblokuj sejf</h1>
      <p className="mt-2 text-sm text-muted">
        Zaloguj się adresem e-mail i hasłem głównym.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </>
  );
}
