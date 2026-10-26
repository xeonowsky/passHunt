/** Bezpieczny link do strony z wpisu – tylko http(s), żeby "javascript:" nie dało się kliknąć. */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function hostname(raw: string): string {
  const href = safeHref(raw);
  return href ? new URL(href).hostname.replace(/^www\./, "") : raw.trim();
}
