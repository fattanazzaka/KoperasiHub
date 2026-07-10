// Mesin sinyal "Rekomendasi Pengadaan Cerdas" — US-09 (ADDENDUM-01 §2).
//
// SELURUHNYA deterministik & explainable (wajib bisa dijelaskan di Q&A juri):
//   days_of_stock = stok / velocity_harian     (velocity = WMA rolling 30 hari)
//   urgensi       = clamp(1 - days_of_stock/30, 0, 1)
//   hemat         = max(0, harga_beli_terakhir - harga_tier_pool) * qty_saran
//   hemat_norm    = clamp(hemat / nilai_pembelian_terakhir, 0, 1)
//   skor          = 0.45*urgensi + 0.35*hemat_norm + 0.20*pool_aktif + musiman
// Kartu tampil bila skor >= 0.35 DAN (urgensi > 0 ATAU hemat > 0); maksimal 3, urut skor.
// LLM (bila dipakai) hanya MENARASIKAN hasil modul ini — tidak pernah memutuskan angka.
//
// Modul murni: satu-satunya dependensi adalah tipe PoolDetail + data inventaris sintesis.

import { getInventorySnapshot, type InventoryRecord } from "@/lib/inventory";
import type { PoolDetail } from "@/lib/pool-types";

export const SKOR_BOBOT = {
  urgensi: 0.45,
  hematNorm: 0.35,
  poolAktif: 0.2,
} as const;
export const MUSIMAN_BONUS = 0.15;
export const SKOR_AMBANG = 0.35;
// Horizon coverage rekomendasi (hari) — juga penyebut normalisasi urgensi.
export const COVERAGE_DAYS = 30;
// qty_saran dibulatkan KE ATAS ke kelipatan ini (kelipatan satuan pool).
export const QTY_KELIPATAN = 10;
// HET komoditas program (guardrail ADDENDUM §5.2). SPHP/LPG per zona — tambah bila perlu.
export const HET: Readonly<Record<string, number>> = {
  minyak_kita: 15_700,
};

// Kalender musiman (ADDENDUM §2): sembako aktif H-30 HBKN; pupuk saat musim tanam.
const HBKN_2026 = ["2026-03-20", "2026-05-27", "2026-12-25"] as const; // Idul Fitri, Idul Adha, Natal
const SEMBAKO_IDS = new Set(["beras", "beras_lokal", "minyak_kita", "gula", "telur"]);
const PUPUK_IDS = new Set(["pupuk_npk", "pupuk_urea"]);
const MUSIM_TANAM_BULAN = new Set([10, 11, 3]); // Okt, Nov (rendeng) & Mar (gadu)

export type CandidateInput = {
  commodityId: string;
  stokSaatIni: number;
  dailyOutflows: number[];
  hargaBeliTerakhir: number;
  qtyBeliTerakhir: number;
  poolAktif: boolean;
  hargaTierPool: number | null;
  poolId: string | null;
  musiman: boolean;
};

export type CandidateSignal = {
  commodityId: string;
  stokSaatIni: number;
  velocityHarian: number;
  daysOfStock: number;
  // Prediksi tanggal stok habis (ISO date); null bila stok tidak menipis.
  habisPada: string | null;
  hargaBeliTerakhir: number;
  hargaTierPool: number | null;
  poolAktif: boolean;
  poolId: string | null;
  qtySaran: number;
  hematEstimasi: number;
  // Flag guardrail: pembelian terakhir di atas HET komoditas program.
  flagHet: boolean;
  skor: number;
  // Komponen skor untuk tautan "Kenapa rekomendasi ini?" (AC4 — explainability).
  skorRincian: {
    urgensi: number;
    hematNorm: number;
    poolAktif: 0 | 1;
    musiman: number;
  };
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Velocity harian dari barang keluar: weighted moving average rolling 30 hari,
 * bobot linear lebih berat ke hari terbaru. Data tipis (<7 titik) → rata-rata sederhana.
 */
export function computeVelocity(dailyOutflows: number[]): number {
  const window = dailyOutflows.slice(-COVERAGE_DAYS);

  if (window.length === 0) {
    return 0;
  }

  if (window.length < 7) {
    return window.reduce((total, value) => total + value, 0) / window.length;
  }

  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < window.length; i += 1) {
    const weight = i + 1; // indeks terakhir = hari terbaru = bobot terbesar
    weightedSum += window[i] * weight;
    weightTotal += weight;
  }

  return weightedSum / weightTotal;
}

