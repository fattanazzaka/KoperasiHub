/**
 * scripts/04-bekukan-angka.ts — Track B
 * ---------------------------------------------------------------------------
 * TUJUAN: membaca DB Supabase yang sudah di-seed lalu MEMBANDINGKAN angka nyata
 * dengan angka beku di docs/07. Kalau ada yang meleset (❌), berarti seed & dokumen
 * tidak sinkron — harus dibetulkan sebelum demo/deck.
 *
 * PRASYARAT: schema + seed-snapshot + seed-demo sudah jalan di Supabase;
 *   .env berisi NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * JALANKAN:  npx tsx scripts/04-bekukan-angka.ts
 * ---------------------------------------------------------------------------
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const rp = (n: number) => "Rp" + n.toLocaleString("id-ID");
let gagal = 0;
function cek(label: string, harap: number, nyata: number, format = rp) {
  const ok = harap === nyata;
  if (!ok) gagal++;
  console.log(
    `  ${ok ? "✅" : "❌"} ${label.padEnd(46)} harap ${format(harap).padStart(14)}` +
      (ok ? "" : `  |  NYATA ${format(nyata)}`),
  );
}
const pol = (n: number) => n.toLocaleString("id-ID");

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Terima key rahasia format baru (sb_secret_...) maupun service_role lama.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "\n❌ Butuh NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SECRET_KEY atau " +
        "SUPABASE_SERVICE_ROLE_KEY) di .env.\n",
    );
    process.exit(1);
  }
  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [pools, demands, allocs, setts, coops] = await Promise.all([
    sb.from("pools").select("*"),
    sb.from("demands").select("*"),
    sb.from("allocations").select("*"),
    sb.from("settlements").select("*"),
    sb.from("cooperatives").select("id, nama, koperasi_ref"),
  ]);
  for (const r of [pools, demands, allocs, setts, coops])
    if (r.error) throw r.error;

  type Row = Record<string, any>;
  const P: Row[] = pools.data!,
    D: Row[] = demands.data!,
    A: Row[] = allocs.data!,
    S: Row[] = setts.data!,
    C: Row[] = coops.data!;

  const refToId = new Map(C.map((c) => [c.koperasi_ref, c.id]));
  const findPool = (com: string, wil: string, ws: string) =>
    P.find(
      (p) => p.commodity_id === com && p.wilayah === wil && p.window_start === ws,
    );
  const volDemand = (poolId: string, role: "demand" | "supply") =>
    D.filter((d) => d.pool_id === poolId && d.role === role).reduce(
      (s, d) => s + d.volume,
      0,
    );

  console.log("\n=== VERIFIKASI SEED vs docs/07 ===\n");

  // Pool A (hero) — demand 1.700 L (85% dari 2.000).
  const poolA = findPool("minyak_kita", "Kota Serang", "2026-07-06");
  console.log("Pool A — MinyaKita Kota Serang (hero):");
  cek("volume demand awal (L)", 1700, poolA ? volDemand(poolA.id, "demand") : -1, pol);

  // Pool B — 800 L (40%).
  const poolB = findPool("minyak_kita", "Kab. Serang", "2026-07-06");
  console.log("Pool B — MinyaKita Kab. Serang:");
  cek("volume demand (L)", 800, poolB ? volDemand(poolB.id, "demand") : -1, pol);

  // Pool C — telur 600 kg (60%) + ada entry supply.
  const poolC = findPool("telur", "Kota Serang", "2026-07-06");
  console.log("Pool C — Telur Kota Serang (cross-supply):");
  cek("volume demand (kg)", 600, poolC ? volDemand(poolC.id, "demand") : -1, pol);
  cek("volume supply produsen (kg)", 800, poolC ? volDemand(poolC.id, "supply") : -1, pol);

  // PO historis — allocations.
  const poolH = findPool("minyak_kita", "Kota Serang", "2026-06-01");
  const aH = poolH ? A.filter((a) => a.pool_id === poolH.id) : [];
  const totVol = aH.reduce((s, a) => s + a.volume, 0);
  const totHemat = aH.reduce((s, a) => s + Number(a.hemat_rp), 0);
  const cipareId = refToId.get("DEMO-CIPARE");
  const juriHemat = aH.find((a) => a.cooperative_id === cipareId)?.hemat_rp ?? -1;
  console.log("PO historis — MinyaKita Kota Serang (Juni):");
  cek("total volume alokasi (L)", 2400, totVol, pol);
  cek("hemat kolektif", 1560000, totHemat);
  cek("Total Hemat beranda juri", 510000, Number(juriHemat));

  // Settlement neto.
  const cilegonId = refToId.get("KOP-0008016CB39E");
  const st = S.find((s) => s.coop_a === cilegonId || s.coop_b === cilegonId);
  let neto = -1;
  if (st)
    neto =
      st.coop_a === cilegonId
        ? Number(st.tagihan_a_ke_b) - Number(st.tagihan_b_ke_a)
        : Number(st.tagihan_b_ke_a) - Number(st.tagihan_a_ke_b);
  console.log("Settlement (P1):");
  cek("neto diterima KDMP Cilegon", 6000000, neto);

  // Referensi momen wow live (dihitung, bukan dari seed).
  console.log("\nReferensi momen wow (juri ajukan 400 L @ baseline 15.700):");
  console.log(`  • Hemat juri  = (15.700-14.000) × 400 = ${rp(680000)}`);
  console.log(`  • Fee (P1)    = 5% × 680.000         = ${rp(34000)}`);
  console.log(`  • Total Pool A jadi 2.100 L (105%) → tembus tier D1 2.000 L`);

  console.log(
    "\n" +
      (gagal === 0
        ? "🎉 SEMUA COCOK dengan docs/07. Angka aman dipakai UI/deck/video."
        : `⚠️  ${gagal} angka TIDAK cocok — betulkan seed atau docs/07 sebelum lanjut.`) +
      "\n",
  );
  process.exit(gagal === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).message);
  process.exit(1);
});
