# Angka Demo FINAL — KoperasiHub (DIBEKUKAN)

> **Status:** dibekukan Track B setelah ETL dari shared DB panitia (10 Jul 2026).
> Semua angka di UI, seed, pitch deck, README, dan video **WAJIB identik** dengan
> dokumen ini. Juri tidak boleh melihat dua angka berbeda untuk hal yang sama.
> Sumber baseline = data asli `barang_masuk_produk.harga_beli`; tier harga = Permendag
> 18/2024 (MinyaKita). Menggantikan koreografi beras/Sragen di docs/06 (lihat §0).

## 0. Perubahan dari docs/06 (dan alasannya, berbasis data)

docs/06 mengasumsikan klaster **beras di Sragen**. Setelah ETL, asumsi itu direvisi
berdasarkan data nyata:

- **Koperasi tersebar nasional & nama disensor** → seed dikoreografi (nama "KDMP
  <desa>" dari desa asli), bukan disalin 1:1. Ini memang sudah diantisipasi docs/06 §2.
- **Beras riil = SPHP Bulog ~Rp11.400/kg (sudah subsidi)** → di BAWAH tier grosir mana
  pun. Narasi hemat beras dari baseline riil TIDAK jalan; memaksa baseline = BPS eceran
  justru yang diperingatkan docs/03 ("hemat digelembungkan"). → **beras dipindah ke
  slide DAMPAK MAKRO deck saja** (jangkar BPS, §8), bukan transaksi demo.
- **MinyaKita riil ~Rp14.500–15.700/L**, di ATAS tier Permendag D1 14.000 & produsen
  13.500 → hemat NYATA & bisa dibela. → **MinyaKita jadi komoditas hero demo.**
- **Klaster demo = Kota Serang, Banten** (kabupaten dengan pembeli MinyaKita riil
  terpadat). Cross-supply telur dari **Kota Cilegon, Banten** (produsen tetangga).

## 1. Klaster & koperasi demo

**Klaster: Kota Serang, Provinsi Banten.** Nama koperasi = "KDMP <desa asli>";
`koperasi_ref` asli dipertahankan untuk keterlacakan.

| Nama demo | koperasi_ref (asli) | kec. | desa | anggota | peran |
|---|---|---|---|---|---|
| KDMP Cipare | *(sintetis)* | Serang | Cipare¹ | 240 | **akun juri** (baseline HET 15.700) |
| KDMP Kaligandu | KOP-315C5EFCC96D | Serang | Kaligandu | 172 | pembeli (baseline 14.500) |
| KDMP Unyur | KOP-63AEF19F6654 | Serang | Unyur | 524 | pembeli (baseline 14.500) |
| KDMP Terondol | KOP-F8A0C206EB72 | Serang | Terondol | 232 | pembeli (baseline 14.500) |
| KDMP Pancalaksana | KOP-CA604BC75944 | Curug | Pancalaksana | 136 | pembeli (baseline 14.500) |
| KDMP Cilegon | KOP-0008016CB39E | — | (Kota Cilegon) | 310 | **produsen telur** `is_producer` |

¹ Kel. Cipare = kelurahan nyata di Kec. Serang; verifikasi ada di `referensi_wilayah`
saat snapshot, bila tidak pakai kelurahan Kota Serang lain (mis. Sumurpecung/Lopang).

Plus snapshot **±20 koperasi Banten lain** (real, dari dataset) untuk mengisi dashboard
admin agar agregat terasa nyata. Akun:
`juri@koperasihub.id` / `demo123` → KDMP Cipare (role koperasi);
`admin@koperasihub.id` / `demo123` (role admin).

## 2. Komoditas (tabel `commodities`)

| id | nama | satuan |
|---|---|---|
| minyak_kita | MinyaKita | liter |
| telur | Telur Ayam | kg |
| beras | Beras | kg |
| gula | Gula Pasir | kg |

(Pool aktif hanya minyak_kita & telur; beras/gula muncul sbg opsi form pengajuan.)

## 3. Supplier & price tiers (tabel `suppliers`, `price_tiers`)

**MinyaKita** (Permendag 18/2024: produsen 13.500 · D1 14.000 · D2 14.500 · HET 15.700):
| Supplier | tipe | nama_tier | min_volume | harga/L |
|---|---|---|---|---|
| PT Distribusi Nusantara | distributor | D1 | 2.000 L | 14.000 |
| PT Distribusi Nusantara | distributor | Produsen | 5.000 L | 13.500 |

**Telur** (baseline lokal Banten ~28.000; tiga label sumber untuk cross-supply):
| Supplier | tipe | nama_tier | min_volume | harga/kg |
|---|---|---|---|---|
| CV Sumber Protein | distributor | Grosir | 500 kg | 26.500 |
| ID FOOD (Holding Pangan) | bumn | Kontrak BUMN | 500 kg | 26.000 |
| KDMP Cilegon | koperasi | Ternak Anggota | 300 kg | 25.000 |

→ Termurah = **Koperasi Produsen** (bukti visual cross-supply menang).

## 4. Pool A — MinyaKita, Kota Serang (HERO, 85% → 100%)

Ambang **Tier D1 = 2.000 L @ Rp14.000**. Status: open.

Demand awal (4 koperasi mapan, baseline 14.500):
| koperasi | volume | baseline |
|---|---|---|
| KDMP Kaligandu | 400 L | 14.500 |
| KDMP Unyur | 500 L | 14.500 |
| KDMP Terondol | 450 L | 14.500 |
| KDMP Pancalaksana | 350 L | 14.500 |
| **subtotal** | **1.700 L (85%)** | |

**Momen wow (juri):** KDMP Cipare (baseline **15.700**, HET) mengajukan **400 L** →
total **2.100 L** → Tier D1 tercapai → admin lock → PO terbit.
- **Hemat juri = (15.700 − 14.000) × 400 = Rp680.000**
- **Fee Keberhasilan juri (P1) = 5% × 680.000 = Rp34.000**
- Hemat kolektif @D1 = (mapan: 500 × 1.700 = 850.000) + (juri: 680.000) ≈ **Rp1.530.000** / siklus
- Tier berikut (Produsen 5.000 L @13.500) tampil sbg headroom: 2.100/5.000 = **42%**.

## 5. Pool B — MinyaKita, Kab. Serang (40%, latar)

Ambang Tier D1 = 2.000 L @ 14.000. 3 demand baseline 15.000–15.700, total **800 L (40%)**.
Hanya tampil di daftar (tidak disentuh saat demo) — menunjukkan pool tahap awal &
pooling lintas-wilayah komoditas yang sama.

## 6. Pool C — Telur, Kota Serang (60%, CROSS-SUPPLY)

Ambang **Tier Grosir = 1.000 kg @ Rp26.500**. Status open.
- Demand (baseline 28.000): 4 koperasi total **600 kg (60%)**.
- Entry `role='supply'`: **KDMP Cilegon** kapasitas **800 kg @ Rp25.000**.
- Detail pool menampilkan 3 label berdampingan (urut termurah):
  [Koperasi Produsen] KDMP Cilegon 25.000 · [BUMN Pangan] ID FOOD 26.000 ·
  [Distributor] CV Sumber Protein 26.500.

## 7. PO historis + Settlement (agar beranda juri ≠ 0)

**PO historis (status po_issued):** MinyaKita Kota Serang periode lalu, **2.400 L**,
tier D1 14.000. Allocations utk 5 koperasi termasuk KDMP Cipare (juri):
- Alokasi juri: **300 L**, baseline 15.700 → **hemat Rp510.000** (= angka "Total Hemat"
  di beranda juri saat pertama login). Fee P1 = Rp25.500.

**Settlement (P1, 1 baris):** KDMP Cilegon memasok telur ke pool Serang; sebuah koperasi
Serang memasok MinyaKita ke pool Cilegon.
- Tagihan Cilegon→Serang (telur): 800 kg × 25.000 = **Rp20.000.000**
- Tagihan Serang→Cilegon (minyak): 1.000 L × 14.000 = **Rp14.000.000**
- **Neto: KDMP Cilegon menerima Rp6.000.000.**

## 8. Angka kunci yang HARUS identik (UI · deck · video · README)

- MinyaKita: baseline HET **15.700**, D2 **14.500**, D1 **14.000**, produsen **13.500**.
- **Hemat juri Rp680.000** (400 L × Rp1.700) · **Fee Rp34.000**.
- **Total Hemat beranda juri Rp510.000** (dari PO historis).
- Hemat kolektif Pool A ≈ **Rp1.530.000/siklus**.
- Telur: baseline 28.000; koperasi produsen 25.000 (**hemat Rp3.000/kg**).
- Settlement neto **Rp6.000.000** (Cilegon menerima).

## 9. Jangkar harga MAKRO untuk deck (bukan angka transaksi demo)

Slide dampak nasional boleh memakai BPS beras (data publik paling bersih, jelas dilabeli
sbg ilustrasi pasar — BUKAN baseline koperasi tertentu):
- BPS Mei 2026: penggilingan **13.765** · grosir **14.574** · eceran **15.358** /kg
  (selisih eceran→grosir **Rp784/kg**). Dua skenario dampak: docs/03 §3.2.
- Insight jujur (kekuatan pitch): KDMP ternyata **sudah** beli beras SPHP ~Rp11.400/kg
  (bersubsidi) → ruang hemat beras tipis; justru MinyaKita yang punya margin distributor
  untuk ditangkap pooling. Ini menunjukkan tim truth-seeking.

## 10. Catatan defensibility (jawaban lisan untuk juri)

- **"Kenapa baseline juri 15.700 tapi koperasi lain 14.500?"** Baseline dicatat
  per-koperasi (docs/03). Koperasi baru/kecil (persona juri) beli di HET retail; koperasi
  mapan sudah punya akses distributor (D2 14.500). Data bahkan menunjukkan sebagian
  koperasi bayar sampai Rp17.800/L — jadi 15.700 konservatif. Justru inti nilai produk:
  pooling menaikkan daya beli koperasi kecil ke level koperasi besar, lalu melampauinya.
- **Semua baseline berasal dari `harga_beli` transaksi nyata koperasi**, bukan karangan.
