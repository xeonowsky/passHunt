import type { Metadata } from "next";
import { VaultApp } from "@/components/vault/VaultApp";

export const metadata: Metadata = {
  title: "Sejfy",
  description: "Twoje zaszyfrowane sejfy passHunt.",
};

export default function VaultPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
      <VaultApp />
    </section>
  );
}
