export type DevCooperative = {
  id: string;
  nama: string;
  desa: string;
  kabupaten: string;
  provinsi: string;
  simkopdesVerified: boolean;
  isProducer: boolean;
};

export const devCooperatives: readonly DevCooperative[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    nama: "KDMP Karangmalang",
    desa: "Karangmalang",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    nama: "KDMP Gemolong",
    desa: "Gemolong",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    nama: "KDMP Masaran",
    desa: "Masaran",
    kabupaten: "Sragen",
    provinsi: "Jawa Tengah",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    nama: "KDMP Kaliwungu",
    desa: "Kaliwungu",
    kabupaten: "Kudus",
    provinsi: "Jawa Tengah",
    simkopdesVerified: true,
    isProducer: false,
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    nama: "KDMP Ringinrejo",
    desa: "Ringinrejo",
    kabupaten: "Blitar",
    provinsi: "Jawa Timur",
    simkopdesVerified: true,
    isProducer: true,
  },
] as const;

export const juryCooperative = devCooperatives[0];
