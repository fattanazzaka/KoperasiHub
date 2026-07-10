/**
 * scripts/00b-eksplorasi.ts — Track B (ETL, read-only)
 * ---------------------------------------------------------------------------
 * TUJUAN: sebelum memutuskan KLASTER DEMO, kita profil dulu data asli panitia.
 * Skrip ini menjawab 3 pertanyaan penting:
 *   (1) Struktur tabel referensi/pendukung (wilayah, anggota, modal, inventaris)
 *       — supaya tahu kolom mana untuk join lokasi & jumlah anggota.
 *   (2) Komoditas apa saja yang ada di barang_masuk_produk & berapa harga_beli-nya
 *       — untuk memilih komoditas demo (beras? minyak? telur?).
 *   (3) Detail semua baris BERAS (komoditas hero rencana docs/06) — apakah cukup?
 *
 * Semua HANYA SELECT (read-only). Tidak menulis apa pun.
 *
 * JALANKAN:  npx tsx scripts/00b-eksplorasi.ts
 * ---------------------------------------------------------------------------
 */
import { makeOfficialClient, ringkas, angka } from "./_db.ts";

const GARIS = "=".repeat(70);

// Tabel pendukung yang perlu kita pahami strukturnya untuk join nanti.
const TABEL_PENDUKUNG = [
  "referensi_koperasi_wilayah",
  "referensi_wilayah",
  "referensi_profil_desa",
  "anggota_koperasi",
  "modal_koperasi",
  "simpanan_anggota",
  "inventaris_produk",
  "transaksi_penjualan",
  "rat_koperasi",
];

// Komoditas yang relevan untuk pooling sembako.
const KOMODITAS = [
  { label: "BERAS", pola: "%beras%" },
  { label: "MINYAK/MINYAKITA", pola: "%minyak%" },
  { label: "TELUR", pola: "%telur%" },
  { label: "GULA", pola: "%gula%" },
  { label: "LPG/GAS", pola: "%lpg%" },
  { label: "TERIGU/TEPUNG", pola: "%tepung%" },
  { label: "PUPUK", pola: "%pupuk%" },
];

async function main() {
  const client = makeOfficialClient();
  await client.connect();
  console.log("✅ Tersambung ke shared DB (read-only).\n");

  // ---- BAGIAN 1: struktur + 3 sampel tabel pendukung ----
  for (const tabel of TABEL_PENDUKUNG) {
    console.log(GARIS);
    console.log(`📐 STRUKTUR + SAMPEL — ${tabel}`);
    console.log(GARIS);
    try {
      const r = await client.query(`select * from public."${tabel}" limit 3`);
      const kolom = r.fields.map((f) => f.name);
      console.log(`Kolom (${kolom.length}): ${kolom.join(", ")}\n`);
      r.rows.forEach((row, i) => {
        console.log(`  --- baris ${i + 1} ---`);
        for (const k of kolom) {
          console.log(`     ${k}: ${ringkas((row as Record<string, unknown>)[k])}`);
        }
      });
    } catch (e) {
      console.log("  Gagal: " + (e as Error).message);
    }
    console.log("");
  }

  // ---- BAGIAN 2: rekap komoditas di barang_masuk_produk ----
  console.log(GARIS);
  console.log("🛒 REKAP KOMODITAS di barang_masuk_produk (via kata kunci nama_produk)");
  console.log(GARIS);
  console.log(
    "  komoditas".padEnd(24) +
      "baris".padStart(7) +
      "koperasi".padStart(10) +
      "min".padStart(9) +
      "rata2".padStart(9) +
      "max".padStart(9),
  );
  for (const { label, pola } of KOMODITAS) {
    try {
      const r = await client.query(
        `select count(*)::int n,
                count(distinct koperasi_ref)::int nk,
                min(harga_beli::numeric)::bigint mn,
                round(avg(harga_beli::numeric))::bigint av,
                max(harga_beli::numeric)::bigint mx
         from public.barang_masuk_produk
         where nama_produk ilike $1 and harga_beli is not null`,
        [pola],
      );
      const x = r.rows[0];
      console.log(
        `  ${label.padEnd(22)}` +
          `${angka(x.n).padStart(7)}` +
          `${angka(x.nk).padStart(10)}` +
          `${angka(x.mn).padStart(9)}` +
          `${angka(x.av).padStart(9)}` +
          `${angka(x.mx).padStart(9)}`,
      );
    } catch (e) {
      console.log(`  ${label.padEnd(22)} gagal: ${(e as Error).message}`);
    }
  }

  // ---- BAGIAN 2b: 30 nama produk terbanyak (apa yang sebenarnya ada) ----
  console.log("\n" + GARIS);
  console.log("🏷️  30 nama_produk TERBANYAK di barang_masuk_produk");
  console.log(GARIS);
  try {
    const r = await client.query(
      `select upper(nama_produk) produk, count(*)::int n, count(distinct koperasi_ref)::int nk
       from public.barang_masuk_produk
       group by upper(nama_produk)
       order by n desc
       limit 30`,
    );
    r.rows.forEach((row) =>
      console.log(
        `  ${angka(row.n).padStart(4)}x  (${angka(row.nk)} kop)  ${ringkas(row.produk, 50)}`,
      ),
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  // ---- BAGIAN 3: detail semua baris BERAS ----
  console.log("\n" + GARIS);
  console.log("🌾 DETAIL SEMUA BARIS BERAS (harga_beli sbg calon baseline)");
  console.log(GARIS);
  try {
    const r = await client.query(
      `select koperasi_ref, nama_produk, harga_beli, jumlah_masuk, tanggal_masuk
       from public.barang_masuk_produk
       where nama_produk ilike '%beras%'
       order by harga_beli::numeric
       limit 60`,
    );
    console.log(`  Ditemukan ${r.rows.length} baris beras (maks 60 ditampilkan):\n`);
    r.rows.forEach((row) =>
      console.log(
        `  ${ringkas(row.koperasi_ref, 18).padEnd(20)} ` +
          `Rp${angka(row.harga_beli).padStart(8)} ` +
          `x${angka(row.jumlah_masuk).padStart(6)}  ` +
          `${ringkas(row.nama_produk, 34)}`,
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
