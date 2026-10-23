export const site = {
  name: "passHunt",
  tagline: "Twoje hasła. Tylko Twoje.",
  description:
    "passHunt to osobisty menedżer haseł z szyfrowaniem po stronie klienta. Serwer nigdy nie widzi Twoich danych.",
};

export type NavItem = { label: string; href: string };

export const mainNav: NavItem[] = [
  { label: "Funkcje", href: "/#funkcje" },
  { label: "Bezpieczeństwo", href: "/#bezpieczenstwo" },
  { label: "Jak to działa", href: "/#jak-to-dziala" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Produkt",
    items: [
      { label: "Funkcje", href: "/#funkcje" },
      { label: "Bezpieczeństwo", href: "/#bezpieczenstwo" },
      { label: "Jak to działa", href: "/#jak-to-dziala" },
    ],
  },
  {
    title: "Konto",
    items: [
      { label: "Zaloguj się", href: "/login" },
      { label: "Załóż konto", href: "/register" },
      { label: "Sejf", href: "/vault" },
    ],
  },
];
