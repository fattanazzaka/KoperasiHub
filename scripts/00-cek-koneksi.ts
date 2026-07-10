/**
 * scripts/00-cek-koneksi.ts — Track B (ETL)
 * ---------------------------------------------------------------------------
 * TUJUAN (bahasa sederhana):
 *   Skrip ini "mengetuk pintu" database resmi panitia (shared DB) untuk memastikan
 *   kredensial di .env benar, lalu MENGHITUNG jumlah baris tiap tabel supaya kita
 *   tahu tabel mana yang berisi data dan mana yang kosong. Terakhir ia mengintip
 *   5 baris contoh dari `profil_koperasi` dan `barang_masuk_produk` supaya kita bisa
 *   memverifikasi nama kolom asli cocok dengan kamus data (metadata) sebelum ETL.
 *
 *   Skrip ini HANYA MEMBACA (SELECT). Tidak menulis apa pun ke shared DB.
 *
 * CARA MENJALANKAN (dari folder KoperasiHub):
 *   1. Pastikan sudah ada file .env berisi kredensial OFFICIAL_DB_* (lihat bawah).
 *   2. Sekali saja, pasang paket pendukung tanpa mengubah package.json milik Track A:
 *        npm install
 *        npm install --no-save pg tsx
 *   3. Jalankan:
 *        npx tsx scripts/00-cek-koneksi.ts
 *
 * ENV YANG DIBUTUHKAN (isi di file .env — JANGAN commit, repo ini publik):
 *   OFFICIAL_DB_HOST=...
 *   OFFICIAL_DB_PORT=5432
 *   OFFICIAL_DB_DATABASE=...
 *   OFFICIAL_DB_USERNAME=...
 *   OFFICIAL_DB_PASSWORD=...
 *   OFFICIAL_DB_SSL=true            # opsional: 'true' paksa SSL, 'false' matikan SSL
 * ---------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

// --- Loader .env manual (tanpa dependensi dotenv, supaya paket yang dipasang minimal) ---
function loadEnv(): string {
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

// Tabel sumber yang kita andalkan untuk ETL (nama disimpulkan dari komentar schema.sql).
const TABEL_KUNCI_ETL = [
  "profil_koperasi",
  "referensi_koperasi_wilayah",
  "rat_koperasi",
  "barang_masuk_produk",
  "inventaris_produk",
  "referensi_komoditas_desa",
];

const fmt = (n: number | null) =>
  n === null ? "?" : n.toLocaleString("id-ID");

async function hitungBaris(
  client: Client,
  tabel: string,
): Promise<{ jumlah: number | null; estimasi: boolean }> {
  // Coba hitung persis; bila lambat/timeout (shared DB dipakai 100 tim), pakai estimasi.
  try {
    const r = await client.query(
      `select count(*)::bigint as c from public."${tabel}"`,
    );
    return { jumlah: Number(r.rows[0].c), estimasi: false };
  } catch {
    try {
      const r = await client.query(
        `select reltuples::bigint as c from pg_class where oid = to_regclass($1)`,
        [`public."${tabel}"`],
      );
      const c = r.rows[0]?.c;
      return { jumlah: c == null ? null : Number(c), estimasi: true };
    } catch {
      return { jumlah: null, estimasi: true };
    }
  }
}

async function ambilSampel(client: Client, tabel: string, n = 5) {
  const r = await client.query(`select * from public."${tabel}" limit ${n}`);
  return { kolom: r.fields.map((f) => f.name), baris: r.rows };
}

async function main() {
  const envPath = loadEnv();

  const host = process.env.OFFICIAL_DB_HOST;
  const port = process.env.OFFICIAL_DB_PORT ?? "5432";
  const database = process.env.OFFICIAL_DB_DATABASE;
  const user = process.env.OFFICIAL_DB_USERNAME;
  const password = process.env.OFFICIAL_DB_PASSWORD;

  const kurang: string[] = [];
  if (!host) kurang.push("OFFICIAL_DB_HOST");
  if (!database) kurang.push("OFFICIAL_DB_DATABASE");
  if (!user) kurang.push("OFFICIAL_DB_USERNAME");
  if (!password) kurang.push("OFFICIAL_DB_PASSWORD");
  if (kurang.length) {
    console.error("\n❌ Kredensial shared DB belum lengkap di .env.");
    console.error("   Variabel yang belum terisi: " + kurang.join(", "));
    console.error("   File .env yang dicek: " + envPath);
    console.error(
      "\n   Tambahkan baris berikut ke .env (isi nilainya dari panitia):\n" +
        "     OFFICIAL_DB_HOST=\n" +
        "     OFFICIAL_DB_PORT=5432\n" +
        "     OFFICIAL_DB_DATABASE=\n" +
        "     OFFICIAL_DB_USERNAME=\n" +
        "     OFFICIAL_DB_PASSWORD=\n",
    );
    process.exit(1);
  }

  // SSL: default aktif untuk host remote; matikan untuk localhost, kecuali dipaksa via env.
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

  const client = new Client({
    host,
    port: Number(port),
    database,
    user,
    password,
    ssl,
    statement_timeout: 20000, // ms — jaga agar tidak menggantung di DB yang tidak stabil
    connectionTimeoutMillis: 15000,
  });

  console.log("\n🔌 Menyambung ke shared DB ...");
  console.log(`   host=${host} port=${port} db=${database} ssl=${ssl ? "on" : "off"}`);

  try {
    await client.connect();
  } catch (e) {
    console.error("\n❌ GAGAL menyambung. Pesan: " + (e as Error).message);
    console.error(
      "   Cek: nilai kredensial, apakah IP kamu diizinkan, atau coba OFFICIAL_DB_SSL=true / =false.",
    );
    process.exit(1);
  }
  console.log("✅ Tersambung.\n");

  // 1) Daftar semua tabel di schema public + hitung barisnya.
  const daftar = await client.query<{ table_name: string }>(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`,
  );

  console.log("=".repeat(64));
  console.log(`📋 TABEL DI SCHEMA public — total ${daftar.rows.length} tabel`);
  console.log("=".repeat(64));

  const kosong: string[] = [];
  const berisi: string[] = [];
  for (const { table_name } of daftar.rows) {
    const { jumlah, estimasi } = await hitungBaris(client, table_name);
    const label = jumlah === 0 ? "KOSONG" : "berisi";
    if (jumlah === 0) kosong.push(table_name);
    else if (jumlah && jumlah > 0) berisi.push(table_name);
    console.log(
      `  ${table_name.padEnd(38)} ${fmt(jumlah).padStart(12)} baris` +
        (estimasi ? "  (estimasi)" : "") +
        `  [${label}]`,
    );
  }

  console.log("\n" + "-".repeat(64));
  console.log(`Ringkasan: ${berisi.length} tabel berisi, ${kosong.length} tabel kosong.`);
  if (kosong.length)
    console.log("Tabel KOSONG: " + kosong.join(", "));

  // 2) Cek keberadaan tabel kunci untuk ETL.
  console.log("\n" + "=".repeat(64));
  console.log("🔑 CEK TABEL KUNCI UNTUK ETL");
  console.log("=".repeat(64));
  const adaSet = new Set(daftar.rows.map((r) => r.table_name));
  for (const t of TABEL_KUNCI_ETL) {
    console.log(`  ${adaSet.has(t) ? "✅ ADA   " : "⚠️  HILANG"}  ${t}`);
  }

  // 3) Sampel 5 baris untuk verifikasi nama kolom vs kamus data.
  for (const t of ["profil_koperasi", "barang_masuk_produk"]) {
    console.log("\n" + "=".repeat(64));
    console.log(`🔎 SAMPEL 5 BARIS — ${t}`);
    console.log("=".repeat(64));
    if (!adaSet.has(t)) {
      console.log(`  (tabel ${t} tidak ditemukan — lewati)`);
      continue;
    }
    try {
      const { kolom, baris } = await ambilSampel(client, t, 5);
      console.log("  Kolom (" + kolom.length + "): " + kolom.join(", "));
      console.log("");
      baris.forEach((row, i) => {
        console.log(`  --- baris ${i + 1} ---`);
        for (const k of kolom) {
          let v = (row as Record<string, unknown>)[k];
          let s = v === null ? "NULL" : String(v);
          if (s.length > 80) s = s.slice(0, 77) + "...";
          console.log(`     ${k}: ${s}`);
        }
      });
    } catch (e) {
      console.log("  Gagal mengambil sampel: " + (e as Error).message);
    }
  }

  await client.end();
  console.log("\n✅ Selesai. Koneksi ditutup.\n");
}

main().catch((e) => {
  console.error("\n❌ Error tak terduga: " + (e as Error).stack);
  process.exit(1);
});
