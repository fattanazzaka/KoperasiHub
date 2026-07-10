# PLAN-retrofit — Constraint Cross-Supply + AI Rekomendasi Pengadaan

> Acuan: [ADDENDUM-01](docs/ADDENDUM-01-data-panitia-dan-fitur-baru.md) §2 & §3, peta kode Fase 0.
> Prinsip: tidak merusak demo hidup. Semua fitur harus jalan di **dua jalur** —
> Supabase (`isSupabaseConfigured()`) DAN fixture demo (`lib/dev-fixture.ts` + cookie).
> Estimasi ukuran per file: **kecil** (<40 baris), **sedang** (40–120), **besar** (>120 / file baru penuh).

---

## Ringkasan keputusan arsitektur (dibaca dulu)

> Dua keputusan di bawah **DIBEKUKAN** (disetujui): #1 = Opsi A (gerbang server + hint client),
> #6 = katalog Opsi B (~6 komoditas). Sisanya mengikuti.

1. **Cross-supply divalidasi di server action, bukan di `validateDemandForm` (DIBEKUKAN — Opsi A).**
   Alasan: `validateDemandForm(formData)` tidak punya konteks koperasi (kabupaten/kode_wilayah).
   Eligibilitas butuh pasangan `(kode_wilayah koperasi, komoditas)`. **Gerbang keras** ditempatkan
   di `app/actions/demand.ts` (punya `auth.cooperative`), memanggil helper murni baru
   `lib/cross-supply.ts`. **Signature `validateDemandForm` TIDAK diubah.** Client
   (`demand-form.tsx`) hanya memberi **hint UX** (peringatan + disable tombol) yang boleh
   di-bypass — bukan gerbang. Pola: *validate on server, hint on client*.
2. **Whitelist di-hardcode sebagai kurasi kecil untuk demo** (bukan query
   `referensi_komoditas_desa` saat runtime — dilarang CLAUDE.md). Nilai diturunkan dari
   data panitia, tapi dibekukan ke `lib/cross-supply.ts`. Tabel Supabase opsional (roadmap).
3. **Skor rekomendasi US-09 = heuristik deterministik (TypeScript murni), bukan LLM.**
   LLM (Anthropic) HANYA merangkai narasi/penjelasan dari sinyal yang sudah dihitung.
   Skor tetap explainable untuk Q&A juri (ADDENDUM §2 melarang klaim "AI/ML mentah").
   **Wajib ada fallback template** bila `ANTHROPIC_API_KEY` kosong atau panggilan gagal —
   demo tidak boleh bergantung pada jaringan/kunci.
4. **Data konsumsi/stok tidak ada di schema saat ini** → seluruhnya di-SEED/sintesis.
   Ini pekerjaan data terbesar di retrofit ini.
