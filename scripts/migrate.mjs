/**
 * Tworzy tabele passHunt w bazie Neon.
 * Uruchom: npm run db:migrate   (bezpieczne do wielokrotnego uruchomienia)
 */
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("Brak DATABASE_URL w .env");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
     id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email              text NOT NULL UNIQUE,
     kdf_salt           text NOT NULL,
     kdf_iterations     integer NOT NULL,
     kdf_memory_kib     integer NOT NULL,
     kdf_parallelism    integer NOT NULL,
     auth_hash          text NOT NULL,
     encrypted_user_key text NOT NULL,
     password_hint      text,
     created_at         timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash text PRIMARY KEY,
     user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at timestamptz NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS vaults (
     id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     encrypted_key         text NOT NULL,
     encrypted_name        text NOT NULL,
     encrypted_description text,
     created_at            timestamptz NOT NULL DEFAULT now(),
     updated_at            timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS vaults_user_id_idx ON vaults(user_id)`,
  `CREATE TABLE IF NOT EXISTS entries (
     id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     vault_id       uuid NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
     encrypted_data text NOT NULL,
     created_at     timestamptz NOT NULL DEFAULT now(),
     updated_at     timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS entries_vault_id_idx ON entries(vault_id)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
     id         bigserial PRIMARY KEY,
     email      text NOT NULL,
     ip         text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS login_attempts_email_idx ON login_attempts(email, created_at)`,
  `CREATE INDEX IF NOT EXISTS login_attempts_ip_idx ON login_attempts(ip, created_at)`,
];

for (const statement of statements) {
  await sql.query(statement);
}

console.log("Migracja zakończona: users, sessions, vaults, entries, login_attempts.");
