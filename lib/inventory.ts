// Lapisan inventaris & konsumsi untuk US-09 (ADDENDUM-01 §2, §4.4).
//
// Sumber resmi (inventaris_produk, barang_keluar, barang_masuk_produk) hanya tersedia
// sebagai snapshot 1 hari (8 Jul 2026) dan TIDAK boleh di-query saat runtime (CLAUDE.md).
// Maka deret konsumsi 90 hari DISINTESIS deterministik di sini, konsisten dengan bauran
// produk & distribusi harga asli data panitia (mis. MinyaKita p90 Rp17.060 — di atas HET).
// Disclaimer sintesis ini juga dicantumkan di dokumentasi (jujur = kredibel).
//
// Modul murni (tanpa import server/DB) agar bisa diuji dan dipakai dua jalur
// (fixture demo maupun Supabase — id koperasi apa pun mendapat profil default).

export type InventoryRecord = {
  commodityId: string;
  // Stok fisik saat ini di gudang koperasi (satuan pool: kg/liter).
  stokSaatIni: number;
  // Barang keluar harian 90 hari terakhir; indeks terakhir = hari terbaru.
  dailyOutflows: number[];
  // Pembelian terakhir (jangkar baseline hemat, konsisten dengan success fee).
  hargaBeliTerakhir: number;
  qtyBeliTerakhir: number;
};

const SERIES_DAYS = 90;

/**
 * Deret barang-keluar deterministik: basis + gelombang mingguan ringan.
 * Tanpa PRNG agar angka demo stabil di UI, deck, dan video (docs/07).
 */
function makeSeries(base: number, amp: number): number[] {
  const series: number[] = [];
  for (let i = 0; i < SERIES_DAYS; i += 1) {
    const wave = amp * Math.sin((2 * Math.PI * i) / 7);
    series.push(Math.max(0, Math.round(base + wave)));
  }
  return series;
}

// Profil default — fallback untuk koperasi mana pun (fixture ATAU Supabase) yang tidak
// punya entri khusus di INVENTORY_BY_COOPERATIVE. Bauran umum; koreografi demo utama ada
// pada profil koperasi juri di bawah.
const DEFAULT_PROFILE: InventoryRecord[] = [
  {
    commodityId: "beras",
    stokSaatIni: 600,
    dailyOutflows: makeSeries(40, 4),
    hargaBeliTerakhir: 15_200,
    qtyBeliTerakhir: 1_000,
  },
  {
    commodityId: "minyak_kita",
    stokSaatIni: 90,
    dailyOutflows: makeSeries(15, 2),
    hargaBeliTerakhir: 17_060,
    qtyBeliTerakhir: 200,
  },
  {
    commodityId: "telur",
    stokSaatIni: 300,
    dailyOutflows: makeSeries(5, 1),
    hargaBeliTerakhir: 28_000,
    qtyBeliTerakhir: 150,
  },
  {
    commodityId: "gula",
    stokSaatIni: 50,
    dailyOutflows: makeSeries(0, 0),
    hargaBeliTerakhir: 17_500,
    qtyBeliTerakhir: 100,
  },
];

// GOLDEN PATH — koperasi demo (akun juri, KDMP Talun / Blitar / Jawa Timur).
// DISCLAIMER (ADDENDUM §4.4): snapshot barang_keluar panitia HANYA 1 hari (8 Jul 2026).
// Deret 90 hari di bawah DISINTESIS deterministik (makeSeries), konsisten dengan bauran
// produk & harga beli asli koperasi ini. Hanya deret waktu yang sintetis; harga di-anchor
// ke distribusi asli (MinyaKita p90 Rp17.060 > HET; SPHP/beras median).
const JURY_COOPERATIVE_ID = "10000000-0000-4000-8000-000000000001";

const INVENTORY_BY_COOPERATIVE: Record<string, InventoryRecord[]> = {
  [JURY_COOPERATIVE_ID]: [
    {
      // MinyaKita: stok menipis ~5-6 hari + harga beli terakhir Rp17.060 (p90 asli, DI ATAS
      // HET Rp15.700) → kartu rekomendasi HERO + guardrail HET menyala + pool Blitar aktif.
      commodityId: "minyak_kita",
      stokSaatIni: 100,
      dailyOutflows: makeSeries(18, 2),
      hargaBeliTerakhir: 17_060,
      qtyBeliTerakhir: 200,
    },
    {
      // Beras: stok menipis, belum ada pool di Blitar → kartu CTA "Buka Permintaan Pool Baru".
      commodityId: "beras",
      stokSaatIni: 200,
      dailyOutflows: makeSeries(40, 4),
      hargaBeliTerakhir: 15_200,
      qtyBeliTerakhir: 1_000,
    },
  ],
};

/** Snapshot inventaris koperasi. Selalu mengembalikan data (fallback profil default). */
export function getInventorySnapshot(cooperativeId: string): InventoryRecord[] {
  return INVENTORY_BY_COOPERATIVE[cooperativeId] ?? DEFAULT_PROFILE;
}
