export type DevCooperative = {
  id: string;
  nama: string;
  desa: string;
  kabupaten: string;
  provinsi: string;
  nib: string;
  simkopdesVerified: boolean;
  isProducer: boolean;
};

export type DevCommodity = {
  id: "beras" | "minyak_kita" | "gula" | "telur";
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
  { id: "minyak_kita", nama: "MinyaKita", satuan: "liter" },
  { id: "gula", nama: "Gula Pasir", satuan: "kg" },
  { id: "telur", nama: "Telur Ayam", satuan: "kg" },
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
    baselinePrice: 0,
    tiers: [],
    sources: [],
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
    id: "pool-minyak-kudus",
    commodityId: "minyak_kita",
    wilayah: "Kudus",
    windowOption: "two-weeks",
    baseTotalVolume: 800,
    baseParticipantCount: 4,
    baseMembers: [
      {
        cooperativeId: "10000000-0000-4000-8000-000000000004",
        name: "KDMP Kaliwungu",
        nib: "0310110912345",
        volume: 220,
        baselinePrice: 15_700,
      },
      {
        cooperativeId: "21000000-0000-4000-8000-000000000001",
        name: "KDMP Jekulo",
        nib: "0310110956789",
        volume: 200,
        baselinePrice: 15_600,
      },
      {
        cooperativeId: "21000000-0000-4000-8000-000000000002",
        name: "KDMP Mejobo",
        nib: "0310110934567",
        volume: 180,
        baselinePrice: 15_700,
      },
      {
        cooperativeId: "21000000-0000-4000-8000-000000000003",
        name: "KDMP Undaan",
        nib: "0310110976543",
        volume: 200,
        baselinePrice: 15_650,
      },
    ],
  },
  {
    id: "pool-telur-semarang",
    commodityId: "telur",
    wilayah: "Semarang",
    windowOption: "two-weeks",
    baseTotalVolume: 600,
    baseParticipantCount: 4,
    baseMembers: [
      {
        cooperativeId: "22000000-0000-4000-8000-000000000001",
        name: "KDMP Gunungpati",
        nib: "0330110912345",
        volume: 160,
        baselinePrice: 28_000,
      },
      {
        cooperativeId: "22000000-0000-4000-8000-000000000002",
        name: "KDMP Mijen",
        nib: "0330110956789",
        volume: 150,
        baselinePrice: 27_800,
      },
      {
        cooperativeId: "22000000-0000-4000-8000-000000000003",
        name: "KDMP Ngaliyan",
        nib: "0330110934567",
        volume: 140,
        baselinePrice: 28_200,
      },
      {
        cooperativeId: "22000000-0000-4000-8000-000000000004",
        name: "KDMP Tembalang",
        nib: "0330110976543",
        volume: 150,
        baselinePrice: 28_100,
      },
    ],
  },
] as const;

export const devCooperatives: readonly DevCooperative[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    nama: "KDMP Karangmalang",
    desa: "Karangmalang",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    nib: "0220110987654",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    nama: "KDMP Gemolong",
    desa: "Gemolong",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
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
    nib: "0350110912345",
    simkopdesVerified: true,
    isProducer: true,
  },
] as const;

export const juryCooperative = devCooperatives[0];
