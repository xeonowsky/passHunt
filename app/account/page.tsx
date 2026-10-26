import type { Metadata } from "next";
import { AccountApp } from "@/components/account/AccountApp";

export const metadata: Metadata = {
  title: "Moje konto",
  description: "Ustawienia i bezpieczeństwo konta passHunt.",
};

export default function AccountPage() {
  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
      <AccountApp />
    </section>
  );
}
