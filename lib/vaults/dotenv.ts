/** Parser i eksport plików .env (zgodny z typowym formatem dotenv / Vercel). */

export type DotenvVar = { key: string; value: string };

export const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

/** Czy wklejony tekst wygląda na fragment .env (a nie zwykły klucz)? */
export function looksLikeDotenv(text: string) {
  return /^\s*(export\s+)?[A-Za-z_][A-Za-z0-9_.-]*\s*=/m.test(text) && (text.includes("\n") || text.includes("="));
}

export function parseDotenv(text: string): DotenvVar[] {
  const out: DotenvVar[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue; // komentarze, puste linie, śmieci
    const key = match[1];
    let rest = match[2];
    let value: string;

    const quote = rest[0];
    if (quote === '"' || quote === "'" || quote === "`") {
      // Wartość w cudzysłowie – może ciągnąć się przez kilka linii.
      let body = rest.slice(1);
      let end = findClosing(body, quote);
      while (end === -1 && i + 1 < lines.length) {
        body += "\n" + lines[++i];
        end = findClosing(body, quote);
      }
      value = end === -1 ? body : body.slice(0, end);
      if (quote === '"') {
        value = value.replace(/\\(.)/g, (_, c: string) => (c === "n" ? "\n" : c === "r" ? "\r" : c === "t" ? "\t" : c));
      }
    } else {
      // Bez cudzysłowu: komentarz od " #" do końca linii.
      const hash = rest.search(/\s#/);
      if (hash !== -1) rest = rest.slice(0, hash);
      value = rest.trim();
    }

    out.push({ key, value });
  }

  // Ostatnie wystąpienie klucza wygrywa (jak w dotenv).
  const map = new Map<string, string>();
  for (const v of out) map.set(v.key, v.value);
  return [...map].map(([key, value]) => ({ key, value }));
}

function findClosing(body: string, quote: string) {
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && quote === '"') {
      i++;
      continue;
    }
    if (body[i] === quote) return i;
  }
  return -1;
}

/** KLUCZ="wartość" – cudzysłów tylko gdy potrzebny. */
export function toDotenv(vars: DotenvVar[]): string {
  return (
    vars
      .map(({ key, value }) => {
        const plain = /^[A-Za-z0-9_./:@%+,-]*$/.test(value);
        const quoted = `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`;
        return `${key}=${plain ? value : quoted}`;
      })
      .join("\n") + "\n"
  );
}
