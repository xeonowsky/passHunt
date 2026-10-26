/**
 * Czy użytkownik jest zalogowany – tylko na potrzeby UI (np. paska nawigacji).
 * Źródłem jest jawne ciasteczko ph_auth ustawiane przez serwer razem z sesją.
 * Prawdziwa autoryzacja odbywa się wyłącznie przez httpOnly ph_session.
 */
const HINT = "ph_auth";
const listeners = new Set<() => void>();

export function isLoggedInHint(): boolean {
  return document.cookie.split("; ").some((c) => c === `${HINT}=1`);
}

export function subscribeSessionHint(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("focus", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("focus", fn);
  };
}

export function notifySessionChange() {
  listeners.forEach((fn) => fn());
}

export function clearSessionHint() {
  document.cookie = `${HINT}=; Max-Age=0; path=/`;
  notifySessionChange();
}
