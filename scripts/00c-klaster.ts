/**
 * scripts/00c-klaster.ts — Track B (ETL, read-only)
 * ---------------------------------------------------------------------------
 * TUJUAN: cari KABUPATEN kandidat klaster demo — yaitu wilayah dengan cukup
 * banyak koperasi yang benar-benar membeli komoditas target (minyak/beras),
 * supaya pool demo terasa nyata di satu wilayah + memakai baseline harga asli.
 *
 * Menjawab:
 *   (1) Sebaran koperasi per kabupaten (semua koperasi) — di mana KDMP terpadat?
 *   (2) Sebaran koperasi PEMBELI beras per kabupaten.
 *   (3) Sebaran koperasi PEMBELI MinyaKita per kabupaten.
 *   (4) Baseline BERSIH per komoditas (harga_beli difilter per satuan wajar).
 *   (5) Cakupan join wilayah (berapa dari 1.026 koperasi ketemu nama wilayahnya).
 *
 * Semua HANYA SELECT (read-only).
 * JALANKAN:  npx tsx scripts/00c-klaster.ts
 * ---------------------------------------------------------------------------
 */
import { makeOfficialClient, angka, ringkas } from "./_db.ts";

const GARIS = "=".repeat(70);

// Join koperasi -> kode_wilayah -> nama wilayah. Dipakai berulang.
const JOIN_WILAYAH = `
  from public.barang_masuk_produk b
  join public.referensi_koperasi_wilayah rkw on rkw.koperasi_ref = b.koperasi_ref
  join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
`;

async function tabelKabupaten(
  client: import("pg").Client,
  judul: string,
  sql: string,
  params: unknown[] = [],
) {
  console.log("\n" + GARIS);
  console.log(judul);
  console.log(GARIS);
  try {
    const r = await client.query(sql, params);
    if (!r.rows.length) {
      console.log("  (tidak ada baris)");
      return;
    }
    console.log(
      "  " +
        "provinsi".padEnd(22) +
        "kabupaten/kota".padEnd(28) +
        "koperasi".padStart(9) +
        "baris".padStart(7),
    );
    for (const row of r.rows) {
      console.log(
        "  " +
          ringkas(row.provinsi, 20).padEnd(22) +
          ringkas(row.kab_kota, 26).padEnd(28) +
          angka(row.n_kop).padStart(9) +
          angka(row.n_baris ?? "").padStart(7),
      );
    }
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }
}

async function main() {
  const client = makeOfficialClient();
  await client.connect();
  console.log("✅ Tersambung ke shared DB (read-only).");

  // (5) Cakupan join wilayah dulu (biar tahu keandalan data lokasi).
  console.log("\n" + GARIS);
  console.log("🧭 CAKUPAN JOIN WILAYAH");
  console.log(GARIS);
  try {
    const total = await client.query(
      `select count(*)::int n from public.referensi_koperasi_wilayah`,
    );
    const ketemu = await client.query(
      `select count(*)::int n
       from public.referensi_koperasi_wilayah rkw
       join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah`,
    );
    console.log(
      `  ${angka(ketemu.rows[0].n)} dari ${angka(total.rows[0].n)} koperasi ` +
        `berhasil dipetakan ke nama wilayah.`,
    );
  } catch (e) {
    console.log("  Gagal: " + (e as Error).message);
  }

  // (1) Sebaran semua koperasi per kabupaten.
  await tabelKabupaten(
    client,
    "🏙️  (1) 20 KABUPATEN dengan KOPERASI TERBANYAK (semua koperasi)",
    `select w.provinsi, w.kab_kota,
            count(distinct rkw.koperasi_ref)::int n_kop
     from public.referensi_koperasi_wilayah rkw
     join public.referensi_wilayah w on w.kode_wilayah = rkw.kode_wilayah
     group by w.provinsi, w.kab_kota
     order by n_kop desc
     limit 20`,
  );

  // (2) Kabupaten pembeli BERAS.
  await tabelKabupaten(
    client,
    "🌾 (2) 15 KABUPATEN dengan pembeli BERAS terbanyak",
    `select w.provinsi, w.kab_kota,
            count(distinct b.koperasi_ref)::int n_kop,
            count(*)::int n_baris
     ${JOIN_WILAYAH}
     where b.nama_produk ilike '%beras%'
     group by w.provinsi, w.kab_kota
     order by n_kop desc, n_baris desc
     limit 15`,
  );

  // (3) Kabupaten pembeli MINYAKITA.
  await tabelKabupaten(
    client,
    "🛢️  (3) 15 KABUPATEN dengan pembeli MINYAKITA terbanyak",
    `select w.provinsi, w.kab_kota,
            count(distinct b.koperasi_ref)::int n_kop,
            count(*)::int n_baris
     ${JOIN_WILAYAH}
     where (b.nama_produk ilike '%minyak kita%' or b.nama_produk ilike '%minyakita%')
     group by w.provinsi, w.kab_kota
     order by n_kop desc, n_baris desc
     limit 15`,
  );

  // (4) Baseline BERSIH per komoditas (filter satuan wajar).
  console.log("\n" + GARIS);
  console.log("💰 (4) BASELINE BERSIH per komoditas (harga_beli difilter satuan wajar)");
  console.log(GARIS);
  const baselineQueries: { label: string; sql: string }[] = [
    {
      label: "MinyaKita per liter (harga 12.000–18.000)",
      sql: `select count(*)::int n, min(harga_beli::numeric)::bigint mn,
                   round(avg(harga_beli::numeric))::bigint av, max(harga_beli::numeric)::bigint mx
            from public.barang_masuk_produk
            where (nama_produk ilike '%minyak kita%' or nama_produk ilike '%minyakita%')
              and harga_beli::numeric between 12000 and 18000`,
    },
    {
      label: "Beras per kg (harga 9.000–16.000)",
      sql: `select count(*)::int n, min(harga_beli::numeric)::bigint mn,
                   round(avg(harga_beli::numeric))::bigint av, max(harga_beli::numeric)::bigint mx
            from public.barang_masuk_produk
            where nama_produk ilike '%beras%'
              and harga_beli::numeric between 9000 and 16000`,
    },
    {
      label: "Beras SPHP karung 5kg (harga 50.000–65.000) -> /5 = per kg",
      sql: `select count(*)::int n, min(harga_beli::numeric/5)::bigint mn,
                   round(avg(harga_beli::numeric/5))::bigint av, max(harga_beli::numeric/5)::bigint mx
            from public.barang_masuk_produk
            where nama_produk ilike '%beras%'
              and harga_beli::numeric between 50000 and 65000`,
    },
  ];
  for (const q of baselineQueries) {
    try {
      const r = await client.query(q.sql);
      const x = r.rows[0];
      console.log(
        `  ${q.label}\n` +
          `     n=${angka(x.n)}  min=Rp${angka(x.mn)}  rata2=Rp${angka(x.av)}  max=Rp${angka(x.mx)}`,
      );
    } catch (e) {
      console.log(`  ${q.label} — gagal: ${(e as Error).message}`);
    }
  }

  await client.end();
  console.log("\n✅ Selesai. Koneksi ditutup.\n");
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).stack);
  process.exit(1);
});