/** Evaluasi satu komoditas → sinyal lengkap, atau null bila tersaring. */
export function evaluateCandidate(
  input: CandidateInput,
  now: Date = new Date(),
): CandidateSignal | null {
  const velocityHarian = computeVelocity(input.dailyOutflows);

  // AC6: velocity 0 = tidak ada sinyal konsumsi → jangan hasilkan noise.
  // (Termasuk stok 0: tanpa velocity, qty_saran pun 0 — tidak ada yang direkomendasikan.)
  if (velocityHarian <= 0) {
    return null;
  }

  const daysOfStock = input.stokSaatIni / velocityHarian;
  const urgensi = clamp01(1 - daysOfStock / COVERAGE_DAYS);
  const qtyMentah = velocityHarian * COVERAGE_DAYS;
  const qtySaran = Math.ceil(qtyMentah / QTY_KELIPATAN) * QTY_KELIPATAN;

  const hematEstimasi =
    input.poolAktif && input.hargaTierPool !== null
      ? Math.max(0, input.hargaBeliTerakhir - input.hargaTierPool) * qtySaran
      : 0;
  const nilaiPembelianTerakhir =
    input.hargaBeliTerakhir * (input.qtyBeliTerakhir || qtySaran);
  const hematNorm =
    nilaiPembelianTerakhir > 0
      ? clamp01(hematEstimasi / nilaiPembelianTerakhir)
      : 0;

  const poolAktif: 0 | 1 = input.poolAktif ? 1 : 0;
  const musiman = input.musiman ? MUSIMAN_BONUS : 0;
  const skor =
    SKOR_BOBOT.urgensi * urgensi +
    SKOR_BOBOT.hematNorm * hematNorm +
    SKOR_BOBOT.poolAktif * poolAktif +
    musiman;

  // Ambang tampil: skor cukup DAN ada alasan nyata (stok menipis atau hemat riil).
  if (skor < SKOR_AMBANG || (urgensi <= 0 && hematEstimasi <= 0)) {
    return null;
  }

  const habisPada =
    urgensi > 0
      ? new Date(now.getTime() + daysOfStock * 86_400_000)
          .toISOString()
          .slice(0, 10)
      : null;

  return {
    commodityId: input.commodityId,
    stokSaatIni: input.stokSaatIni,
    velocityHarian,
    daysOfStock,
    habisPada,
    hargaBeliTerakhir: input.hargaBeliTerakhir,
    hargaTierPool: input.hargaTierPool,
    poolAktif: input.poolAktif,
    poolId: input.poolId,
    qtySaran,
    hematEstimasi,
    flagHet:
      input.commodityId in HET && input.hargaBeliTerakhir > HET[input.commodityId],
    skor,
    skorRincian: { urgensi, hematNorm, poolAktif, musiman },
  };
}

/** Saring & urutkan kandidat: skor tertinggi dulu, maksimal 3 kartu (AC1). */
export function rankCandidates(
  inputs: CandidateInput[],
  now: Date = new Date(),
): CandidateSignal[] {
  return inputs
    .map((input) => evaluateCandidate(input, now))
    .filter((signal): signal is CandidateSignal => signal !== null)
    .sort((a, b) => b.skor - a.skor)
    .slice(0, 3);
}

/** Rule musiman: sembako H-30 sebelum HBKN; pupuk saat bulan musim tanam. */
export function isMusiman(commodityId: string, now: Date): boolean {
  if (PUPUK_IDS.has(commodityId)) {
    return MUSIM_TANAM_BULAN.has(now.getUTCMonth() + 1);
  }

  if (!SEMBAKO_IDS.has(commodityId)) {
    return false;
  }

  return HBKN_2026.some((dateString) => {
    const hbkn = new Date(`${dateString}T00:00:00+07:00`).getTime();
    const delta = hbkn - now.getTime();
    return delta >= 0 && delta <= 30 * 86_400_000;
  });
}

// ---------------------------------------------------------------------------
// Kartu rekomendasi (skema wire /api/recommendation) + narasi fallback.
// LLM hanya MENARASIKAN; angka selalu dari sinyal deterministik di atas.
// ---------------------------------------------------------------------------

export type RecommendationCard = {
  komoditas: string;
  komoditas_id: string;
  satuan: string;
  alasan: string;
  narasi: string;
  qty_saran: number;
  hemat_estimasi: number;
  // Baseline pre-fill deep-link form demand (harga beli terakhir koperasi sendiri).
  harga_baseline: number;
  habis_pada: string | null;
  days_of_stock: number;
  pool_ref: string | null;
  deadline_pool: string | null;
  // Status Tangga Tier pool aktif (null bila tidak ada pool).
  pool_progress: {
    percent: number;
    tier_nama: string;
    tier_harga: number;
    total_volume: number;
    min_volume: number;
  } | null;
  flag_het: boolean;
  // Explainability "Kenapa rekomendasi ini?" (AC4) — komponen skor mentah.
  skor: number;
  skor_rincian: CandidateSignal["skorRincian"];
};

