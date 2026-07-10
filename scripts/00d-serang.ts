/**
 * scripts/00d-serang.ts — Track B (ETL, read-only)
 * ---------------------------------------------------------------------------
 * Ambil detail NYATA klaster demo terpilih (Kota Serang, Banten) untuk menyusun
 * angka demo yang defensible di docs/07:
 *   (A) daftar koperasi di Kota Serang + kecamatan/desa asli + jumlah anggota
 *   (B) pembelian MINYAK riil di Kota Serang (harga_beli = calon baseline)
 *   (C) daftar kecamatan Kota Serang (untuk penamaan "KDMP <kecamatan>")
 *   (D) kandidat koperasi PRODUSEN TELUR (untuk pool cross-supply)
 *
 * Semua HANYA SELECT (read-only).
 * JALANKAN:  npx tsx scripts/00d-serang.ts
 * ---------------------------------------------------------------------------
 */
import { makeOfficialClient, angka, ringkas } from "./_db.ts";

const GARIS = "=".repeat(70);
const KAB = "KOTA SERANG";

async function main() {
  const client = makeOfficialClient();
  await client.connect();
  console.log(`✅ Tersambung. Klaster: ${KAB}\n`);

  // (A) Koperasi di Kota Serang + wilayah + jumlah anggota.
  console.log(GARIS);
  console.log(`👥 (A) KOPERASI di ${KAB} (ref, kecamatan, desa, jumlah anggota)`);
  console.log(GARIS);
  try {
    const r = await client.query(
      `select rkw.koperasi_ref, w.kecamatan, w.desa_kelurahan,
              (select count(*) from public.anggota_koperasi a
                 where a.koperasi_ref = rkw.koperasi_ref)::int n_anggota
       from public.referensi_koperasi_wilayah rkw
       join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
       where w.kab_kota = $1
       order by w.kecamatan, rkw.koperasi_ref`,
      [KAB],
    );
    console.log(`  Total ${r.rows.length} koperasi:\n`);
    r.rows.forEach((x) =>
      console.log(
        `  ${ringkas(x.koperasi_ref, 18).padEnd(20)} ` +
          `${ringkas(x.kecamatan, 16).padEnd(18)} ` +
          `${ringkas(x.desa_kelurahan, 20).padEnd(22)} ` +
          `${angka(x.n_anggota).padStart(5)} anggota`,
      ),
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  // (B) Pembelian minyak riil di Kota Serang.
  console.log("\n" + GARIS);
  console.log(`🛢️  (B) Pembelian MINYAK riil di ${KAB} (harga_beli = calon baseline)`);
  console.log(GARIS);
  try {
    const r = await client.query(
      `select b.koperasi_ref, b.nama_produk, b.harga_beli, b.jumlah_masuk, b.tanggal_masuk
       from public.barang_masuk_produk b
       join public.referensi_koperasi_wilayah rkw on rkw.koperasi_ref = b.koperasi_ref
       join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
       where w.kab_kota = $1 and b.nama_produk ilike '%minyak%'
       order by b.harga_beli::numeric`,
      [KAB],
    );
    if (!r.rows.length) console.log("  (tidak ada)");
    r.rows.forEach((x) =>
      console.log(
        `  ${ringkas(x.koperasi_ref, 18).padEnd(20)} ` +
          `Rp${angka(x.harga_beli).padStart(8)} ` +
          `x${angka(x.jumlah_masuk).padStart(6)}  ${ringkas(x.nama_produk, 30)}`,
      ),
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  // (C) Kecamatan di Kota Serang untuk penamaan.
  console.log("\n" + GARIS);
  console.log(`🗺️  (C) KECAMATAN di ${KAB} (untuk nama "KDMP <kecamatan>")`);
  console.log(GARIS);
  try {
    const r = await client.query(
      `select w.kecamatan, count(distinct rkw.koperasi_ref)::int n
       from public.referensi_koperasi_wilayah rkw
       join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
       where w.kab_kota = $1
       group by w.kecamatan order by n desc, w.kecamatan`,
      [KAB],
    );
    r.rows.forEach((x) =>
      console.log(`  ${ringkas(x.kecamatan, 24).padEnd(26)} ${angka(x.n)} koperasi`),
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  // (D) Kandidat koperasi produsen telur (cross-supply pool C).
  console.log("\n" + GARIS);
  console.log("🥚 (D) KANDIDAT PRODUSEN TELUR (untuk pool cross-supply)");
  console.log(GARIS);
  try {
    const r = await client.query(
      `select b.koperasi_ref, w.provinsi, w.kab_kota,
              b.nama_produk, b.harga_beli, b.jumlah_masuk
       from public.barang_masuk_produk b
       join public.referensi_koperasi_wilayah rkw on rkw.koperasi_ref = b.koperasi_ref
       join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
       where b.nama_produk ilike '%telur%'
       order by w.provinsi, b.harga_beli::numeric
       limit 20`,
    );
    r.rows.forEach((x) =>
      console.log(
        `  ${ringkas(x.koperasi_ref, 16).padEnd(18)} ` +
          `${ringkas(x.provinsi, 14).padEnd(16)} ${ringkas(x.kab_kota, 18).padEnd(20)} ` +
          `Rp${angka(x.harga_beli).padStart(7)} x${angka(x.jumlah_masuk).padStart(5)}  ${ringkas(x.nama_produk, 20)}`,
      ),
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  await client.end();
  console.log("\n✅ Selesai. Koneksi ditutup.\n");
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).stack);
  process.exit(1);
});
