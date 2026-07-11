import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] ??= value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan Supabase secret key wajib tersedia di .env.",
  );
}

// Supabase menginisialisasi klien realtime meski script ini hanya memakai REST.
// Stub ini mencegah requirement WebSocket pada Node 20; tidak pernah dikoneksikan.
globalThis.WebSocket ??= class WebSocket {};

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: commodityError } = await supabase.from("commodities").upsert(
  [
    { id: "beras", nama: "Beras Medium", satuan: "kg" },
    { id: "beras_lokal", nama: "Beras Lokal Produsen", satuan: "kg" },
    { id: "minyak_kita", nama: "MinyaKita", satuan: "liter" },
    { id: "gula", nama: "Gula Pasir", satuan: "kg" },
    { id: "telur", nama: "Telur Ayam", satuan: "kg" },
    { id: "lpg_3kg", nama: "LPG 3kg", satuan: "kg" },
  ],
  { onConflict: "id" },
);

if (commodityError) throw commodityError;

async function ensureSupplier(name, type, location) {
  const { data: existing, error: findError } = await supabase
    .from("suppliers")
    .select("id")
    .eq("nama", name)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await supabase
    .from("suppliers")
    .insert({ nama: name, tipe: type, lokasi: location })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}

const distributorId = await ensureSupplier(
  "PT Distribusi Nusantara",
  "distributor",
  "Serang, Banten",
);
const idFoodId = await ensureSupplier(
  "ID FOOD (Holding Pangan)",
  "bumn",
  "Jakarta",
);
const bulogId = await ensureSupplier("Perum BULOG", "bumn", "Banten");
const pertaminaId = await ensureSupplier(
  "Pertamina Patra Niaga",
  "bumn",
  "Banten",
);

const { error: tierError } = await supabase.from("price_tiers").upsert(
  [
    { supplier_id: distributorId, commodity_id: "minyak_kita", nama_tier: "D1", min_volume: 2_000, harga_per_unit: 14_000 },
    { supplier_id: distributorId, commodity_id: "minyak_kita", nama_tier: "Produsen", min_volume: 5_000, harga_per_unit: 13_500 },
    { supplier_id: bulogId, commodity_id: "beras", nama_tier: "Grosir", min_volume: 5_000, harga_per_unit: 14_574 },
    { supplier_id: bulogId, commodity_id: "beras", nama_tier: "Penggilingan", min_volume: 20_000, harga_per_unit: 13_765 },
    { supplier_id: distributorId, commodity_id: "beras_lokal", nama_tier: "Antar Koperasi", min_volume: 1_000, harga_per_unit: 12_900 },
    { supplier_id: idFoodId, commodity_id: "gula", nama_tier: "Distributor", min_volume: 1_000, harga_per_unit: 16_800 },
    { supplier_id: idFoodId, commodity_id: "gula", nama_tier: "Kontrak Klaster", min_volume: 5_000, harga_per_unit: 16_200 },
    { supplier_id: idFoodId, commodity_id: "telur", nama_tier: "Kontrak BUMN", min_volume: 1_000, harga_per_unit: 26_000 },
    { supplier_id: pertaminaId, commodity_id: "lpg_3kg", nama_tier: "Pangkalan", min_volume: 300, harga_per_unit: 6_000 },
    { supplier_id: pertaminaId, commodity_id: "lpg_3kg", nama_tier: "Distribusi Klaster", min_volume: 1_500, harga_per_unit: 5_500 },
  ],
  { onConflict: "supplier_id,commodity_id,min_volume" },
);

if (tierError) throw tierError;

const { error: poolError } = await supabase.from("pools").upsert(
  ["beras", "beras_lokal", "minyak_kita", "gula", "telur", "lpg_3kg"].map(
    (commodityId) => ({
      commodity_id: commodityId,
      wilayah: "Kota Serang",
      window_start: "2026-07-06",
      window_end: "2026-07-12",
      status: "open",
    }),
  ),
  {
    onConflict: "commodity_id,wilayah,window_start,window_end",
    ignoreDuplicates: true,
  },
);

if (poolError) throw poolError;

const { data: cooperatives, error: cooperativeError } = await supabase
  .from("cooperatives")
  .select("id, koperasi_ref")
  .in("koperasi_ref", ["KOP-0008016CB39E", "KOP-63AEF19F6654"]);

if (cooperativeError) throw cooperativeError;

const cilegon = cooperatives?.find(
  (item) => item.koperasi_ref === "KOP-0008016CB39E",
);
const unyur = cooperatives?.find(
  (item) => item.koperasi_ref === "KOP-63AEF19F6654",
);

if (!cilegon || !unyur) {
  throw new Error(
    "Koperasi Cilegon atau Unyur belum tersedia. Jalankan seed-demo.sql terlebih dahulu.",
  );
}

const { error: deleteError } = await supabase
  .from("settlements")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");

if (deleteError) throw deleteError;

const { error: insertError } = await supabase.from("settlements").insert({
  id: "70000000-0000-4000-8000-000000000001",
  coop_a: cilegon.id,
  coop_b: unyur.id,
  tagihan_a_ke_b: 20_000_000,
  tagihan_b_ke_a: 14_000_000,
});

if (insertError) throw insertError;

const expectedCommodities = [
  "beras",
  "beras_lokal",
  "minyak_kita",
  "gula",
  "telur",
  "lpg_3kg",
];
const { data: tierCoverage, error: coverageError } = await supabase
  .from("price_tiers")
  .select("commodity_id")
  .in("commodity_id", expectedCommodities);

if (coverageError) throw coverageError;

const coveredCommodities = new Set(
  (tierCoverage ?? []).map((item) => item.commodity_id),
);
const missingCommodities = expectedCommodities.filter(
  (commodityId) => !coveredCommodities.has(commodityId),
);
if (missingCommodities.length) {
  throw new Error(`Tier belum tersedia untuk: ${missingCommodities.join(", ")}`);
}

console.log(
  "Tier seluruh komoditas dan Net Settlement demo berhasil di-seed: neto Rp6.000.000.",
);