export type NarrativeContext = {
  namaKomoditas: string;
  satuan: string;
  wilayah: string;
  deadlinePool: string | null; // ISO date bila ada pool aktif
  poolProgress: RecommendationCard["pool_progress"];
};

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatTanggal(isoDate: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

/**
 * Narasi template deterministik — jaring pengaman bila LLM gagal/offline.
 * Copy mengikuti contoh ADDENDUM §2 agar demo tidak pernah kosong.
 */
export function formatNarrative(
  signal: CandidateSignal,
  ctx: NarrativeContext,
): { alasan: string; narasi: string } {
  const stokParts: string[] = [];
  if (signal.habisPada) {
    stokParts.push(
      `Stok ${ctx.namaKomoditas} diprediksi habis ${formatTanggal(signal.habisPada)} ` +
        `(${Math.max(1, Math.round(signal.daysOfStock))} hari lagi).`,
    );
  }

  let narasi: string;
  if (signal.poolAktif) {
    const deadline = ctx.deadlinePool
      ? ` ditutup ${formatTanggal(ctx.deadlinePool)}`
      : "";
    const hemat =
      signal.hematEstimasi > 0
        ? ` Estimasi hemat ${formatRupiah(signal.hematEstimasi)} vs pembelian terakhirmu.`
        : "";
    narasi =
      `${stokParts.join(" ")} Pool ${ctx.wilayah}${deadline} sedang berjalan —` +
      ` gabung dengan ${signal.qtySaran.toLocaleString("id-ID")} ${ctx.satuan}.${hemat}`;
  } else {
    narasi =
      `${stokParts.join(" ")} Belum ada pool aktif di klaster ${ctx.wilayah} —` +
      ` buka permintaan pool baru sebesar ${signal.qtySaran.toLocaleString("id-ID")} ${ctx.satuan}` +
      ` agar koperasi lain bisa bergabung.`;
  }

  const alasanParts: string[] = [];
  if (signal.skorRincian.urgensi > 0) {
    alasanParts.push(
      `stok tersisa ±${Math.max(1, Math.round(signal.daysOfStock))} hari` +
        ` (pemakaian ±${Math.round(signal.velocityHarian)} ${ctx.satuan}/hari)`,
    );
  }
  if (signal.hematEstimasi > 0) {
    alasanParts.push(
      `harga tier pool lebih murah dari pembelian terakhirmu (hemat ${formatRupiah(signal.hematEstimasi)})`,
    );
  }
  if (signal.poolAktif) {
    alasanParts.push("ada pool aktif di wilayahmu");
  }
  if (signal.flagHet) {
    alasanParts.push("pembelian terakhirmu tercatat di atas HET");
  }

  return {
    alasan: `Rekomendasi ini muncul karena ${alasanParts.join(", ")}.`,
    narasi: narasi.trim(),
  };
}

/** Susun kartu wire lengkap dari sinyal + konteks (jalur template/fallback). */
export function buildFallbackCard(
  signal: CandidateSignal,
  ctx: NarrativeContext,
): RecommendationCard {
  const { alasan, narasi } = formatNarrative(signal, ctx);
  return {
    komoditas: ctx.namaKomoditas,
    komoditas_id: signal.commodityId,
    satuan: ctx.satuan,
    alasan,
    narasi,
    qty_saran: signal.qtySaran,
    hemat_estimasi: signal.hematEstimasi,
    harga_baseline: signal.hargaBeliTerakhir,
    habis_pada: signal.habisPada,
    days_of_stock: Math.round(signal.daysOfStock * 10) / 10,
    pool_ref: signal.poolId,
    deadline_pool: ctx.deadlinePool,
    pool_progress: ctx.poolProgress,
    flag_het: signal.flagHet,
    skor: Math.round(signal.skor * 1000) / 1000,
    skor_rincian: signal.skorRincian,
  };
}

/**
 * Titik masuk utama: hitung sinyal rekomendasi sebuah koperasi.
 * Pool aktif = pool OPEN untuk komoditas tsb di klaster wilayah koperasi & belum deadline;
 * harga tier memakai tier TARGET pool (konsisten dengan Tangga Tier di UI).
 * `pools` disuplai pemanggil dari pooling engine (getPoolDetails) — modul ini tetap murni.
 */
export function computeSignals(
  cooperativeId: string,
  context: { wilayah: string; pools: PoolDetail[]; now?: Date },
): CandidateSignal[] {
  const now = context.now ?? new Date();
  const inventory = getInventorySnapshot(cooperativeId);

  const inputs = inventory.map((record: InventoryRecord): CandidateInput => {
    const pool = context.pools.find(
      (candidate) =>
        candidate.commodityId === record.commodityId &&
        candidate.wilayah === context.wilayah &&
        candidate.status === "open" &&
        candidate.daysRemaining > 0,
    );
    const targetTier = pool?.progress.targetTier ?? null;

    return {
      commodityId: record.commodityId,
      stokSaatIni: record.stokSaatIni,
      dailyOutflows: record.dailyOutflows,
      hargaBeliTerakhir: record.hargaBeliTerakhir,
      qtyBeliTerakhir: record.qtyBeliTerakhir,
      poolAktif: Boolean(pool && targetTier),
      hargaTierPool: targetTier?.pricePerUnit ?? null,
      poolId: pool?.id ?? null,
      musiman: isMusiman(record.commodityId, now),
    };
  });

  return rankCandidates(inputs, now);
}
