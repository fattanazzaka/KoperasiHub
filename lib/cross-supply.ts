// Aturan eligibilitas cross-supply (ADDENDUM-01 §3).
//
// Prinsip: komoditas primer REGIONAL mengalir lewat cross-supply antar koperasi, dan
// koperasi hanya boleh memasok komoditas yang terbukti diproduksi wilayahnya menurut
// data SIMKOPDES. Barang program/HET & bermerek WAJIB lewat kanal pooling, bukan
// cross-supply. Framing Tema 1: "aturan kualifikasi pemasok" — BUKAN "potensi desa".
//
// Modul ini sengaja MURNI (tanpa import app/DB) agar mudah diuji & dipakai ulang.
// Whitelist di-hardcode sebagai kurasi kecil untuk demo (CLAUDE.md melarang query
// referensi_komoditas_desa saat runtime); nilainya diturunkan dari data panitia.

export type SupplierRegion = {
  // Kode wilayah SIMKOPDES (format "XX.YY.ZZ.WWWW"). Kabupaten = 5 karakter pertama.
  kodeWilayah?: string | null;
};

export type EligibilityReason =
  | "eligible_direct" // komoditas persis ada di whitelist wilayah
  | "eligible_derived" // turunan dari komoditas induk yang diproduksi wilayah
  | "blocked_channel" // barang program/HET/bermerek → wajib pooling
  | "not_produced_in_region" // wilayah tidak terkualifikasi memproduksi komoditas ini
  | "unknown_region"; // kode wilayah kosong/invalid

export type EligibilityResult = {
  eligible: boolean;
  reason: EligibilityReason;
  // Komoditas induk yang membuat penawaran ini lolos (hanya untuk eligible_derived).
  viaBase?: string;
};

// Barang program/HET & bermerek pabrikan → selalu lewat pooling, tidak pernah cross-supply.
// Gerbang ini diperiksa PERTAMA (menang atas whitelist wilayah).
export const CROSS_SUPPLY_BLOCKLIST: ReadonlySet<string> = new Set([
  "minyak_kita", // MinyaKita — HET Rp15.700, kanal distributor resmi
  "lpg_3kg", // LPG 3kg subsidi
  "beras_sphp", // Beras SPHP (program Bulog)
  "pupuk_subsidi", // pupuk subsidi generik
  "npk_subsidi",
  "urea_subsidi",
]);

// Pemetaan turunan (kurasi kecil, hardcode untuk demo). Turunan mewarisi eligibilitas
// komoditas induknya: bila wilayah memproduksi induk, ia boleh memasok turunannya.
export const DERIVED_COMMODITIES: Readonly<Record<string, readonly string[]>> = {
  padi: ["beras", "beras_lokal"], // Beras non-SPHP
  ayam: ["telur", "daging_ayam"],
  kelapa: ["minyak_kelapa", "gula_kelapa"],
  tebu: ["gula_merah"],
};

// Whitelist wilayah → komoditas yang terbukti diproduksi (induk ATAU SKU langsung).
// Kunci = kode kabupaten (5 karakter pertama kode_wilayah). Kurasi demo dari data panitia.
export const REGIONAL_WHITELIST: Readonly<Record<string, ReadonlySet<string>>> = {
  "33.14": new Set(["padi"]), // Sragen, Jateng — produsen padi → beras
  "33.22": new Set(["padi"]), // Kab. Semarang, Jateng
  "35.05": new Set(["ayam", "telur"]), // Blitar, Jatim — sentra telur (direct + daging_ayam)
  "35.09": new Set(["kelapa", "tebu"]), // Banyuwangi, Jatim — kelapa & tebu
  // Wilayah pembeli (mis. Kaltim 64.xx) sengaja TIDAK ada → penawaran suplai ditolak.
};

/** Ambil kode kabupaten (5 karakter pertama, format "XX.YY") dari kode_wilayah SIMKOPDES. */
export function kabupatenCode(
  kodeWilayah: string | null | undefined,
): string | null {
  if (!kodeWilayah) return null;
  const trimmed = kodeWilayah.trim();
  return trimmed.length >= 5 ? trimmed.slice(0, 5) : null;
}

/** True bila komoditas wajib lewat pooling (barang program/HET/bermerek). */
export function isBlockedFromCrossSupply(commodityId: string): boolean {
  return CROSS_SUPPLY_BLOCKLIST.has(commodityId);
}

/**
 * Evaluasi apakah sebuah koperasi boleh MEMASOK komoditas lewat kanal cross-supply.
 * Urutan: (1) daftar blokir kanal, (2) validitas wilayah, (3) whitelist langsung,
 * (4) whitelist via komoditas induk (turunan).
 */
export function evaluateSupplierEligibility(
  koperasi: SupplierRegion,
  commodityId: string,
): EligibilityResult {
  if (isBlockedFromCrossSupply(commodityId)) {
    return { eligible: false, reason: "blocked_channel" };
  }

  const kabupaten = kabupatenCode(koperasi.kodeWilayah);
  if (!kabupaten) {
    return { eligible: false, reason: "unknown_region" };
  }

  const produced = REGIONAL_WHITELIST[kabupaten];
  if (!produced || produced.size === 0) {
    return { eligible: false, reason: "not_produced_in_region" };
  }

  if (produced.has(commodityId)) {
    return { eligible: true, reason: "eligible_direct" };
  }

  for (const base of produced) {
    if (DERIVED_COMMODITIES[base]?.includes(commodityId)) {
      return { eligible: true, reason: "eligible_derived", viaBase: base };
    }
  }

  return { eligible: false, reason: "not_produced_in_region" };
}

/** Versi boolean ringkas untuk pemakaian di server action / UI hint. */
export function isEligibleSupplier(
  koperasi: SupplierRegion,
  commodityId: string,
): boolean {
  return evaluateSupplierEligibility(koperasi, commodityId).eligible;
}

/** Pesan bahasa awam untuk feedback UI (framing Tema 1: kualifikasi pemasok). */
export function describeEligibility(result: EligibilityResult): string {
  switch (result.reason) {
    case "eligible_direct":
    case "eligible_derived":
      return "Wilayah Anda terkualifikasi memasok komoditas ini.";
    case "blocked_channel":
      return "Komoditas program/HET ini wajib lewat kanal pooling, bukan cross-supply.";
    case "not_produced_in_region":
      return "Wilayah Anda belum terkualifikasi sebagai pemasok komoditas ini menurut data SIMKOPDES.";
    case "unknown_region":
      return "Kode wilayah koperasi belum tersedia — tidak dapat memverifikasi kualifikasi pemasok.";
  }
}
