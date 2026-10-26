import type { Metadata } from "next";
import { Suspense } from "react";
import { VaultDetail } from "@/components/vault/VaultDetail";

export const metadata: Metadata = {
  title: "Sejf",
  description: "Wpisy w Twoim zaszyfrowanym sejfie.",
};

export default function VaultDetailPage() {
  return (
    <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
      <Suspense fallback={<p className="text-sm text-muted">Wczytywanie…</p>}>
        <VaultDetail />
      </Suspense>
    </section>
  );
}
