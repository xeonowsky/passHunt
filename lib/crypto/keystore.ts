/**
 * Klucz użytkownika trzymany wyłącznie w pamięci karty.
 * Odświeżenie strony lub wylogowanie = sejf zablokowany (trzeba podać hasło główne).
 */
let userKey: CryptoKey | null = null;
const listeners = new Set<() => void>();

export function getUserKey() {
  return userKey;
}

export function setUserKey(key: CryptoKey | null) {
  userKey = key;
  listeners.forEach((fn) => fn());
}

export function subscribeUserKey(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
