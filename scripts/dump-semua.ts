/**
 * scripts/dump-semua.ts — Track B (ETL, read-only)
 * ---------------------------------------------------------------------------
 * TUJUAN: menyalin SELURUH isi 27 tabel shared DB panitia ke SATU file Excel
 * (.xlsx) yang bisa dibuka & ditelusuri seperti spreadsheet biasa:
 *   - 1 sheet "RINGKASAN" (daftar tabel + jumlah baris)
 *   - 1 sheet per tabel (semua kolom, semua baris)
 *
 * Semua HANYA SELECT (read-only). File output ditaruh DI LUAR repo supaya tidak
 * ikut ter-commit (repo publik + data mentah panitia).
 *
 * PASANG paket sekali (tanpa mengubah package.json Track A):
 *   npm install --no-save exceljs
 * JALANKAN:
 *   npx tsx scripts/dump-semua.ts
 *
 * Hasil: ../snapshot-shared-db.xlsx  (folder "hackathon kopdes", di samping KoperasiHub)
 * ---------------------------------------------------------------------------
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { makeOfficialClient, angka } from "./_db.ts";

// Ubah nilai apa pun menjadi sesuatu yang layak ditulis ke sel Excel.
function keSel(v: unknown): string | number | boolean | Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "bigint") return v.toString();
  return v as string | number | boolean;
}

async function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const outPath = resolve(repoRoot, "..", "snapshot-shared-db.xlsx");

  const client = makeOfficialClient();
  await client.connect();
  console.log("✅ Tersambung ke shared DB (read-only).\n");

  // Daftar semua tabel + jumlah baris.
  const daftar = await client.query<{ table_name: string }>(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`,
  );
  const tabel = daftar.rows.map((r) => r.table_name);

  console.log("Menghitung baris tiap tabel ...");
  const jumlah: Record<string, number> = {};
  for (const t of tabel) {
    const r = await client.query(`select count(*)::bigint c from public."${t}"`);
    jumlah[t] = Number(r.rows[0].c);
    console.log(`  ${t.padEnd(38)} ${angka(jumlah[t]).padStart(10)} baris`);
  }

  // Penulis streaming supaya file besar tidak menahan seluruh memori.
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: outPath });

  // Sheet ringkasan lebih dulu.
  const ring = wb.addWorksheet("RINGKASAN");
  ring.addRow(["Tabel", "Jumlah baris"]).commit();
  let totalBaris = 0;
  for (const t of tabel) {
    totalBaris += jumlah[t];
    ring.addRow([t, jumlah[t]]).commit();
  }
  ring.addRow(["TOTAL", totalBaris]).commit();
  ring.commit();

  // Satu sheet per tabel — nama sheet dibatasi 31 char (aturan Excel).
  for (const t of tabel) {
    const namaSheet = t.length > 31 ? t.slice(0, 31) : t;
    const ws = wb.addWorksheet(namaSheet);
    console.log(`\n📄 Menulis sheet "${namaSheet}" (${angka(jumlah[t])} baris) ...`);

    const res = await client.query(`select * from public."${t}"`);
    const kolom = res.fields.map((f) => f.name);
    ws.addRow(kolom).commit(); // header

    let n = 0;
    for (const row of res.rows) {
      ws.addRow(kolom.map((k) => keSel((row as Record<string, unknown>)[k]))).commit();
      if (++n % 50000 === 0) console.log(`   ... ${angka(n)} baris`);
    }
    ws.commit();
  }

  await wb.commit();
  await client.end();
  console.log(`\n✅ Selesai. File tersimpan di:\n   ${outPath}`);
  console.log(`   Total ${angka(totalBaris)} baris di ${tabel.length} tabel.\n`);
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).stack);
  process.exit(1);
});
