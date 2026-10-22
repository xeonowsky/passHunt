import Link from "next/link";
import { SpotlightGrid } from "@/components/ui/SpotlightGrid";

const features = [
  {
    title: "Szyfrowanie po stronie klienta",
    body: "Hasła są szyfrowane w przeglądarce (AES-256-GCM), zanim cokolwiek trafi na serwer.",
    icon: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
  },
  {
    title: "Generator haseł",
    body: "Długie, losowe hasła z wybranym zestawem znaków – jednym kliknięciem.",
    icon: "M4 4h16v16H4zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01",
  },
  {
    title: "Grupy i wyszukiwanie",
    body: "Porządkuj wpisy w grupach i znajduj je natychmiast po nazwie, loginie lub adresie.",
    icon: "M3 7h7l2 2h9v10H3zM15 15l3 3",
  },
  {
    title: "Sprawdzanie wycieków",
    body: "Weryfikacja haseł w bazie Have I Been Pwned metodą k-anonymity – bez wysyłania hasła.",
    icon: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM9 12l2 2 4-4",
  },
  {
    title: "Uwierzytelnianie 2FA",
    body: "Dodatkowa warstwa ochrony konta kodami TOTP z aplikacji uwierzytelniającej.",
    icon: "M7 3h10v18H7zM11 18h2",
  },
  {
    title: "Automatyczna blokada",
    body: "Sejf blokuje się po okresie bezczynności, a klucz znika z pamięci.",
    icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
];

const steps = [
  {
    n: "01",
    title: "Hasło główne",
    body: "Znasz je tylko Ty. Nigdy nie opuszcza Twojego urządzenia.",
  },
  {
    n: "02",
    title: "Klucz z Argon2id",
    body: "Z hasła głównego przeglądarka wyprowadza klucz szyfrujący – kosztowny do złamania.",
  },
  {
    n: "03",
    title: "Szyfrowanie lokalne",
    body: "Każdy wpis jest szyfrowany AES-256-GCM, zanim zostanie wysłany.",
  },
  {
    n: "04",
    title: "Serwer widzi szyfrogram",
    body: "Baza przechowuje wyłącznie zaszyfrowane dane. Nawet administrator ich nie odczyta.",
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.6] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              zero-knowledge · open design
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Twoje hasła.
              <br />
              <span className="text-accent-text">Tylko Twoje.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              passHunt to osobisty menedżer haseł, który szyfruje wszystko na
              Twoim urządzeniu. Serwer przechowuje tylko szyfrogram – bez klucza
              jest bezużyteczny.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 font-medium text-accent-ink transition-opacity hover:opacity-90"
              >
                Załóż sejf
              </Link>
              <Link
                href="#jak-to-dziala"
                className="inline-flex h-12 items-center justify-center rounded-md border border-line px-6 font-medium text-foreground transition-colors hover:border-accent"
              >
                Jak to działa?
              </Link>
            </div>
          </div>

          {/* Mock sejfu */}
          <div className="rounded-xl border border-line bg-surface p-4 shadow-[0_0_80px_-20px_rgba(215,255,58,0.25)]">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">sejf / wszystkie</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-accent-text">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                odblokowany
              </span>
            </div>
            <ul className="divide-y divide-line">
              {[
                ["github.com", "klaudiusz", "silne"],
                ["poczta", "k.***@gmail.com", "silne"],
                ["usosweb.kul.pl", "s1*****", "średnie"],
                ["bank", "••••••", "silne"],
              ].map(([site, login, strength]) => (
                <li key={site} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md border border-line font-mono text-xs uppercase text-muted">
                      {site[0]}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{site}</p>
                      <p className="font-mono text-xs text-muted">{login}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                      strength === "silne"
                        ? "bg-accent/15 text-accent-text"
                        : "bg-orange-500/15 text-orange-400 light:text-orange-700"
                    }`}
                  >
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 rounded-md border border-dashed border-line px-3 py-2 font-mono text-[11px] leading-5 text-muted">
              <span className="text-foreground/70">payload →</span>{" "}
              8f3a9c…e21b · iv: 4d1f… · tag: a90c…
            </div>
          </div>
        </div>
      </section>

      {/* FUNKCJE */}
      <section id="funkcje" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-accent-text">Funkcje</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Wszystko, czego potrzebujesz – nic, czego nie chcesz.
        </h2>
        <div className="mt-12">
          <SpotlightGrid className="sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              data-spotlight-card
              className="spotlight-card group bg-background p-6"
            >
              <span className="grid h-10 w-10 place-items-center rounded-md border border-line bg-surface text-accent-text transition-colors group-hover:border-accent">
                <Icon d={f.icon} />
              </span>
              <h3 className="mt-5 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{f.body}</p>
            </article>
          ))}
          </SpotlightGrid>
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section id="jak-to-dziala" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-accent-text">
            Jak to działa
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Od hasła głównego do szyfrogramu w czterech krokach.
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="relative border-t border-line pt-6">
                <span className="absolute -top-px left-0 h-px w-12 bg-accent" />
                <span className="font-mono text-sm text-accent-text">{s.n}</span>
                <h3 className="mt-3 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* BEZPIECZEŃSTWO */}
      <section id="bezpieczenstwo" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent-text">
              Bezpieczeństwo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Architektura, w której serwer niczego nie wie.
            </h2>
            <p className="mt-6 leading-7 text-muted">
              Nawet przy wycieku bazy danych atakujący dostaje tylko zaszyfrowane
              bloki. Hasło główne nie jest nigdzie zapisywane – dlatego jego utrata
              oznacza utratę dostępu do sejfu.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {[
              ["AES-256-GCM", "szyfrowanie wpisów"],
              ["Argon2id", "wyprowadzanie klucza"],
              ["TOTP", "logowanie dwuetapowe"],
              ["k-anonymity", "sprawdzanie wycieków"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-surface p-5">
                <dt className="font-mono text-lg font-semibold text-foreground">{k}</dt>
                <dd className="mt-1 text-sm text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mb-20 w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-surface p-8 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Gotowy, by zamknąć hasła w sejfie?</h2>
            <p className="mt-2 text-muted">Konto zakładasz w minutę. Klucz zostaje u Ciebie.</p>
          </div>
          <Link
            href="/register"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-accent px-6 font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            Załóż konto
          </Link>
        </div>
      </section>
    </>
  );
}
