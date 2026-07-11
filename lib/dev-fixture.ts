export type DevCooperative = {
  id: string;
  nama: string;
  desa: string;
  kabupaten: string;
  provinsi: string;
  kodeWilayah: string; // Kode wilayah SIMKOPDES; kabupaten = 5 karakter pertama.
  nib: string;
  simkopdesVerified: boolean;
  isProducer: boolean;
};

export type DevCommodity = {
  id: "beras" | "minyak_kita" | "gula" | "telur" | "lpg_3kg" | "beras_lokal";
  nama: string;
  satuan: "kg" | "liter";
};

export type DevSupplierType = "distributor" | "bumn" | "koperasi";

export type DevMarketTier = {
  id: string;
  name: string;
  minVolume: number;
  pricePerUnit: number;
};

export type DevSupplySource = {
  id: string;
  name: string;
  type: DevSupplierType;
  location: string;
  pricePerUnit: number;
};

export type DevCommodityMarket = {
  baselinePrice: number;
  tiers: readonly DevMarketTier[];
  sources: readonly DevSupplySource[];
};

export type DevPoolFixture = {
  id: string;
  commodityId: DevCommodity["id"];
  wilayah: string;
  windowOption: "week" | "two-weeks" | "month";
  baseTotalVolume: number;
  baseParticipantCount: number;
  baseMembers: readonly DevPoolMember[];
};

export type DevPoolMember = {
  cooperativeId: string;
  name: string;
  nib: string;
  volume: number;
  baselinePrice: number;
};

export const devCommodities: readonly DevCommodity[] = [
  { id: "beras", nama: "Beras Medium", satuan: "kg" },
  { id: "beras_lokal", nama: "Beras Lokal Produsen", satuan: "kg" },
  { id: "minyak_kita", nama: "MinyaKita", satuan: "liter" },
  { id: "gula", nama: "Gula Pasir", satuan: "kg" },
  { id: "telur", nama: "Telur Ayam", satuan: "kg" },
  { id: "lpg_3kg", nama: "LPG 3kg", satuan: "kg" },
] as const;

export const devCommodityMarkets: Record<
  DevCommodity["id"],
  DevCommodityMarket
> = {
  beras: {
    baselinePrice: 15_358,
    tiers: [
      {
        id: "tier-beras-grosir",
        name: "Grosir",
        minVolume: 5_000,
        pricePerUnit: 14_574,
      },
      {
        id: "tier-beras-penggilingan",
        name: "Penggilingan",
        minVolume: 20_000,
        pricePerUnit: 13_765,
      },
    ],
    sources: [
      {
        id: "supplier-bulog-jateng",
        name: "Bulog Kanwil Jateng",
        type: "bumn",
        location: "Jawa Tengah",
        pricePerUnit: 14_574,
      },
      {
        id: "supplier-pangan-sejahtera",
        name: "PT Pangan Sejahtera",
        type: "distributor",
        location: "Solo Raya",
        pricePerUnit: 14_650,
      },
      {
        id: "supplier-kdmp-sumber-rejeki",
        name: "KDMP Sumber Rejeki",
        type: "koperasi",
        location: "Sragen",
        pricePerUnit: 14_700,
      },
    ],
  },
  minyak_kita: {
    baselinePrice: 15_700,
    tiers: [
      {
        id: "tier-minyak-d1",
        name: "D1",
        minVolume: 2_000,
        pricePerUnit: 14_000,
      },
      {
        id: "tier-minyak-produsen",
        name: "Produsen",
        minVolume: 10_000,
        pricePerUnit: 13_500,
      },
    ],
    sources: [
      {
        id: "supplier-distribusi-nusantara",
        name: "PT Distribusi Nusantara",
        type: "distributor",
        location: "Jawa Tengah",
        pricePerUnit: 14_000,
      },
    ],
  },
  gula: {
    baselinePrice: 17_500,
    tiers: [
      {
        id: "tier-gula-distributor",
        name: "Distributor",
        minVolume: 1_000,
        pricePerUnit: 16_800,
      },
      {
        id: "tier-gula-kontrak",
        name: "Kontrak Klaster",
        minVolume: 5_000,
        pricePerUnit: 16_200,
      },
    ],
    sources: [
      {
        id: "supplier-id-food-gula",
        name: "ID FOOD (Holding Pangan)",
        type: "bumn",
        location: "Jawa Timur",
        pricePerUnit: 16_200,
      },
      {
        id: "supplier-gula-nusantara",
        name: "PT Gula Nusantara",
        type: "distributor",
        location: "Jawa Timur",
        pricePerUnit: 16_800,
      },
    ],
  },
  // Beras produsen lokal (non-SPHP) — komoditas kanal CROSS-SUPPLY yang valid.
  // Turunan dari padi; koperasi di kabupaten produsen padi boleh memasoknya.
  beras_lokal: {
    baselinePrice: 13_800,
    tiers: [
      {
        id: "tier-beraslokal-antarkoperasi",
        name: "Antar Koperasi",
        minVolume: 1_000,
        pricePerUnit: 12_900,
      },
    ],
    sources: [
      {
        id: "supplier-kdmp-produsen-padi",
        name: "KDMP Produsen Padi Sragen",
        type: "koperasi",
        location: "Sragen",
        pricePerUnit: 12_900,
      },
    ],
  },
  // LPG 3kg tetap dapat dibeli melalui Pool Permintaan, sedangkan penawaran
  // cross-supply diblokir oleh aturan eligibilitas barang program/HET.
  lpg_3kg: {
    baselinePrice: 6_500,
    tiers: [
      {
        id: "tier-lpg-pangkalan",
        name: "Pangkalan",
        minVolume: 300,
        pricePerUnit: 6_000,
      },
      {
        id: "tier-lpg-klaster",
        name: "Distribusi Klaster",
        minVolume: 1_500,
        pricePerUnit: 5_500,
      },
    ],
    sources: [
      {
        id: "supplier-patra-niaga",
        name: "Pertamina Patra Niaga",
        type: "bumn",
        location: "Jawa Timur",
        pricePerUnit: 5_500,
      },
    ],
  },
  telur: {
    baselinePrice: 28_000,
    tiers: [
      {
        id: "tier-telur-grosir",
        name: "Grosir",
        minVolume: 500,
        pricePerUnit: 26_500,
      },
      {
        id: "tier-telur-ternak-anggota",
        name: "Ternak Anggota",
        minVolume: 1_000,
        pricePerUnit: 24_500,
      },
    ],
    sources: [
      {
        id: "supplier-kdmp-ringinrejo",
        name: "KDMP Ringinrejo",
        type: "koperasi",
        location: "Blitar",
        pricePerUnit: 24_500,
      },
      {
        id: "supplier-sumber-protein",
        name: "CV Sumber Protein",
        type: "distributor",
        location: "Semarang",
        pricePerUnit: 26_500,
      },
    ],
  },
};

