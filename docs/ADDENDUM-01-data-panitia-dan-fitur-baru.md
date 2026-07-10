# ADDENDUM-01 — Temuan Data Panitia, US-09, & Aturan Eligibilitas Cross-Supply

> **Status**: Melengkapi CLAUDE.md dan docs/01–06. Jika bertentangan dengan docs/06 (seed data), addendum ini menang karena berbasis data resmi panitia (snapshot SIMKOPDES, sample terstratifikasi 27 koperasi × 38 provinsi = 1.026 koperasi, periode Jan–Jul 2026).
> **Rambu framing tetap berlaku**: semua fitur dinarasikan dalam bahasa Tema 1 (procurement layer, supplier network). DILARANG memakai frasa "potensi desa".

---

## 1. Angka Kunci dari Data Panitia (siap pakai di pitch)

| # | Temuan | Angka | Sumber tabel |
|---|--------|-------|--------------|
| 1 | Funnel aktivasi: profil → katalog produk → pernah jual → pernah catat pembelian | 1.026 → 640 (62%) → 418 (41%) → **301 (29%)** | profil, produk, transaksi, barang_masuk |
| 2 | Catatan pembelian (satu-satunya sumber `harga_beli`) | **665 baris** untuk 1.026 koperasi | barang_masuk_produk |
| 3 | Koperasi membeli MinyaKita 1L **di atas HET eceran Rp15.700** | **10 dari 53 (19%)**; spread beli Rp14.000–21.000 | barang_masuk_produk |
| 4 | Spread harga beli Beras SPHP 5kg | Rp55.000–63.000 (**14,5%**) | barang_masuk_produk |
| 5 | Pupuk = komoditas pengadaan #1 | NPK+Urea = **37%** dari seluruh catatan barang masuk | barang_masuk_produk |
| 6 | Outlier NPK di luar jalur distributor resmi | Rp2.640/kg vs mayoritas Rp1.840 (**+43%**) | barang_masuk_produk |
| 7 | Pengajuan kemitraan (bukti demand supplier network) | **3.254 pengajuan dari 622 koperasi (61%)**, 533 ditolak (16%) | pengajuan_kemitraan |
| 8 | Top kemitraan yang diburu | LPG 3kg (523), Sembako (470), Agen RPK/Bulog (419), **Kios Pupuk Non-Subsidi (293)** | pengajuan_kemitraan |
| 9 | Pipeline pembiayaan macet | 118 pengajuan (median Rp500 jt), **hanya 1 Verified** | pengajuan_pembiayaan |
| 10 | Gerai sembako aktif — pemerintah menamainya "**Embrio KopHub**" | 320 aktif; + 40 gerai logistik aktif (calon node distribusi) | gerai_koperasi |
| 11 | Arbitrase telur antar wilayah | Kaltim beli Rp55.000/kg vs DKI Rp24.000/kg; 466 koperasi di wilayah produsen ayam | barang_masuk × referensi_komoditas_desa |
| 12 | Pasar cross-supply beras terukur | 55 dari 80 pembelian beras dilakukan koperasi di wilayah **non-produsen padi** | barang_masuk × referensi_komoditas_desa |
| 13 | Kekacauan satuan & penamaan | NPK tercatat /kg dan /sak-50kg di kolom sama; 14 varian nama "MinyaKita" | barang_masuk, produk_koperasi |
| 14 | 100% transaksi penjualan tunai | 1.000/1.000 Cash | transaksi_penjualan |

**Peringatan angka**: total nilai transaksi_penjualan sampel (Rp11,47 M / 1.000 trx) janggal — jangan dipakai tanpa pembersihan. Kolom `harga_beli` mengandung nol dan campuran satuan; selalu bersihkan sebelum agregasi.

---

## 2. US-09 (P1) — Rekomendasi Pengadaan Cerdas

