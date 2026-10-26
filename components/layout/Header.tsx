import { Suspense } from "react";
import { Logo } from "@/components/ui/Logo";
import { MainNav } from "@/components/layout/MainNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        {/* MainNav używa usePathname() – na trasach z nieznanym parametrem (np. /vault/[id])
            adres jest znany dopiero przy żądaniu, więc pasek musi być w Suspense. */}
        <Suspense fallback={<div aria-hidden="true" className="h-10 flex-1" />}>
          <MainNav />
        </Suspense>
      </div>
    </header>
  );
}
