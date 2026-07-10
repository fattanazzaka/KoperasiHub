/**
 * scripts/_db.ts — Track B
 * Modul bersama untuk semua skrip ETL: loader .env manual + pembuat koneksi.
 * Dipakai oleh 00b-eksplorasi, 01-snapshot, dst. (Skrip 00-cek-koneksi berdiri
 * sendiri karena ditulis lebih dulu dan sudah terbukti jalan.)
 *
 * Shared DB panitia diperlakukan READ-ONLY.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

/** Muat file .env dari root repo ke process.env (tanpa dependensi dotenv). */
export function loadEnv(): string {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return envPath;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
  return envPath;
}

/** Buat koneksi ke shared DB panitia (read-only). Validasi env & SSL otomatis. */
export function makeOfficialClient(): Client {
  loadEnv();
  const host = process.env.OFFICIAL_DB_HOST;
  const database = process.env.OFFICIAL_DB_DATABASE;
  const user = process.env.OFFICIAL_DB_USERNAME;
  const password = process.env.OFFICIAL_DB_PASSWORD;
  const port = Number(process.env.OFFICIAL_DB_PORT ?? "5432");

  const kurang = [
    ["OFFICIAL_DB_HOST", host],
    ["OFFICIAL_DB_DATABASE", database],
    ["OFFICIAL_DB_USERNAME", user],
    ["OFFICIAL_DB_PASSWORD", password],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (kurang.length) {
    throw new Error(
      "Kredensial shared DB belum lengkap di .env: " + kurang.join(", "),
    );
  }

  const sslEnv = (process.env.OFFICIAL_DB_SSL ?? "").toLowerCase();
  const isLocal = /^(localhost|127\.0\.0\.1|::1)$/.test(host!);
  const ssl =
    sslEnv === "false"
      ? false
      : sslEnv === "true"
        ? { rejectUnauthorized: false }
        : isLocal
          ? false
          : { rejectUnauthorized: false };

  return new Client({
    host,
    port,
    database,
    user,
    password,
    ssl,
    statement_timeout: 30000,
    connectionTimeoutMillis: 15000,
  });
}

/** Potong string panjang agar output rapi. */
export function ringkas(v: unknown, maks = 60): string {
  if (v === null || v === undefined) return "NULL";
  let s = String(v);
  if (s.length > maks) s = s.slice(0, maks - 3) + "...";
  return s;
}

/** Format angka gaya Indonesia. */
export function angka(n: number | string | null): string {
  if (n === null) return "?";
  return Number(n).toLocaleString("id-ID");
}
