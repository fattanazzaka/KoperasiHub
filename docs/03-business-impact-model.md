# KoperasiHub — Business Model & Impact Model (FINAL, terverifikasi)

**Status:** Versi terkoreksi dari draf tim (Juli 2026) setelah verifikasi data dan review
strategi. Dokumen ini adalah rujukan paling otoritatif untuk business model, impact
model, dan angka-angka di pitch deck. Jika bertentangan dengan docs/01 atau docs/02,
ikuti dokumen ini.

**Perubahan dari draf sebelumnya:**
1. Baseline fee dikoreksi: dari "harga eceran" menjadi "harga yang koperasi bayar
   sebelum pooling" (tercatat saat pengajuan demand).
2. Ilustrasi dampak jadi DUA skenario (konservatif + moderat) — skenario tunggal
   500 kg/bln terlalu kecil dan melemahkan slide dampak & keberlanjutan.
3. Istilah akad syariah dihapus dari inti model (penilaian lomba tidak terkait ekonomi
   syariah); disimpan hanya sebagai satu catatan Q&A.
4. Data jangkar diperbarui & diverifikasi per awal Juli 2026.

---

## 1. Ringkasan Produk

KoperasiHub adalah infrastruktur B2B agregasi permintaan antar-koperasi. Koperasi
kecil/baru yang tidak punya buying power bisa patungan permintaan dengan koperasi lain
untuk mencapai ambang volume yang memicu harga tier grosir dari supplier.

**Sumber suplai dalam SATU mesin pooling yang sama:**
1. Distributor/supplier umum dan BUMN pangan (beras, minyak, gas, telur, dll)
2. Koperasi lain yang surplus komoditas dari sektor unggulan daerahnya

**Framing wajib (Tema 1):** cross-supply adalah *perluasan jaringan supplier*, BUKAN
modul terpisah. Mekanismenya satu: demand matching engine yang sama, supplier slot bisa
diisi distributor atau koperasi. JANGAN pakai bahasa "membuka potensi desa" (itu bahasa
Tema 2). Tim lolos kurasi di Tema 1 — konsistensi framing dijaga di semua materi.

---

## 2. Business Model

### 2.1 Model: Success Fee, satu sisi

```
Fee = 5% × (harga baseline − harga tier yang dicapai) × volume
```

- Fee dihitung dari **penghematan yang tercipta**, bukan dari nilai transaksi.
- Pool gagal mencapai ambang tier = **tidak ada fee sama sekali**.
- **Baseline = harga yang koperasi bayar sebelum pooling**, diisi koperasi saat
  mengajukan demand (field `harga_baseline`). Fallback bila kosong: harga eceran BPS
  komoditas terkait.
- **Alasan koreksi baseline:** jika baseline dipatok harga eceran, juri bisa menggugat
  "koperasi yang sudah biasa beli semi-grosir tidak hemat sebesar itu — fee kalian
  dihitung dari penghematan yang digelembungkan." Baseline per-koperasi juga lebih
  mudah didemokan di price tier simulator (tiap koperasi melihat penghematannya
  sendiri, bukan angka rata-rata).

### 2.2 Kenapa model ini (opsi lain yang ditolak)

- **SaaS/langganan** — kontradiktif dengan tujuan produk (menghemat biaya koperasi);
  tidak masuk akal minta bayar di muka sebelum penghematan terasa.
- **Fee onboarding/rebate supplier** — tidak realistis di fase awal (cold-start, belum
  bisa menjamin volume ke supplier).
- **Hibah/subsidi pemerintah** — bukan revenue yang dikontrol tim; hanya opsi jembatan
  fase awal di roadmap. Catatan strategi pitch: jika juri menyerang keberlanjutan
  revenue awal yang kecil, jawaban yang kuat adalah "fase pilot dioperasikan sebagai
  utilitas program berbiaya rendah (potensial didukung Kemenkop/LPDB); success fee
  menjadi mesin keberlanjutan saat volume tumbuh" — bukan berpura-pura fee pilot
  sudah menghidupi platform.
- **Kredit berbasis rekam transaksi pooling** — roadmap jangka panjang, butuh volume
  data yang belum ada.

### 2.3 Satu fee saja, di sisi beli (demand side)

Platform TIDAK menarik fee dari koperasi yang berperan supplier di MVP. Alasan:
1. Menjaga narasi "platform hanya untung kalau koperasi untung duluan" tetap sederhana
   dan mudah dibela.
2. Janggal secara etos menarik untung dari koperasi surplus yang sedang dibantu dapat
   kanal jual.
Monetisasi sisi supplier = roadmap 6–12 bulan+, bukan bagian model inti yang dipitch.

### 2.4 Antisipasi pertanyaan juri (jawaban lisan)

**Q: "Model fee melawan roh koperasi (nilai balik ke anggota)?"**
A: Platform memonetisasi penghematan yang sebelumnya tidak ada. Koperasi tetap net
untung: dari setiap Rp100 penghematan, Rp95 kembali ke koperasi, platform Rp5 — dan
hanya jika penghematan benar-benar tercapai.

