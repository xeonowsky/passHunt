export type Strength = {
  /** 0 = bardzo słabe … 4 = bardzo silne */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  bits: number;
  hints: string[];
};

const LABELS = ["Bardzo słabe", "Słabe", "Średnie", "Silne", "Bardzo silne"] as const;

const COMMON = [
  "password", "haslo", "hasło", "qwerty", "123456", "admin", "zaq1", "passhunt", "abc123", "iloveyou",
];

/**
 * Prosta ocena siły hasła (entropia ~ długość × log2(pula znaków)
 * z karami za powtórzenia, sekwencje i popularne słowa).
 * Ocena orientacyjna – nie zastępuje sprawdzenia w HIBP.
 */
export function checkStrength(pw: string): Strength {
  const hints: string[] = [];
  if (!pw) return { score: 0, label: LABELS[0], bits: 0, hints };

  let pool = 0;
  const lower = /[a-ząćęłńóśźż]/.test(pw);
  const upper = /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(pw);
  if (lower) pool += 26;
  if (upper) pool += 26;
  if (digit) pool += 10;
  if (symbol) pool += 33;

  let bits = pw.length * Math.log2(Math.max(pool, 1));

  // Kary
  if (/(.)\1{2,}/.test(pw)) {
    bits *= 0.75;
    hints.push("Unikaj powtórzeń tego samego znaku.");
  }
  if (/(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|wert|asdf)/i.test(pw)) {
    bits *= 0.75;
    hints.push("Unikaj sekwencji typu 1234 lub qwer.");
  }
  if (COMMON.some((w) => pw.toLowerCase().includes(w))) {
    bits *= 0.5;
    hints.push("Hasło zawiera popularne słowo.");
  }

  if (pw.length < 12) hints.push("Użyj co najmniej 12 znaków.");
  if ([lower, upper, digit, symbol].filter(Boolean).length < 3)
    hints.push("Połącz małe i wielkie litery, cyfry i symbole.");

  const score: Strength["score"] =
    bits < 36 ? 0 : bits < 50 ? 1 : bits < 65 ? 2 : bits < 85 ? 3 : 4;

  return { score, label: LABELS[score], bits: Math.round(bits), hints };
}

/** Minimalne wymagania dla hasła głównego. */
export function isMasterPasswordAcceptable(pw: string) {
  return pw.length >= 12 && checkStrength(pw).score >= 2;
}