export const devPools: readonly DevPoolFixture[] = [
  {
    id: "pool-beras-sragen",
    commodityId: "beras",
    wilayah: "Sragen",
    windowOption: "week",
    baseTotalVolume: 4_250,
    baseParticipantCount: 7,
    baseMembers: [
      {
        cooperativeId: "10000000-0000-4000-8000-000000000002",
        name: "KDMP Gemolong",
        nib: "0220110912345",
        volume: 700,
        baselinePrice: 15_200,
      },
      {
        cooperativeId: "10000000-0000-4000-8000-000000000003",
        name: "KDMP Masaran",
        nib: "0220110956789",
        volume: 650,
        baselinePrice: 15_300,
      },
      {
        cooperativeId: "20000000-0000-4000-8000-000000000001",
        name: "KDMP Plupuh",
        nib: "0220110934567",
        volume: 600,
        baselinePrice: 15_400,
      },
      {
        cooperativeId: "20000000-0000-4000-8000-000000000002",
        name: "KDMP Sidoharjo",
        nib: "0220110976543",
        volume: 600,
        baselinePrice: 15_250,
      },
      {
        cooperativeId: "20000000-0000-4000-8000-000000000003",
        name: "KDMP Gondang",
        nib: "0220110924680",
        volume: 550,
        baselinePrice: 15_500,
      },
      {
        cooperativeId: "20000000-0000-4000-8000-000000000004",
        name: "KDMP Sambungmacan",
        nib: "0220110913579",
        volume: 600,
        baselinePrice: 15_350,
      },
      {
        cooperativeId: "20000000-0000-4000-8000-000000000005",
        name: "KDMP Sumberlawang",
        nib: "0220110986420",
        volume: 550,
        baselinePrice: 15_450,
      },
    ],
  },
  {
    // HERO pool (ADDENDUM §4.5): klaster MinyaKita Jawa Timur, ~75% menuju Ambang Tier D1
    // (1.500 / 2.000 L). Window "week" = sama dengan default form → klik [Gabung Pool] dari
    // kartu rekomendasi langsung menambah volume & memicu animasi Tangga Tier (lintas ambang).
    id: "pool-minyak-jatim",
    commodityId: "minyak_kita",
    wilayah: "Blitar",
    windowOption: "week",
    baseTotalVolume: 1_500,
    baseParticipantCount: 12, // klaster asli 16 koperasi pembeli (§4.5); 12 ditampilkan sbg latar
    baseMembers: [
      {
        cooperativeId: "35000000-0000-4000-8000-000000000001",
        name: "KDMP Kanigoro",
        nib: "3505110912345",
        volume: 420,
        baselinePrice: 17_060, // p90 distribusi asli — di atas HET Rp15.700
      },
      {
        cooperativeId: "35000000-0000-4000-8000-000000000002",
        name: "KDMP Wlingi",
        nib: "3505110956789",
        volume: 400,
        baselinePrice: 16_400,
      },
      {
        cooperativeId: "35000000-0000-4000-8000-000000000003",
        name: "KDMP Sanankulon",
        nib: "3505110934567",
        volume: 360,
        baselinePrice: 15_200,
      },
      {
        cooperativeId: "35000000-0000-4000-8000-000000000004",
        name: "KDMP Garum",
        nib: "3505110976543",
        volume: 320,
        baselinePrice: 14_500, // median distribusi asli
      },
    ],
  },
  {
    // CROSS-SUPPLY telur (ADDENDUM §4.6): pool pembeli di Kaltim dengan baseline ±Rp55.000/kg
    // (arbitrase antar-wilayah asli). Sumber suplai [Koperasi Produsen] KDMP Ringinrejo (Blitar)
    // dari devCommodityMarkets.telur → memvisualkan komoditas primer regional lewat cross-supply.
    id: "pool-telur-kaltim",
    commodityId: "telur",
    wilayah: "Kutai Kartanegara",
    windowOption: "two-weeks",
    baseTotalVolume: 400,
    baseParticipantCount: 3,
    baseMembers: [
      {
        cooperativeId: "30000000-0000-4000-8000-000000000001",
        name: "KDMP Loa Janan",
        nib: "6402110912345",
        volume: 150,
        baselinePrice: 55_000, // baseline beli asli Kaltim (jauh di atas wilayah produsen)
      },
      {
        cooperativeId: "64000000-0000-4000-8000-000000000002",
        name: "KDMP Tenggarong",
        nib: "6402110956789",
        volume: 140,
        baselinePrice: 53_500,
      },
      {
        cooperativeId: "64000000-0000-4000-8000-000000000003",
        name: "KDMP Sebulu",
        nib: "6402110934567",
        volume: 110,
        baselinePrice: 54_200,
      },
    ],
  },
  {
    id: "pool-gula-blitar",
    commodityId: "gula",
    wilayah: "Blitar",
    windowOption: "week",
    baseTotalVolume: 800,
    baseParticipantCount: 4,
    baseMembers: [],
  },
  {
    id: "pool-beras-lokal-blitar",
    commodityId: "beras_lokal",
    wilayah: "Blitar",
    windowOption: "week",
    baseTotalVolume: 700,
    baseParticipantCount: 3,
    baseMembers: [],
  },
  {
    id: "pool-lpg-blitar",
    commodityId: "lpg_3kg",
    wilayah: "Blitar",
    windowOption: "week",
    baseTotalVolume: 210,
    baseParticipantCount: 4,
    baseMembers: [],
  },
] as const;