**Q: "Business model berubah karena ada cross-supply?"**
A: Tidak. Basis fee tetap sama (penghematan sisi beli). Cross-supply hanya menambah
satu tipe supplier ke mesin yang sama.

**Q: "Kenapa fee cuma 5%?"**
A: Filosofi tim: membantu koperasi kecil bertahan, bukan memaksimalkan take-rate.
Angka kecil menjaga penghematan yang dirasakan koperasi tetap signifikan.

**Q (jika ditanya sisi syariah — opsional, jangan proaktif):** fee kontingen atas
keberhasilan berbentuk **ju'alah** (Fatwa DSN-MUI No. 62/DSN-MUI/XII/2007), bukan
wakalah bil ujrah (yang mensyaratkan ujrah pasti di muka). Cukup jawaban lisan;
tidak perlu ada di UI/deck.

---

## 3. Impact Model

### 3.1 Dampak dua arah

- **Sisi demand (pembeli):** koperasi hemat karena beli borongan bersama, memotong
  lapisan markup distribusi.
- **Sisi supply (koperasi surplus):** koperasi produsen dapat kanal jual untuk hasil
  yang sebelumnya terjual murah ke tengkulak atau tidak terserap.
- **Multiplier effect:** uang berputar di dalam jaringan koperasi, tidak bocor ke luar
  ekosistem. Nyambung ke kerangka NPV/IRR/BCR/SROI (Nurkholis), konsep value leakage
  (Irwanda), dan analogi Amul (Rama) — ~85% nilai kembali ke petani/anggota karena
  rantai nilai tertutup.

### 3.2 Ilustrasi dampak — Beras (data BPS Mei 2026, terverifikasi)

**Harga (BPS, rilis 2 Juni 2026):**
- Penggilingan: Rp13.765/kg
- Grosir: Rp14.574/kg
- Eceran: Rp15.358/kg
- Selisih eceran→grosir: **Rp784/kg (~5,1%)**; eceran→penggilingan: **Rp1.593/kg (~10,4%)**

**Kenapa beras jadi komoditas utama:** BPS mempublikasikan tiga tingkat harga sekaligus
setiap bulan — data paling bersih dan paling bisa dipertanggungjawabkan. Bonus narasi:
tersedia DUA ambang tier alami (grosir, lalu penggilingan) yang persis cocok dengan
mekanik price tier simulator.

**Dua skenario (WAJIB disajikan berdampingan, dengan label asumsi):**

| Skenario | Asumsi volume | Penghematan kolektif (20 koperasi, tier grosir) |
|---|---|---|
| Konservatif | 500 kg/koperasi/bulan (asumsi tim, data granular belum tersedia publik) | Rp7,84 juta/bulan ≈ Rp94 juta/tahun |
| Moderat | 6.000 kg/koperasi/bulan (basis observasi gerai KDMP ~2 kuintal/hari, pemberitaan skema cash-and-carry Bulog) | Rp94 juta/bulan ≈ **Rp1,13 miliar/tahun per klaster** |

Fee platform 5% dari penghematan: Rp392 ribu/bln (konservatif) vs Rp4,7 juta/bln
(moderat) per klaster 20 koperasi — keberlanjutan platform datang dari **jumlah
klaster**, bukan dari menaikkan fee. 100 klaster skenario moderat ≈ Rp470 juta/bln.

**Transparansi wajib:** kedua angka volume adalah asumsi/estimasi berbasis sumber yang
disebut, bukan data resmi granular. Nyatakan terbuka di deck — menunjukkan tim
truth-seeking.

**Rumus SROI (kerangka mentor Suci):**
```
SROI = (jumlah koperasi terdampak × penghematan per koperasi × nilai per satuan)
       ÷ biaya/investasi platform
```

### 3.3 TAM / SAM / SOM

- **TAM:** 83.383 KDMP berbadan hukum secara nasional (SIMKOPDES per 29 Juni 2026).
- **SAM:** koperasi baru/kecil tanpa buying power memadai — realitasnya hampir semua:
  baru 1.061 unit yang beroperasi.
- **SOM:** pilot 1 koridor wilayah/kabupaten (mis. klaster kabupaten di Jatim/Jateng,
  lokasi 1.061 unit pertama beroperasi).

### 3.4 Data jangkar problem statement (TERVERIFIKASI awal Juli 2026)

