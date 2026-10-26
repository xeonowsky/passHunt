import { RedirectIfLoggedIn } from "@/components/auth/RedirectIfLoggedIn";

const points = [
  ["Hasło główne zostaje u Ciebie", "Klucz jest wyprowadzany w przeglądarce algorytmem Argon2id."],
  ["Serwer widzi tylko szyfrogram", "Wpisy są szyfrowane AES-256-GCM przed wysłaniem."],
  ["Brak tylnych drzwi", "Nikt – także administrator – nie odczyta Twojego sejfu."],
] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden">
      <RedirectIfLoggedIn />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.6] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_440px] lg:py-24">
        <aside className="hidden lg:block">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text">
            zero-knowledge
          </p>
          <h2 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Klucz do sejfu masz <span className="text-accent-text">tylko Ty</span>.
          </h2>
          <ul className="mt-10 max-w-md space-y-6">
            {points.map(([title, body]) => (
              <li key={title} className="flex gap-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_12px_var(--accent)]" />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="w-full rounded-xl border border-line bg-surface p-6 shadow-[0_0_80px_-30px_rgba(215,255,58,0.35)] sm:p-8">
          {children}
        </div>
      </div>
    </section>
  );
}