export const devCooperatives: readonly DevCooperative[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    // Koperasi demo (akun juri) — anggota klaster MinyaKita Jawa Timur (ADDENDUM §4.5),
    // sekaligus kabupaten produsen ayam (Blitar) → memenuhi syarat cross-supply telur (§4.6).
    nama: "KDMP Talun",
    desa: "Talun",
    kabupaten: "Blitar",
    provinsi: "Jawa Timur",
    kodeWilayah: "35.05.12.2001",
    nib: "0350110987654",
    simkopdesVerified: true,
    isProducer: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    nama: "KDMP Gemolong",
    desa: "Gemolong",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    kodeWilayah: "33.14.10.2002",
    nib: "0220110912345",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    nama: "KDMP Masaran",
    desa: "Masaran",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    kodeWilayah: "33.14.11.2003",
    nib: "0220110956789",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    nama: "KDMP Kaliwungu",
    desa: "Kaliwungu",
    kabupaten: "Kudus",
    provinsi: "Jawa Tengah",
    kodeWilayah: "33.19.01.2001",
    nib: "0310110912345",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    nama: "KDMP Ringinrejo",
    desa: "Ringinrejo",
    kabupaten: "Blitar",
    provinsi: "Jawa Timur",
    kodeWilayah: "35.05.20.2005",
    nib: "0350110912345",
    simkopdesVerified: true,
    isProducer: true,
  },
  {
    // Koperasi pembeli telur di Kaltim — baseline ±Rp55.000/kg (anchor asli, ADDENDUM §1/§4.6).
    // Wilayah 64.02 (Kutai Kartanegara) BUKAN produsen ayam → penawaran suplai telur DITOLAK,
    // sementara pemasok Blitar (35.05) memenuhi syarat: inti demo constraint cross-supply.
    id: "30000000-0000-4000-8000-000000000001",
    nama: "KDMP Loa Janan",
    desa: "Loa Janan",
    kabupaten: "Kutai Kartanegara",
    provinsi: "Kalimantan Timur",
    kodeWilayah: "64.02.05.2001",
    nib: "6402110912345",
    simkopdesVerified: true,
    isProducer: false,
  },
] as const;

export const juryCooperative = devCooperatives[0];