- **83.383 KDMP berbadan hukum** (SIMKOPDES per 29 Juni 2026) — tapi baru **1.061 unit
  beroperasi** (530 Jatim + 531 Jateng; diresmikan Presiden di Nganjuk 16 Mei 2026;
  dikonfirmasi Menkop di Raker Komisi VI DPR 11 Juni 2026: "Yang sudah operasional
  baru 1.061").
- **Target dipangkas 50%:** dari 80.000 menjadi maksimal 40.000 unit hingga akhir 2026
  — diumumkan Menkop Ferry Juliantono, Raker Komisi VI DPR RI, Kamis 11 Juni 2026.
  Alasan resmi: kendala lahan (terutama perkotaan), pasokan stok barang, dan kesiapan
  model bisnis. (Menko Pangan Zulkifli Hasan, 5 Juli 2026: 40.000 rampung September,
  beroperasi Oktober 2026.)
- **Kutipan jangkar (Menkop Ferry, raker yang sama):** indikator kualitas operasional
  mencakup "kesanggupan unit Kopdes Merah Putih untuk menjual barang dengan harga yang
  lebih murah, terutama untuk barang-barang yang mendapat subsidi" (LPG 3 kg, minyak,
  beras disebut sebagai barang subsidi dimaksud).
  → **Framing pitch:** harga murah bukan sekadar value proposition KoperasiHub —
  itu KPI resmi program pemerintah. KoperasiHub adalah alat mencapai KPI tersebut.
- **Angka "795 unit bertransaksi": BELUM TERVERIFIKASI.** Jangan dipakai di deck/UI
  kecuali tim memegang tautan sumber SIMKOPDES-nya. Alternatif aman: pakai 1.061
  beroperasi vs 83.383 berbadan hukum (gap 98,7% belum operasional — cukup dramatis).

### 3.5 Preseden kebijakan arah dua-arah (untuk roadmap/visi, BUKAN klaim fitur MVP)

- **Kerja Sama Antar Daerah (KAD), Bank Indonesia** — model surplus-defisit antar
  daerah yang sudah berjalan (kini di bawah GPIPS 2026).
- **Misi Dagang Jawa Timur** — pola dua arah "Jatim Jual + Jatim Beli", puluhan misi
  dagang domestik dengan nilai komitmen kumulatif puluhan triliun rupiah.
Pakai di bagian roadmap/visi; jangan diklaim sebagai fitur yang sudah jalan.

---

## 4. Roadmap Monetisasi & Skala (fase lanjut, bukan MVP)

| Fase | Fokus |
|---|---|
| 0–3 bulan | Pilot 1 koridor kabupaten dengan mekanisme anchor coop; onboarding koperasi awal + supplier distributor; opsi dukungan Kemenkop/LPDB sebagai utilitas program |
| 3–6 bulan | Ekspansi koridor lain; perluas jaringan koperasi-sebagai-supplier |
| 6–12 bulan | Integrasi data SIMKOPDES penuh; kaji monetisasi sisi supplier & skala cross-supply antar-daerah |

---

## 5. Sumber Data (untuk sitasi deck/dokumen)

- BPS — harga beras penggilingan/grosir/eceran Mei 2026 (rilis 2 Juni 2026):
  Rp13.765 / Rp14.574 / Rp15.358 per kg.
- Raker Komisi VI DPR RI, 11 Juni 2026 — Menkop Ferry Juliantono: pemangkasan target ke
  40.000; 1.061 beroperasi; indikator harga murah barang subsidi.
- SIMKOPDES via Kemenkop RI — 83.383 KDMP berbadan hukum (per 29 Juni 2026).
- Sekretariat Presiden — peresmian 1.061 KDMP, Nganjuk, 16 Mei 2026.
- Menko Pangan Zulkifli Hasan, Makassar, 5 Juli 2026 — target 40.000 beroperasi Okt 2026.
- Permendag No. 18/2024 — struktur tier harga MinyaKita.
- Bank Indonesia — Kerja Sama Antar Daerah (KAD)/GPIPS.
- Materi mentor kompetisi: Nurkholis (NPV/IRR/BCR/SROI), Suci Sutjipto (anatomi pitch
  deck, rumus SROI), Rama Mamuaya (analogi Amul, kerangka roadmap), Irwanda (value
  leakage).

## 5-bis. Diferensiasi resmi: Coop Trade (temuan Jul 2026)

`trade.simkopdes.go.id` (Coop Trade) adalah platform resmi Kemenkop untuk menjual produk
koperasi ke pasar global — marketplace RFQ bilateral, arah ekspor/jual, TANPA pooling.
KoperasiHub berbeda arah (hulu/beli, agregasi kolektif) sehingga komplementer, bukan
bersaing. Ini menutup pertanyaan juri "apa bedanya dengan yang sudah ada di SIMKOPDES?".
Detail + jawaban siap-pakai ada di `docs/01` bagian C-bis.

## 6. Checklist validasi tersisa untuk tim

- [ ] Verifikasi ulang harga BPS terbaru (rilis Juni/Juli 2026) H-1 sebelum pitching.
- [ ] Cari/simpan sumber angka "795 bertransaksi" — atau coret dari semua materi.
- [ ] Konfirmasi final fee 5% (ujung bawah range 5–10% yang didiskusikan tim).
- [ ] Sinkronkan angka di deck = angka di seed data demo (keluarga angka BPS untuk
      beras; Permendag untuk MinyaKita). Juri tidak boleh melihat dua angka berbeda
      untuk hal yang sama.
