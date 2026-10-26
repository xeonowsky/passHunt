/** Limity wspólne dla klienta i serwera. */
export const VAULT_NAME_MAX = 50;
export const VAULT_DESCRIPTION_MAX = 200;
export const VAULTS_PER_USER_MAX = 100;
export const HINT_MAX = 100;

export const ENTRIES_PER_VAULT_MAX = 1000;
export const ENTRY_LIMITS = {
  title: 100,
  field: 500,
  notes: 2000,
  customLabel: 50,
  customValue: 500,
  customMax: 10,
} as const;

/** Typ „Zmienne środowiskowe” – dłuższe wartości (klucze prywatne, certyfikaty). */
export const ENV_LIMITS = {
  vars: 100,
  key: 128,
  value: 4000,
} as const;

/** Maks. długość zaszyfrowanego wpisu (base64) przyjmowana przez API – 1 MiB. */
export const ENTRY_ENCRYPTED_MAX = 1024 * 1024;

export const KDF_BOUNDS = {
  iterations: { min: 2, max: 10 },
  memoryKiB: { min: 19 * 1024, max: 1024 * 1024 },
  parallelism: { min: 1, max: 4 },
} as const;

/** Domyślne parametry Argon2id dla nowych kont (64 MiB, 3 iteracje). */
export const DEFAULT_KDF = {
  iterations: 3,
  memoryKiB: 64 * 1024,
  parallelism: 1,
};