5. Skor & qty saran deterministik; LLM hanya menarasikan (lihat #3).
6. **Katalog komoditas: perluas 4 → ~6 (DIBEKUKAN — Opsi B).** Tambah **LPG 3kg** (contoh
   *blocked*: wajib pooling) + **1 komoditas regional** (mis. beras lokal produsen — contoh
   cross-supply *valid*). Prinsip: **katalog cukup luas untuk menceritakan constraint, tidak
   selebar produksi.** Komoditas *blocked* (LPG, opsional pupuk subsidi) **tidak perlu
   tier/pool/sumber lengkap** — cukup entri katalog + flag `blocked`. Beras/MinyaKita/Telur
   tetap punya tier+pool penuh (panggung Tangga Tier). Gula dibiarkan sebagai placeholder
   (`baselinePrice:0, tiers:[]`) atau dijadikan salah satu contoh. **BUKAN 9 penuh** (boros
   sprint: tiap komoditas butuh tier+sumber+seed).

---

## A. CONSTRAINT CROSS-SUPPLY (ADDENDUM §3)

### A0. Data & pengetahuan yang perlu di-SEED/staged
- **Whitelist eligibilitas** `(kode_wilayah_kabupaten → komoditas yang boleh dipasok)` —
  kurasi kecil dari data panitia (963 desa, 308 kabupaten → ambil hanya kabupaten yang
  muncul di skenario demo). **STAGED / hardcode.**
- **Pemetaan turunan** (Padi→Beras non-SPHP; Ayam→Telur Ayam, Daging Ayam; Kelapa→Minyak
  Kelapa, Gula Kelapa; Tebu→Gula Merah). **STAGED / hardcode.**
- **Daftar blokir kanal** (MinyaKita, LPG 3kg, Beras SPHP, pupuk subsidi, semua bermerek
  pabrikan) → wajib lewat pooling. **STAGED / hardcode.**

### A1. Perubahan skema/seed
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| Tambah `kode_wilayah` ke fixture koperasi (saat ini `DevCooperative` **tidak punya** field ini; schema punya) | `lib/dev-fixture.ts` | sedang | SEED |
| **Perluas katalog 4 → ~6 (Opsi B)**: tambah `lpg_3kg` (blocked) + `beras_lokal` (regional, cross-supply valid). Perlebar tipe `DevCommodity["id"]` | `lib/dev-fixture.ts` | sedang | SEED |
| Tandai tiap komoditas: kanal `pooling` vs `cross_supply` + flag `blocked`/`is_program`/`is_branded`. LPG & pupuk subsidi = `blocked` **tanpa** tier/pool/sumber | `lib/dev-fixture.ts` (+ opsional kolom `commodities` di `supabase/schema.sql`) | kecil–sedang | SEED |
| Skenario cross-supply demo: koperasi pembeli telur Kaltim (baseline Rp55.000) × pemasok kabupaten produsen ayam (whitelist). Alternatif: beras lokal produsen → pembeli non-produsen | `lib/dev-fixture.ts`, `supabase/seed-demo.sql` | sedang | SEED |
| (Opsional, roadmap) tabel `regional_commodities` di Supabase | `supabase/schema.sql` (milik Track A) | sedang | — |

> Catatan kepemilikan: `supabase/schema.sql` milik Track A — bila perlu diubah, koordinasi.
> Untuk MVP, cukup hardcode di `lib/cross-supply.ts` tanpa menyentuh schema.

### A2. Logika validasi (LIVE)
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| **Helper murni baru**: `isSupplyEligible(kodeWilayah, commodityId)`, `resolveDerivedCommodity()`, `isBlockedFromCrossSupply()`, `getEligibilityReason()` | **baru** `lib/cross-supply.ts` | besar | LIVE |
| Gerbang validasi: untuk `role=supply`, cek whitelist (level kabupaten = 5 digit pertama `kode_wilayah`, format `XX.YY`) + daftar blokir SEBELUM insert | `app/actions/demand.ts` | sedang | LIVE |
| Tipe error field baru + pesan ("Wilayah Anda tidak terkualifikasi memasok komoditas ini") | `lib/demand.ts` (tipe `DemandFieldErrors`) | kecil | LIVE |

### A3. Feedback UI
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| Saat toggle "Saya bisa suplai" + komoditas tidak eligible di wilayah → tampilkan peringatan inline + disable submit; framing "aturan kualifikasi pemasok" (BUKAN "potensi desa") | `components/demand-form.tsx` | sedang | LIVE |
| (opsional) badge kanal pada select komoditas: `[Pooling]` / `[Cross-supply]` | `components/demand-form.tsx` | kecil | LIVE |

### A4. Titik validasi — ringkas
```
demand-form (client, role=supply)
      │  submit
      ▼
app/actions/demand.ts  ──►  lib/cross-supply.ts
      │  (a) isBlockedFromCrossSupply(commodity)?  → tolak: "wajib lewat pooling"
      │  (b) isSupplyEligible(coop.kode_wilayah[:5], resolveDerived(commodity))? → tolak
      │  lolos ──► submitToSupabase / appendDemoDemand  (tak berubah)
```

---

## B. AI REKOMENDASI PENGADAAN — US-09 (ADDENDUM §2, MVP keranjang-1)

### B0. Data yang perlu di-SEED/sintesis (pekerjaan terbesar — belum ada sama sekali)
| Data | Sumber di ADDENDUM | Seed/Live |
|---|---|---|
| **Stok saat ini** per koperasi demo × komoditas | §4.4 sintesis | SEED |
| **Deret `barang_keluar` 90 hari** (untuk velocity) — snapshot asli hanya 1 hari | §4.4 sintesis + musiman ringan | SEED |
| **Harga beli terakhir** koperasi (baseline hemat) | §4.3 distribusi asli | SEED |
| **Pool setengah terisi** (satu ~77–85% menuju tier) agar kartu "hemat" bernilai | §1 koreografi | SEED (sudah ada di `devPools`) |
| Kalender musiman (pupuk: musim tanam; sembako: H-30 HBKN) | §2 rumus `musiman` | STAGED konstanta |

### B1. Lapisan sinyal (LIVE — perhitungan deterministik)
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| Tipe data stok/konsumsi + fixture 90 hari + akses cookie/Supabase (ikuti pola `demo-demands.ts`) | **baru** `lib/inventory.ts` (+ data di `lib/dev-fixture.ts`) | besar | data SEED, akses LIVE |
| Mesin skor: `velocity` (weighted moving average `barang_keluar`), `days_of_stock`, `urgensi`, `hemat` vs harga pool & HET, `hemat_norm`, `pool_aktif`, `musiman`, `skor`; ambang ≥0.35, filter velocity=0 & stok>0, max 3 kartu urut skor | **baru** `lib/recommendations.ts` | besar | LIVE |
| Guardrail HET (flag harga beli > HET) sebagai sinyal + badge | `lib/recommendations.ts` (+ konstanta HET) | kecil | LIVE |

### B2. Endpoint LLM (LIVE + fallback)
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| Route Handler backend: terima sinyal top-N (sudah dihitung server), panggil **Anthropic** untuk narasi + penjelasan awam + qty saran; **key hanya server** (`process.env.ANTHROPIC_API_KEY`) | **baru** `app/api/rekomendasi/route.ts` (atau server action) | sedang | LIVE |
| **Fallback template deterministik** bila key kosong / panggilan gagal / timeout — copy mengikuti contoh ADDENDUM §2 | `lib/recommendations.ts` (fungsi `formatNarrative`) | sedang | LIVE (jaring pengaman) |
| Tambah `ANTHROPIC_API_KEY` (+ komentar "server only, jangan commit") | `.env.example` | kecil | — |
| Dependensi `@anthropic-ai/sdk` | `package.json` | kecil | — |

> Penting: skor & qty saran dihitung di `lib/recommendations.ts` (deterministik). LLM tidak
> memutuskan angka; ia hanya **menarasikan**. Ini menjaga jawaban Q&A "kenapa rekomendasi ini?"
> tetap dari komponen skor, bukan black-box.

### B3. UI kartu + deep-link
| Item | File | Ukuran | Seed/Live |
|---|---|---|---|
| Komponen kartu: komoditas baku, prediksi tanggal habis, status pool (progress+deadline), estimasi hemat vs harga beli terakhir sendiri, tautan "Kenapa rekomendasi ini?" (explainability), badge HET | **baru** `components/recommendation-card.tsx` | besar | LIVE |
| Render ≤3 kartu di beranda koperasi | `components/role-home.tsx` + `app/beranda/page.tsx` (ambil rekomendasi server-side) | sedang | LIVE |
| CTA `[Gabung Pool]` deep-link → `/ajukan?commodity=X&qty=Y&baseline=Z`; bila tak ada pool aktif → `[Buka Permintaan Pool Baru]` | `components/recommendation-card.tsx` | kecil | LIVE |
| **Pre-fill deep-link**: terima `qty` & `baseline` (saat ini hanya `commodity`) | `app/ajukan/page.tsx`, `components/demand-form.tsx` | sedang | LIVE |

### B4. Alur US-09 — ringkas
```
app/beranda (server) ──► lib/recommendations.ts (skor deterministik, ≤3 kartu)
      │                         │ (opsional) app/api/rekomendasi → Anthropic → narasi
      │                         │ gagal/no-key → formatNarrative() template
      ▼
recommendation-card  ──[Gabung Pool]──►  /ajukan?commodity&qty&baseline  (≤2 interaksi)
```

---

## Urutan eksekusi yang disarankan (tiap langkah = titik commit hijau)
1. **A1+A2+A3** Constraint cross-supply (paling kecil risiko, memperkuat narasi inti P0).
2. **B0+B1** Data konsumsi/stok + mesin skor (tanpa UI, uji lewat log/unit kecil).
3. **B3** Kartu UI + deep-link pre-fill (masih pakai fallback template — sudah demo-able).
4. **B2** Endpoint Anthropic + `.env` (lapisan terakhir; demo tetap jalan tanpanya).

> Rasional urutan: setiap fase menghasilkan demo yang berdiri sendiri. Bila waktu habis di
> H-6, langkah 4 (LLM) bisa di-drop tanpa merusak US-09 — kartu tetap tampil via template.

---

## Yang SENGAJA tidak dibangun (jaga scope)
- Query `referensi_komoditas_desa` saat runtime (dilarang CLAUDE.md; whitelist di-hardcode).
- ML/forecasting sungguhan (heuristik dulu — ini bagian narasi, ADDENDUM §2).
- US-10 (push/WhatsApp) — roadmap.
- Perubahan besar `supabase/schema.sql` bila hardcode fixture sudah cukup untuk demo.