### User story
> Sebagai **pengurus koperasi**, saya menerima **rekomendasi pengadaan** yang memprediksi kapan stok komoditas saya habis dan menunjukkan potensi hemat dari pool aktif, sehingga saya bisa **bergabung ke pool dalam ≤2 langkah** tanpa menghitung manual.

### Posisi dalam produk
- Bukan fitur tempelan AI — ini **akselerator cold-start pooling**: sistem proaktif mengisi pool dengan koperasi yang stoknya menipis → tier tercapai lebih cepat → success fee terealisasi lebih cepat.
- Flywheel: rekomendasi → gabung pool → transaksi pool tercatat dengan satuan & harga baku → data konsumsi makin rapi → rekomendasi makin akurat. (Selaras pesan mentorship: "solusi membuat data makin rapi setiap kali dipakai".)

### Logika skor (transparan & explainable — WAJIB bisa dijelaskan di Q&A)
```
days_of_stock  = stok_saat_ini / velocity_harian          # velocity = rolling 30 hari barang_keluar
urgensi        = clamp(1 - days_of_stock/30, 0, 1)         # 0 hari stok = 1.0; ≥30 hari = 0
hemat          = max(0, harga_beli_terakhir - harga_tier_pool) * qty_rekomendasi
hemat_norm     = clamp(hemat / nilai_pembelian_terakhir, 0, 1)
pool_aktif     = 1 jika ada pool komoditas tsb di klaster wilayah & belum deadline, else 0
musiman        = 0.15 jika kalender aktif (pupuk: musim tanam; sembako: H-30 HBKN), else 0

skor = 0.45*urgensi + 0.35*hemat_norm + 0.20*pool_aktif + musiman
Tampilkan kartu jika skor ≥ 0.35 DAN (urgensi > 0 ATAU hemat > 0)
qty_rekomendasi = velocity_harian × 30 hari coverage (dibulatkan ke kelipatan satuan pool), dapat diedit
```

### Acceptance criteria
1. Kartu rekomendasi muncul di dashboard hanya jika lolos ambang skor; maksimal 3 kartu, urut skor.
2. Setiap kartu menampilkan: nama komoditas baku, prediksi tanggal stok habis, status pool (progress ke tier berikutnya + deadline), estimasi hemat dalam Rupiah vs **harga beli terakhir koperasi sendiri** (konsisten dengan baseline success fee).
3. CTA **[Gabung Pool]** melakukan deep-link ke form demand submission (US-02) dengan qty & baseline pre-filled dan dapat diedit; konfirmasi = maksimal 2 interaksi.
4. Setiap kartu punya tautan "Kenapa rekomendasi ini?" yang menampilkan komponen skor dalam bahasa awam (explainability).
5. Jika tidak ada pool aktif, kartu tetap boleh muncul untuk urgensi stok tinggi dengan CTA **[Buka Permintaan Pool Baru]**.
6. Tidak ada rekomendasi untuk komoditas dengan velocity = 0 dan stok > 0 (hindari noise).

### Copy contoh (untuk demo)
> "Stok **MinyaKita 1L** diprediksi habis **18 Juli** (7 hari lagi). Pool **Jawa Timur** ditutup 15 Juli — 1.840/2.400 L menuju **Tier 2 (Rp14.200)**. Estimasi hemat **Rp360.000** vs pembelian terakhirmu. **[Gabung Pool →]**"

### Penamaan & jawaban Q&A
- Sebut: **"Rekomendasi Pengadaan Cerdas"** berbasis *consumption forecasting* + rule musiman. Hindari klaim "AI/ML prediktif" mentah.
- Jika juri tanya model: "Tahap awal memakai heuristik transparan karena data pengadaan SIMKOPDES masih tipis — hanya 665 catatan pembelian untuk 1.026 koperasi. Justru KoperasiHub yang menghasilkan data terstandar untuk model prediktif fase berikutnya." (Keterbatasan → roadmap.)

### US-10 (P2, roadmap saja — jangan dibangun di sprint)
Notifikasi push/WhatsApp untuk rekomendasi skor tinggi & pool mendekati deadline.

