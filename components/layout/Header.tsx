import { Logo } from "@/components/ui/Logo";
import { MainNav } from "@/components/layout/MainNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <MainNav />
      </div>
    </header>
  );
}
