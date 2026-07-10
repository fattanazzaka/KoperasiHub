// Unit test aturan eligibilitas cross-supply (ADDENDUM-01 §3).
// Jalankan: npx tsx --test lib/cross-supply.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateSupplierEligibility,
  isEligibleSupplier,
  kabupatenCode,
} from "./cross-supply";

// Kasus 1 — VALID langsung: Blitar (35.05) whitelist "telur", menawarkan telur.
test("penawaran valid: komoditas ada di whitelist wilayah (direct)", () => {
  const koperasi = { kodeWilayah: "35.05.11.2003" }; // Blitar, Jatim
  const result = evaluateSupplierEligibility(koperasi, "telur");
  assert.equal(result.eligible, true);
  assert.equal(result.reason, "eligible_direct");
});

// Kasus 2 — VALID turunan: Sragen (33.14) produsen padi → boleh memasok beras.
test("penawaran valid: turunan mewarisi eligibilitas induk (padi → beras)", () => {
  const koperasi = { kodeWilayah: "33.14.09.2001" }; // Sragen, Jateng
  const result = evaluateSupplierEligibility(koperasi, "beras");
  assert.equal(result.eligible, true);
  assert.equal(result.reason, "eligible_derived");
  assert.equal(result.viaBase, "padi");
});

// Kasus 3 — DITOLAK barang program: MinyaKita wajib pooling meski wilayah lolos.
test("penawaran ditolak: barang program/HET wajib lewat pooling", () => {
  const koperasi = { kodeWilayah: "33.14.09.2001" }; // wilayah valid mana pun
  const result = evaluateSupplierEligibility(koperasi, "minyak_kita");
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "blocked_channel");
  // LPG 3kg juga diblokir.
  assert.equal(isEligibleSupplier(koperasi, "lpg_3kg"), false);
});

// Kasus 4 — DITOLAK wilayah salah: Kaltim (64.71) bukan produsen telur.
test("penawaran ditolak: wilayah tidak terkualifikasi memproduksi komoditas", () => {
  const koperasi = { kodeWilayah: "64.71.05.1002" }; // Balikpapan, Kaltim (pembeli)
  const result = evaluateSupplierEligibility(koperasi, "telur");
  assert.equal(result.eligible, false);
  assert.equal(result.reason, "not_produced_in_region");
});

// Katalog Opsi B — kunci perilaku dua komoditas baru.
test("katalog Opsi B: beras_lokal (turunan padi) eligible, lpg_3kg selalu diblokir", () => {
  const produsenPadi = { kodeWilayah: "33.14.09.2001" }; // Sragen
  assert.equal(isEligibleSupplier(produsenPadi, "beras_lokal"), true);
  // LPG 3kg diblokir dari kanal cross-supply di wilayah mana pun.
  assert.equal(isEligibleSupplier(produsenPadi, "lpg_3kg"), false);
  assert.equal(isEligibleSupplier({ kodeWilayah: "35.05.20.2005" }, "lpg_3kg"), false);
});

// Kasus 5 — helper kabupatenCode: ambil 5 karakter pertama, tangani input kosong.
test("kabupatenCode mengambil prefix XX.YY dan menolak input kosong", () => {
  assert.equal(kabupatenCode("35.05.11.2003"), "35.05");
  assert.equal(kabupatenCode(null), null);
  assert.equal(kabupatenCode(""), null);
  // Kode wilayah kosong → tidak dapat diverifikasi.
  assert.equal(evaluateSupplierEligibility({ kodeWilayah: null }, "telur").reason, "unknown_region");
});
