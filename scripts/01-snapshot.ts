/**
 * scripts/01-snapshot.ts — Track B (ETL)
 * ---------------------------------------------------------------------------
 * TUJUAN: menyalin koperasi ASLI Provinsi Banten dari shared DB menjadi file
 * SQL (`supabase/seed-snapshot.sql`) untuk mengisi tabel `cooperatives` — supaya
 * dashboard admin punya banyak koperasi nyata (nama wilayah asli, jumlah anggota
 * asli, status RAT asli). 6 koperasi demo-inti TIDAK di sini (ada di seed-demo.sql).
 *
 * Baca shared DB = READ-ONLY. Output = file SQL lokal (dijalankan di Supabase nanti).
 *
 * JALANKAN:  npx tsx scripts/01-snapshot.ts
 * HASIL:     supabase/seed-snapshot.sql
 * ---------------------------------------------------------------------------
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeOfficialClient } from "./_db.ts";

// Ref koperasi demo-inti (dikelola di seed-demo.sql) — dikecualikan dari snapshot.
const REF_DEMO = [
  "KOP-315C5EFCC96D", // Kaligandu
  "KOP-63AEF19F6654", // Unyur
  "KOP-F8A0C206EB72", // Terondol
  "KOP-CA604BC75944", // Pancalaksana
  "KOP-0008016CB39E", // Cilegon (produsen telur)
];
const MAKS = 24; // jumlah koperasi Banten tambahan untuk dashboard

// SQL string literal aman.
const q = (v: unknown) =>
  v === null || v === undefined
    ? "NULL"
    : "'" + String(v).replace(/'/g, "''") + "'";
const num = (v: number | null) => (v === null ? "NULL" : String(Math.round(v)));

// Petakan status_rat sumber -> enum aplikasi (lih. komentar schema.sql).
function mapStatusRat(raw: string | null): string {
  switch ((raw ?? "").toLowerCase()) {
    case "verified":
      return "diverifikasi";
    case "reported":
      return "dilaporkan";
    case "drafted":
      return "melaksanakan";
    default:
      return "belum"; // termasuk Rejected / tanpa RAT
  }
}

// Hash deterministik kecil dari ref (untuk garnish P2 yang stabil).
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function titel(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

async function main() {
  const client = makeOfficialClient();
  await client.connect();
  console.log("✅ Tersambung ke shared DB (read-only).");

  const res = await client.query(
    `select rkw.koperasi_ref,
            p.nik_koperasi,
            rkw.kode_wilayah,
            w.provinsi, w.kab_kota, w.kecamatan, w.desa_kelurahan,
            (select count(*) from public.anggota_koperasi a
               where a.koperasi_ref = rkw.koperasi_ref)::int n_anggota,
            (select r.status_rat from public.rat_koperasi r
               where r.koperasi_ref = rkw.koperasi_ref
               order by r.tahun_buku desc nulls last limit 1) status_rat_raw
     from public.referensi_koperasi_wilayah rkw
     join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
     join public.profil_koperasi p on p.koperasi_ref = rkw.koperasi_ref
     where w.provinsi = 'BANTEN'
       and rkw.koperasi_ref <> all($1::text[])
     order by (w.kab_kota = 'KOTA SERANG') desc, w.kab_kota, rkw.koperasi_ref
     limit $2`,
    [REF_DEMO, MAKS],
  );

  console.log(`Mengambil ${res.rows.length} koperasi Banten (di luar 6 demo-inti).`);

  const baris = res.rows.map((r) => {
    const h = hash(r.koperasi_ref);
    const desa = r.desa_kelurahan ? titel(r.desa_kelurahan) : "Banten";
    const nama = "KDMP " + desa;
    const anggota: number = r.n_anggota ?? 0;
    // Garnish P2 (estimasi dari jumlah anggota — bukan angka resmi granular).
    const simpananPokok = anggota * 100_000;
    const simpananWajib = anggota * 150_000;
    const nilaiTransaksi = anggota * 500_000;
    const volumeTransaksi = anggota * 40;
    const gerai = 80 + (h % 21); // 80..100
    const reputasi = 75 + (h % 18); // 75..92
    const nib = "52" + String(h).padStart(11, "0").slice(0, 11); // 13 digit dummy
    const npwp = "0" + String(h * 7).padStart(14, "0").slice(0, 14); // 15 digit dummy
    const statusRat = mapStatusRat(r.status_rat_raw);

    return (
      "  (" +
      [
        q(r.koperasi_ref),
        q(nama),
        q(r.nik_koperasi),
        q(r.kode_wilayah),
        q(r.desa_kelurahan ? titel(r.desa_kelurahan) : null),
        q(r.kecamatan ? titel(r.kecamatan) : null),
        q(r.kab_kota),
        q(titel(r.provinsi)),
        num(anggota),
        q(nib),
        q(npwp),
        "true", // berbadan_hukum
        "true", // punya_akun
        q(statusRat),
        num(simpananPokok),
        num(simpananWajib),
        num(volumeTransaksi),
        num(nilaiTransaksi),
        num(gerai),
        "true", // simkopdes_verified
        num(reputasi),
        "false", // is_producer
      ].join(", ") +
      ")"
    );
  });

  const sql = `-- supabase/seed-snapshot.sql — DIHASILKAN OTOMATIS oleh scripts/01-snapshot.ts
-- JANGAN diedit tangan. Koperasi Banten asli (snapshot SIMKOPDES) untuk dashboard admin.
-- 6 koperasi demo-inti ada di seed-demo.sql. Jalankan: schema.sql -> seed-snapshot.sql -> seed-demo.sql
-- Dihasilkan: ${new Date().toISOString()} · ${baris.length} koperasi.

begin;

insert into public.cooperatives
  (koperasi_ref, nama, nik_koperasi, kode_wilayah, desa, kecamatan, kabupaten,
   provinsi, jumlah_anggota, nib, npwp, berbadan_hukum, punya_akun, status_rat,
   simpanan_pokok, simpanan_wajib, volume_transaksi, nilai_transaksi,
   pembangunan_gerai_pct, simkopdes_verified, reputation_score, is_producer)
values
${baris.join(",\n")}
on conflict (koperasi_ref) do nothing;

commit;
`;

  const outPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "supabase",
    "seed-snapshot.sql",
  );
  writeFileSync(outPath, sql, "utf8");
  await client.end();
  console.log(`\n✅ Ditulis: ${outPath}`);
  console.log(`   ${baris.length} koperasi Banten siap di-seed.\n`);
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).stack);
  process.exit(1);
});
