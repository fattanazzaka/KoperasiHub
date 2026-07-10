/**
 * scripts/05-apply-sql.ts — Track B (helper penerapan SQL ke Supabase)
 * ---------------------------------------------------------------------------
 * TUJUAN: menerapkan schema + seed ke database Supabase tim, berurutan:
 *   1) supabase/schema.sql        (milik Track A — hanya DIJALANKAN, tidak diedit)
 *   2) supabase/seed-snapshot.sql (koperasi Banten — dari 01-snapshot.ts)
 *   3) supabase/seed-demo.sql     (koreografi demo)
 *
 * PRASYARAT: .env berisi SUPABASE_DB_URL = connection string Postgres Supabase.
 *   Ambil di Supabase Dashboard > Project Settings > Database > Connection string
 *   ("URI"). Bentuknya:
 *     postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres
 *   (isi <PASSWORD> dengan Database Password; bila lupa, Reset di halaman sama.)
 *   Bisa juga pakai "Session pooler" (port 6543) bila koneksi 5432 gagal.
 *
 * JALANKAN:  npx tsx scripts/05-apply-sql.ts
 * Aman diulang: schema pakai IF NOT EXISTS; seed-demo idempoten.
 * ---------------------------------------------------------------------------
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

function loadEnv(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  loadEnv();
  const conn = process.env.SUPABASE_DB_URL;
  if (!conn) {
    console.error(
      "\n❌ Belum ada SUPABASE_DB_URL di .env.\n" +
        "   Ambil di Supabase > Project Settings > Database > Connection string (URI),\n" +
        "   isi passwordnya, lalu tambahkan baris:\n" +
        "     SUPABASE_DB_URL=postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres\n",
    );
    process.exit(1);
  }

  const dir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "supabase");
  const files = ["schema.sql", "seed-snapshot.sql", "seed-demo.sql"];

  const client = new Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 120000,
    connectionTimeoutMillis: 20000,
  });

  console.log("\n🔌 Menyambung ke Postgres Supabase ...");
  await client.connect();
  console.log("✅ Tersambung.\n");

  for (const f of files) {
    const path = resolve(dir, f);
    if (!existsSync(path)) {
      console.log(`⚠️  Lewati ${f} (belum ada). `);
      continue;
    }
    const sql = readFileSync(path, "utf8");
    process.stdout.write(`▶️  Menjalankan ${f} ... `);
    try {
      await client.query(sql);
      console.log("✅ sukses");
    } catch (e) {
      console.log("❌ GAGAL");
      console.error("   " + (e as Error).message);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(
    "\n✅ Semua SQL diterapkan. Lanjut:\n" +
      "   npx tsx scripts/03-seed-auth.ts     (buat akun juri & admin)\n" +
      "   npx tsx scripts/04-bekukan-angka.ts (verifikasi angka)\n",
  );
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).message);
  process.exit(1);
});
