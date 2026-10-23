import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto i utwórz swój zaszyfrowany sejf passHunt.",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Załóż sejf</h1>
      <p className="mt-2 text-sm text-muted">
        Wybierz silne hasło główne – to jedyny klucz do Twoich danych.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </>
  );
}
