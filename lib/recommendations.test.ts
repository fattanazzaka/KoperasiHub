// Unit test mesin sinyal Rekomendasi Pengadaan Cerdas — US-09 (ADDENDUM-01 §2).
// Jalankan: npx tsx --test lib/recommendations.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeVelocity,
  evaluateCandidate,
  rankCandidates,
  type CandidateInput,
} from "./recommendations";

const NOW = new Date("2026-07-11T09:00:00+07:00");

function makeInput(overrides: Partial<CandidateInput>): CandidateInput {
  return {
    commodityId: "beras",
    stokSaatIni: 60,
    dailyOutflows: Array(30).fill(10),
    hargaBeliTerakhir: 15_000,
    qtyBeliTerakhir: 300,
    poolAktif: true,
    hargaTierPool: 14_200,
    poolId: "pool-uji",
    musiman: false,
    ...overrides,
  };
}

// Test 1 — jalur lengkap: velocity, urgensi, qty, hemat, dan skor sesuai rumus §2.
test("kandidat lolos: semua komponen sinyal dihitung sesuai rumus ADDENDUM §2", () => {
  const signal = evaluateCandidate(makeInput({}), NOW);
  assert.ok(signal, "kandidat seharusnya lolos ambang");

  // Velocity: WMA deret konstan 10 → tepat 10; data tipis (<7) → rata-rata sederhana.
  assert.equal(signal.velocityHarian, 10);
  assert.equal(computeVelocity([12, 8, 10, 10]), 10);

  // days_of_stock = 60/10 = 6 → urgensi = 1 - 6/30 = 0.8; habisPada = NOW + 6 hari.
  assert.equal(signal.daysOfStock, 6);
  assert.equal(signal.skorRincian.urgensi, 0.8);
  assert.equal(signal.habisPada, "2026-07-17");

  // qty_saran = velocity × 30 = 300 (sudah kelipatan 10).
  assert.equal(signal.qtySaran, 300);

  // hemat = (15.000 - 14.200) × 300 = 240.000; norm = 240.000 / (15.000 × 300).
  assert.equal(signal.hematEstimasi, 240_000);
  const expectedSkor =
    0.45 * 0.8 + 0.35 * (240_000 / (15_000 * 300)) + 0.2 * 1 + 0;
  assert.ok(Math.abs(signal.skor - expectedSkor) < 1e-9);

  // Tanpa entri HET untuk beras → flag mati.
  assert.equal(signal.flagHet, false);

  // Pembulatan ke atas ke kelipatan 10: velocity 9,7 → 291 → qty 300.
  const rounded = evaluateCandidate(
    makeInput({ dailyOutflows: Array(30).fill(9.7) }),
    NOW,
  );
  assert.equal(rounded?.qtySaran, 300);
});

// Test 2 — saringan & peringkat: AC1 (maks 3, urut skor) dan AC6 (velocity 0 = noise).
test("saringan: velocity 0 & skor rendah tersaring; maksimal 3 kartu urut skor", () => {
  // AC6: velocity = 0 dan stok > 0 → tidak ada rekomendasi.
  assert.equal(
    evaluateCandidate(
      makeInput({ dailyOutflows: Array(30).fill(0), stokSaatIni: 50 }),
      NOW,
    ),
    null,
  );

  // Stok tebal (300 hari) tanpa pool → urgensi 0 & hemat 0 → tersaring.
  assert.equal(
    evaluateCandidate(
      makeInput({
        stokSaatIni: 3_000,
        poolAktif: false,
        hargaTierPool: null,
        poolId: null,
      }),
      NOW,
    ),
    null,
  );

  // 4 kandidat lolos (urgensi 0,9/0,8/0,7/0,5; hemat 0; pool aktif) → skor
  // 0,605/0,56/0,515/0,425 → hanya 3 teratas yang tampil, urut skor menurun.
  const inputs = [
    { id: "d", stok: 150 }, // skor 0,425 — sengaja pertama agar urutan teruji
    { id: "b", stok: 60 }, // 0,56
    { id: "a", stok: 30 }, // 0,605
    { id: "c", stok: 90 }, // 0,515
  ].map(({ id, stok }) =>
    makeInput({
      commodityId: id,
      stokSaatIni: stok,
      hargaTierPool: 15_000, // sama dengan harga beli → hemat 0, pool tetap aktif
    }),
  );
  const ranked = rankCandidates(inputs, NOW);

  assert.equal(ranked.length, 3);
  assert.deepEqual(
    ranked.map((signal) => signal.commodityId),
    ["a", "b", "c"],
  );
  assert.ok(ranked[0].skor > ranked[1].skor && ranked[1].skor > ranked[2].skor);
});