---

## 3. Aturan Eligibilitas Cross-Supply — Komoditas Regional Saja

### Prinsip (kalimat pembeda untuk pitch)
> "Barang manufaktur & program (MinyaKita, LPG, SPHP, pupuk) mengalir lewat **pooling** ke distributor resmi. Komoditas primer regional mengalir lewat **cross-supply** antar koperasi — dan koperasi hanya boleh memasok komoditas yang **terbukti diproduksi wilayahnya menurut data SIMKOPDES sendiri**."

### Aturan validasi (programatik)
1. **Gerbang utama — whitelist resmi**: penawaran suplai valid hanya jika pasangan `(kabupaten(koperasi), komoditas_baku)` ada di `referensi_komoditas_desa`. Validasi di **level kabupaten** = 5 digit pertama `kode_wilayah` (`XX.YY`), bukan level desa (terlalu ketat) atau provinsi (terlalu longgar). Cakupan data: 963 desa, 308 kabupaten.
2. **Pemetaan turunan** (tabel kurasi kecil, hardcode untuk demo): Padi → Beras (non-SPHP); Ayam → Telur Ayam, Daging Ayam; Kelapa → Minyak Kelapa, Gula Kelapa; Tebu → Gula Merah; dst. Turunan mewarisi eligibilitas komoditas induknya.
3. **Daftar blokir kanal cross-supply**: semua barang program/HET (MinyaKita, LPG 3kg, Beras SPHP, pupuk subsidi) dan semua barang bermerek pabrikan → wajib lewat kanal pooling.
4. **Sinyal sekunder** (bukan gerbang): keberadaan `kode_barcode` menandai barang manufaktur (72% produk primer di data tanpa barcode, tapi 48% produk manufaktur juga kosong barcodenya — tidak boleh jadi validator tunggal).

### Alasan yang bisa dinarasikan (3 lapis)
1. **Logika ekonomi**: barang bermerek tidak punya arbitrase antar wilayah — distributor nasional selalu menang. Cross-supply hanya bernilai di komoditas dengan keunggulan komparatif regional (bukti: telur Rp24rb DKI vs Rp55rb Kaltim; 55/80 pembelian beras oleh wilayah non-produsen).
2. **Tata kelola pemasok / manajemen risiko**: koperasi tidak bisa menawarkan barang yang tidak diproduksi wilayahnya → mencegah gagal serah & menjaga kualitas jaringan pemasok. **(Framing: "aturan kualifikasi pemasok" — Tema 1. BUKAN "potensi desa".)**
3. **Diferensiasi**: pemisahan kanal yang bersih vs Coop Trade (ekspor/marketplace) dan menegaskan KoperasiHub = procurement layer, bukan marketplace.

### Dampak ke settlement
Tidak mengubah mekanisme muqashshah (dua transaksi rupiah, net settlement). Hanya membatasi **apa** yang boleh masuk kanal cross-supply, bukan **bagaimana** dibayar.

---

## 4. Revisi Seed Data (menimpa asumsi distribusi di docs/06)

### Sumber & prinsip
Seed sekarang **diturunkan dari snapshot resmi panitia**, bukan sintetis murni. Semua ID, nama koperasi, wilayah, dan produk memakai baris asli; hanya deret waktu yang disintesis.

