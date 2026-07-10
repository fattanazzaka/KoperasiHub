import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Panel Net Settlement (Muqashshah) — US-08.
// Skenario dibekukan di docs/07 §7: KDMP Cilegon memasok telur ke pool Serang,
// koperasi Serang (Unyur) memasok MinyaKita ke pool Cilegon. Neto: Cilegon
// menerima Rp6.000.000. Angka WAJIB identik dengan seed & deck.

export type SettlementLeg = {
  from: string; // koperasi pemasok
  to: string; // koperasi yang menerima pasokan (pihak yang ditagih)
  commodity: string;
  detail: string; // "800 kg × Rp25.000"
  amount: number;
};

export type SettlementDetail = {
  id: string;
  coopA: { name: string; lokasi: string };
  coopB: { name: string; lokasi: string };
  legAtoB: SettlementLeg; // tagihan A→B: A memasok ke B, B berutang ke A
  legBtoA: SettlementLeg; // tagihan B→A: B memasok ke A, A berutang ke B
  net: number; // selisih neto (nilai absolut) yang dibayar tunai
  receiver: string; // koperasi yang menerima neto
  payer: string; // koperasi yang membayar neto
};

// Rincian pasokan tidak disimpan di tabel `settlements` (hanya nominal tagihan).
// Karena settlement demo tunggal & beku, deskripsi komoditas/volume di-overlay
// dari docs/07 agar konsisten di kedua mode (dev fixture & Supabase).
const CILEGON_TO_SERANG = {
  commodity: "Telur Ayam",
  detail: "800 kg × Rp25.000",
} as const;
const SERANG_TO_CILEGON = {
  commodity: "MinyaKita",
  detail: "1.000 L × Rp14.000",
} as const;

function buildSettlement(input: {
  id: string;
  coopA: { name: string; lokasi: string };
  coopB: { name: string; lokasi: string };
  tagihanAtoB: number;
  tagihanBtoA: number;
}): SettlementDetail {
  const { coopA, coopB, tagihanAtoB, tagihanBtoA } = input;
  const netForA = tagihanAtoB - tagihanBtoA;
  const receiver = netForA >= 0 ? coopA.name : coopB.name;
  const payer = netForA >= 0 ? coopB.name : coopA.name;

  return {
    id: input.id,
    coopA,
    coopB,
    legAtoB: {
      from: coopA.name,
      to: coopB.name,
      commodity: CILEGON_TO_SERANG.commodity,
      detail: CILEGON_TO_SERANG.detail,
      amount: tagihanAtoB,
    },
    legBtoA: {
      from: coopB.name,
      to: coopA.name,
      commodity: SERANG_TO_CILEGON.commodity,
      detail: SERANG_TO_CILEGON.detail,
      amount: tagihanBtoA,
    },
    net: Math.abs(netForA),
    receiver,
    payer,
  };
}

const DEMO_SETTLEMENT: SettlementDetail = buildSettlement({
  id: "settlement-cilegon-serang",
  coopA: { name: "KDMP Cilegon", lokasi: "Kota Cilegon, Banten" },
  coopB: { name: "KDMP Unyur", lokasi: "Kota Serang, Banten" },
  tagihanAtoB: 20_000_000,
  tagihanBtoA: 14_000_000,
});

async function getSupabaseSettlement(): Promise<SettlementDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("settlements")
    .select("id, coop_a, coop_b, tagihan_a_ke_b, tagihan_b_ke_a")
    .limit(1)
    .maybeSingle();

  if (!row) {
    return null;
  }

  const { data: coops } = await supabase
    .from("cooperatives")
    .select("id, nama, kabupaten, provinsi")
    .in("id", [row.coop_a, row.coop_b]);

  const findCoop = (id: string) => {
    const match = (coops ?? []).find((coop) => coop.id === id);
    return {
      name: match?.nama ?? "Koperasi",
      lokasi: match
        ? [match.kabupaten, match.provinsi].filter(Boolean).join(", ")
        : "",
    };
  };

  return buildSettlement({
    id: row.id,
    coopA: findCoop(row.coop_a),
    coopB: findCoop(row.coop_b),
    tagihanAtoB: Number(row.tagihan_a_ke_b ?? 0),
    tagihanBtoA: Number(row.tagihan_b_ke_a ?? 0),
  });
}

export async function getSettlement(): Promise<SettlementDetail | null> {
  return isSupabaseConfigured() ? getSupabaseSettlement() : DEMO_SETTLEMENT;
}