### Komposisi
1. **Koperasi & wilayah**: pakai 1.026 profil asli + join `referensi_koperasi_wilayah` + `referensi_wilayah` + `referensi_profil_desa` (populasi & dana desa untuk sizing).
2. **Katalog komoditas baku** (fitur data-quality, lihat §5): 9 komoditas inti — Beras, Beras SPHP, Gula Pasir, MinyaKita 1L, LPG 3kg, Pupuk NPK, Pupuk Urea, Telur Ayam, + 1 komoditas regional demo (mis. Beras lokal produsen). Mapping 14 varian nama MinyaKita → 1 SKU baku dipakai sebagai **contoh live** normalisasi.
3. **Baseline harga beli**: distribusi asli per komoditas (MinyaKita median 14.500, p90 17.060, max 21.000; SPHP 5kg 55.000–63.000; NPK 1.840 ±outlier 2.640; LPG median 16.000). Untuk demo Tangga Tier, koperasi baseline diambil dari baris asli yang beli di atas HET.
4. **Deret waktu konsumsi (untuk US-09)**: `barang_keluar` snapshot hanya 1 hari (8 Jul 2026) → sintesis 90 hari ke belakang per koperasi demo, konsisten dengan bauran produk & volume aslinya, dengan musiman ringan. Beri disclaimer kecil di dokumentasi (jujur = kredibel).
5. **Klaster pool demo** (dari data asli): **MinyaKita — Jawa Timur** (16 koperasi pembeli asli; tambah Banten 12 & Jabar 11 sebagai klaster kedua) dan **Pupuk NPK non-subsidi — Lampung** (14 koperasi). Skenario Tangga Tier memakai koperasi-koperasi asli ini.
6. **Skenario cross-supply demo**: pasangan **telur**: koperasi pembeli di Kaltim (baseline Rp55.000/kg, baris asli) × koperasi pemasok di kabupaten produsen ayam (whitelist asli). Alternatif: beras non-SPHP dari kabupaten produsen padi → pembeli non-produsen.
7. **Guardrail HET demo**: sertakan 2–3 baris asli pembelian di atas HET agar flag menyala saat demo.

### Yang TIDAK dipakai
Nilai agregat transaksi_penjualan (janggal), `harga_beli` = 0, baris satuan-campur tanpa normalisasi, dan data RAT/laporan keuangan (banyak nilai dummy berulang — jangan kutip).

---

## 5. Fitur Pendukung Kecil (murah, berdampak, selaras data)

1. **Katalog komoditas baku + normalisasi satuan** — prasyarat pooling engine. Konversi wajib: sak 50kg → kg, karton → pcs, tray telur → kg/butir (deklarasi satuan saat input). Ini kontribusi KoperasiHub ke kerapian data SIMKOPDES.
2. **Guardrail HET** — flag otomatis saat harga beli > HET komoditas program (MinyaKita 15.700; SPHP per zona; LPG per HET provinsi; pupuk subsidi per HET). Data membuktikan 19% koperasi membutuhkannya. Tampil sebagai badge peringatan di riwayat pembelian & memperkuat kartu rekomendasi.

---

## 6. Prep Q&A Tambahan

- **"Kenapa tidak pakai ML beneran?"** → jawaban di §2 (665 baris; heuristik transparan dulu; KoperasiHub menghasilkan data untuk ML fase 2).
- **"Cross-supply kalian sama dengan Coop Trade?"** → tidak; Coop Trade = marketplace sisi jual/ekspor; kanal kami = pengadaan antar koperasi untuk komoditas yang wilayahnya terkualifikasi sebagai pemasok, terintegrasi mesin pooling & net settlement.
- **"Bagaimana mencegah koperasi jual barang yang tidak mereka punya?"** → aturan kualifikasi pemasok berbasis `referensi_komoditas_desa` (§3) + verifikasi bertahap di roadmap.
- **"Dari mana modal kerja koperasi untuk ikut pool?"** → justru itu masalahnya: 118 pengajuan pembiayaan, baru 1 Verified. Pooling menghasilkan penghematan tanpa menunggu pencairan; term pembayaran distributor dinegosiasikan kolektif.
- **"KopHub?"** → SIMKOPDES sendiri menamai gerai sembako "Embrio KopHub"; KoperasiHub adalah lapisan yang menghubungkan embrio-embrio itu menjadi jaringan pengadaan.

---

*Addendum ini menjadi acuan Track A (business/pitch: §1, §3-alasan, §6) dan Track B (dev: §2 logika & AC, §3 validasi, §4 seed). Perbarui prompt-track-A.md & prompt-track-B.md untuk merujuk file ini.*
