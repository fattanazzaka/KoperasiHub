# Laporan Riset & Strategi Kemenangan: Rekonstruksi "KoperasiHub" untuk Final Hackathon Digital Cooperatives Expo 2026

## TL;DR
- **Ide demand pooling Anda benar secara ekonomi tapi salah posisi.** Reposisi dari "KoperasiHub, marketplace agregasi" menjadi **"lapisan pengadaan bersama (shared procurement layer) resmi untuk Koperasi Desa Merah Putih"** yang menutup celah nyata: 80.000+ KDMP dibangun tapi masing-masing membeli sendiri sebagai "pembeli kecil" sehingga kalah harga dari Indomaret/Alfamart. Tidak ada platform pooling antar-koperasi yang beroperasi — novelty Anda kokoh.
- **Framing yang menang di mata juri Kemenkop + PEBS FEB UI:** posisikan sebagai infrastruktur pendukung program prioritas Presiden (Kopdes Merah Putih), terintegrasi dengan SIMKOPDES, dengan angle koperasi sekunder/Apex digital + prinsip syariah (akad musyarakah/wakalah bil ujrah untuk pembelian kolektif). Metrik dampak inti: penghematan **Rp1.000/liter (~7%) MinyaKita** dan **~Rp700/kg (~6-7%) beras** per lapis distribusi, dengan estimasi agregat 12-20% HPP.
- **MVP realistis untuk 1 fullstack dev / 24-36 jam:** Next.js + Supabase, 4 layar inti (demand matching engine, price tier simulator, split-order, skor reputasi), seed data 20-30 KDMP meniru struktur SIMKOPDES, akun juri disiapkan. Jangan bangun logistik/pembayaran riil — mock dengan narasi integrasi.

## Key Findings

### 1. Konteks program: peluang emas ada di "volume usaha", bukan digitalisasi administrasi
- **Skala masif tapi rapuh:** Per data SIMKOPDES 29 Juni 2026, terdapat **83.383 unit** Kopdes Merah Putih terdaftar secara kelembagaan; 79.704 punya akun, 80.979 punya NPWP, 60.762 punya NIB, tapi baru 50.383 sudah RAT. Target operasional bergeser berkali-kali (dari 80.000 → fokus 40.000 unit beroperasi Oktober 2026).
- **Masalah inti yang diakui pemerintah & kritikus:** KDMP kalah daya tawar beli vs ritel modern. Analisis publik menyebut "Kopdes, jika tidak memiliki pusat distribusi yang terintegrasi nasional, hanya akan menjadi 'pembeli kecil'... harga jual di Kopdes akan lebih mahal dari minimarket modern." Anggota Komisi VI DPR Darmadi Durianto (Fraksi PDI-P), dalam Rapat Kerja dengan Kementerian Koperasi pada Kamis 11 Juni 2026, memperingatkan: "diperkirakan banyak KDMP yang akan mangkrak, Pak. Mangkrak. Bahkan sudah jalan, bangkrut. Kalau sehari hanya dapat sekian rupiah, Rp1 juta atau Rp500.000, ya lama-lama bangkrut, Pak."
- **Inilah celah tepat untuk demand pooling:** jika satu KDMP 500 anggota tak dilirik pabrik/prinsipal, gabungan puluhan KDMP se-kabupaten setara distributor menengah dengan bargaining power kolektif.

### 2. Novelty terkonfirmasi: belum ada platform pooling antar-koperasi yang beroperasi
- Model pemerintah saat ini adalah **supply push top-down** dari BUMN (Bulog, ID FOOD, Agrinas) ke tiap koperasi secara individual sebagai "outlet" — BUKAN agregasi permintaan bottom-up yang dikendalikan koperasi. Kepala Bapanas Arief Prasetyo Adi (13 Juli 2025): "Kopdes Merah Putih ini akan menjadi outlet dari Badan Pangan Nasional, Bulog, dan ID FOOD."
- Platform digitalisasi koperasi eksisting (Smartcoop, eKoperasi, Alokop, dll.) semuanya **single-cooperative system** (akuntansi, simpan pinjam, POS, manajemen anggota). Smartcoop misalnya positioning-nya "core banking koperasi" dengan fitur laporan keuangan SAK-EP, simpan pinjam, toko — tidak ada mekanisme kolaborasi horizontal antar-koperasi untuk pengadaan.
- Ide pooling antar-koperasi hanya ada sebagai **konsep/gagasan** (mis. usulan pembentukan PUSKOP/koperasi sekunder se-Kota Pekalongan yang mengklaim penghematan HPP 12-20% melalui agregasi grosir lintas kelurahan), belum pernah dibangun sebagai produk. SIMKOPDES memusatkan DATA kelembagaan, bukan PENGADAAN teragregasi.

### 3. Angka business case sudah tervalidasi dari sumber resmi
- **MinyaKita (tier diatur Permendag No. 18 Tahun 2024, per Ombudsman/Kemendag):** Produsen→D1 Rp13.500/L; D1→D2 Rp14.000/L; D2→pengecer Rp14.500/L; HET konsumen Rp15.700/L. Warung/koperasi yang beli dari D2 (Rp14.500) vs harga D1 (Rp13.500) = gap **Rp1.000/L (~7%)**. Di lapangan gap nyata jauh lebih besar: anggota Ombudsman RI Yeka Hendra Fatika, dalam konferensi pers di Kemendag 21 Maret 2025, menyatakan "Harga meningkat kurang lebih rata-rata Rp2.000 per liternya. Jadi konsumen harus membayar kurang lebih berkisar antara Rp16.000 di paling rendah, paling tertinggi Rp19.000" (dari uji petik 63 sampel di 6 provinsi, rerata Rp17.769/L, diduga akibat rantai D3/D4 tak terdaftar).
- **Beras SPHP (Bapanas 2026):** gudang Bulog ~Rp11.000/kg → distributor downline ~Rp11.700/kg → konsumen (HET zona 1) Rp12.500/kg = gap **~Rp700/kg (~6,4%)** per lapis. Beras SPHP zona 2 Rp13.100/kg, zona 3 Rp13.500/kg.
- **Benchmark internasional GPO:** Menurut Healthcare Supply Chain Association, GPO memangkas biaya pasokan "10 to 18% compared to prices that facilities would negotiate independently"; laporan Dobson DaVanzo 2018 memberi angka presisi: "GPOs reduce supply-related purchasing costs to hospitals and nursing homes by 13.1 percent," menghemat sistem kesehatan AS US$34,1 miliar pada 2016. Ini jangkar kredibel bahwa penghematan 12-20% realistis.
- **Omzet & anggota KDMP riil:** contoh omzet harian Rp2,5-5 juta (Gempolkerep, 250 anggota); Metuk Rp125 juta/2 minggu (700 anggota); Bentangan Rp100 juta/bulan pertama (skema konsinyasi dari Bulog & Pupuk Indonesia); Kab. Bandung 209 KDMP yang sudah RAT membukukan total volume usaha Rp9,37 miliar. Beras yang disiapkan ~2 kuintal/hari per gerai (cash and carry dari Bulog).

### 4. Juri & framing politik
- **Menteri Koperasi Ferry Juliantono** (dilantik 8 Sep 2025 menggantikan Budi Arie): latar aktivis ekonomi kerakyatan, mantan tahanan politik 2008, Ketua Umum Dewan Tani Indonesia, Ketua Umum Inkoppas, Wakil Ketua Umum Dekopin, Sekjen Syarikat Islam (2021-2026), Wakil Ketua Umum Gerindra. Kuat mendorong digitalisasi & rebranding koperasi. Menekankan "Kopdeskel ini badan usaha, bukan hanya program sosial... ukuran keberhasilan harus untung." Indikator keberhasilannya: harga barang subsidi (LPG 3kg, minyak, beras, pupuk) harus lebih murah di KDMP.
- **PEBS FEB UI** = Pusat Ekonomi dan Bisnis Syariah (berdiri 2006, Kepala Rahmatina A. Kasri), center of excellence riset ekonomi & keuangan syariah. Ada angle syariah yang sangat relevan: pembelian kolektif via akad **musyarakah** (patungan modal beli bersama) / **wakalah bil ujrah** (hub sebagai wakil pembeli dengan fee/ujrah), menghindari riba, sesuai semangat **ta'awun** (tolong-menolong/gotong royong) yang selaras jati diri koperasi.
- Prioritas politik 2026: Kopdes Merah Putih adalah program prioritas Presiden Prabowo (Inpres 9/2025 & 17/2025, bagian Asta Cita menuju Indonesia Emas 2045). Posisikan solusi Anda sebagai enabler agar investasi negara Rp240 triliun tidak mangkrak.

## Details

### A. Kebijakan & regulasi kunci (untuk slide Problem & kredibilitas)
- **Inpres No. 9/2025** (27 Mar 2025): percepatan pembentukan 80.000 Kopdes/Kel Merah Putih. **Inpres No. 17/2025** (22 Okt 2025): percepatan pembangunan fisik gerai/gudang/kelengkapan, pelaksana PT Agrinas Pangan Nusantara.
- **Pembiayaan:** plafon Rp3 miliar/unit dari Himbara, bunga tetap 6%/tahun, tenor 72 bulan, grace period 6-8 bulan. Skema disesuaikan: Rp2,5 miliar capex + Rp500 juta opex. Total kebutuhan ~Rp240 triliun; pemerintah menempatkan ~Rp200 triliun di Himbara. Pengajuan via proposal bisnis lewat akun SIMKOPDES. PMK 49/2025 (kemudian dicabut/disesuaikan) awalnya mengatur skema pinjaman. Dana Desa 2026 dialihkan 58,03% (Rp34,57 triliun dari pagu Rp60,57 triliun) untuk mendukung KDMP via PMK 7/2026 — kebijakan yang menuai polemik penolakan kepala desa.
- **7 gerai wajib:** kantor koperasi, gerai sembako, unit simpan pinjam, klinik desa, apotek desa, cold storage/gudang, logistik.
- **UU Koperasi:** revisi UU No. 25/1992 sedang berjalan; RUU Perkoperasian memuat ketentuan **koperasi sekunder & fungsi Apex** serta **pengintegrasian horizontal** antar koperasi primer (Pasal 43H-43K draf) — landasan hukum kuat untuk model pooling Anda. Permenkum 13/2025 mengesahkan KDMP sebagai badan hukum sah.
- **SIMKOPDES:** Sistem Informasi Manajemen Koperasi Desa/Kelurahan. Per 21 Nov 2025, 76.733 koperasi (92,69%) punya akun. Modul: dashboard nasional + microsite per koperasi, kelembagaan (jumlah anggota/pengurus/pengawas/badan hukum/titik lokasi lahan), core system operasional (kasir/gudang/transaksi/simpan pinjam/laporan keuangan), terintegrasi data pajak, Dukcapil (Kemendagri), dana desa, dan lahan dari Agrinas. **Tidak ada API publik** yang terdokumentasi; data hackathon disediakan via folder Google Drive "Aset Database" (s.simkopdes.go.id/database-hackaton). Situs bersifat non-transaksional. Pengawasan tata kelola juga lewat aplikasi "Jaga Desa" (Kejaksaan).

### B. Rantai pasok sembako & peran BUMN
- Struktur tier: produsen → D1 (distributor besar/lini 1) → D2 (subdistributor) → D3/agen/pengecer → konsumen. Makin panjang rantai, makin besar selisih harga. Per BPS, marginal price to producer (MPP) total: gula ~25,86% (rantai terpanjang, 4 lapis), beras ~21,47%, telur ~20,19%, minyak goreng ~17,41%.
- BUMN pangan sudah jadi pemasok KDMP: Bulog (beras SPHP, kuota ~2 ton/pengambilan/unit; gula & minyak tanpa batas), ID FOOD & anak usaha (Rajawali Nusindo sembako, Berdikari daging/telur, PPI benih/pestisida, Perikanan Indonesia, BGR Logistics transportasi/penyimpanan), Pupuk Indonesia, PT Pos, PTPN/Sinergi Gula Nusantara (minyak/gula). KDMP juga jadi offtaker gabah/jagung di bawah HAP, dan saluran bansos PKH.
- **Implikasi strategis:** solusi Anda tidak menggantikan BUMN — ia **mengagregasi permintaan KDMP menjadi PO besar terkonsolidasi** yang bisa diarahkan ke D1/prinsipal/BUMN, memberi KDMP tier harga terbaik dan memberi supplier order yang predictable. Ini justru mewujudkan intent Menteri Ferry: "beli langsung dari pabrikan/prinsipal besar" — yang saat ini masih pernyataan intent, belum ada sistemnya.

### C. Pelajaran dari kegagalan B2B warung (untuk antisipasi pertanyaan juri)
- **Ula tutup 2023** (empat co-founder: Nipun Mehra/CEO, Alan Wong/CTO, Derry Sakti/CCO, Riky Tenggara/COO; melayani 70.000-100.000+ warung terutama Jawa Timur). Raised total US$140,6 juta dalam setahun; Bezos Expeditions ikut di Series B US$87 juta (Okt 2021). Gagal mempertahankan model B2B asset-heavy; wind down mengembalikan ~30% modal, sisa kas ~US$50 juta. **Warung Pintar** diakuisisi Sirclo lalu berhenti beroperasi. **GoToko** (GoTo-Unilever) tutup Mei 2023. **GudangAda** pivot ke SaaS (GudangAda Solusi).
- **Pelajaran:** model asset-heavy (beli-simpan-kirim inventory) membakar modal, logistik 17.000 pulau mahal, margin tipis, edukasi warung sulit. **Solusi Anda harus asset-light**: hanya mengagregasi & mencocokkan permintaan, TIDAK memegang inventory. Logistik last-mile memanfaatkan gudang/cold storage & kendaraan logistik KDMP yang SUDAH didanai negara (Rp2,5 miliar capex/unit) + jaringan BGR/Pos. Ini keunggulan struktural yang tak dimiliki startup manapun — dan pembeda utama dari kisah gagal Ula/Warung Pintar.

### C-bis. Temuan ekosistem SIMKOPDES resmi (hasil pembacaan langsung link TOR, Jul 2026)
> Catatan: nama produk final adalah **KoperasiHub** (bukan "SentraKop"); angle syariah
> sudah dide-prioritaskan karena penilaian lomba tidak terkait ekonomi syariah.

- **Coop Trade (`trade.simkopdes.go.id`) — kompetitor resmi paling dekat, TAPI justru
  mempertajam diferensiasi.** Positioning-nya menghubungkan produk unggulan koperasi ke
  pasar global (arah EKSPOR/JUAL). Alur: cari produk → ajukan RFQ → negosiasi & kontrak
  bilateral (L/C, T/T) → kirim. Ini **marketplace RFQ satu-lawan-satu**, TANPA mekanisme
  agregasi permintaan/pooling/ambang volume kolektif. KoperasiHub adalah kebalikan
  arahnya: sisi HULU/BELI (pengadaan) dengan model AGREGASI KOLEKTIF — celah yang kosong
  bahkan di ekosistem resmi Kemenkop.
  - **Jawaban juri siap-pakai** ("Kemenkop sudah punya Coop Trade, apa bedanya?"):
    "Coop Trade adalah marketplace RFQ untuk menjual produk koperasi ke pasar global —
    arah ekspor, transaksi bilateral. KoperasiHub kebalikannya: infrastruktur pengadaan
    yang mengagregasi permintaan banyak koperasi agar mencapai harga grosir. Coop Trade
    tidak punya mekanisme pooling volume. Kami melengkapi ekosistem SIMKOPDES di sisi
    yang belum tergarap — hulu pengadaan, bukan hilir penjualan. Bahkan koperasi
    produsen di Coop Trade bisa menjadi supplier di pool kami."
- **Status akses 6 sumber data TOR (dicek langsung):**
  - `/pers/dashboard` & `/pers/kelembagaan` — PUBLIK, terbaca. Dashboard statistik
    agregat per-provinsi. Field resmi: Berbadan Hukum, Telah Memiliki Akun, NPWP, NIB,
    Simpanan Pokok, Simpanan Wajib, Volume Transaksi (2026), Nilai Transaksi (2026),
    Pemetaan Lahan %, Pembangunan Gerai %. → dipakai sebagai skema field seed data.
  - `/pers/rat` — PUBLIK. Field: RAT Dilaporkan, Diverifikasi Dinas, Sedang Melaksanakan,
    Belum Melaksanakan (per provinsi).
  - `/pers/ews/kesehatan-keuangan` — PUBLIK sebagian ("Laporan Kesehatan Keuangan
    Koperasi"). Bisa jadi basis narasi "skor kelayakan pooling" (roadmap).
  - `/pers/transaksi/bisnis` — LOGIN-GATED, tidak bisa diakses publik.
  - Folder Drive `s.simkopdes.go.id/database-hackaton` ("Aset Database") — KOSONG
    (dikonfirmasi tim). Tidak ada dataset granular yang bisa dipakai.
  - **Implikasi:** semua data publik = statistik agregat nasional, BUKAN transaksi
    per-koperasi. Keputusan arsitektur "tiru skema, jangan janjikan integrasi
    real-time" adalah benar dan defensible.
- **Peluang fitur (memperkuat Relevansi):** status RAT + EWS kesehatan keuangan + NIB
  bisa menjadi basis "skor kelayakan/anchor pool" berbasis data resmi (bukan angka
  mengarang). Tetap P2/mock di MVP, tapi narasinya kuat.

### D. Diagnosis jujur kelemahan fatal ide awal
1. **Positioning "setara Indomaret/Alfamart" adalah jebakan.** Juri akan langsung tanya: entitas hukum pembeli kolektif siapa? Siapa yang tanda tangan kontrak dengan supplier? Jawaban lemah = kalah. **Solusi:** bersandar pada koperasi sekunder/PUSKOP (sudah ada dasar di RUU Perkoperasian, fungsi Apex & pengintegrasian horizontal) sebagai badan hukum pool; platform Anda = tools digitalnya.
2. **Nama "KoperasiHub" generik & tak menandakan program prioritas.** Tidak mengikat ke Kopdes Merah Putih/SIMKOPDES — kehilangan poin framing politik.
3. **Cold start problem tak terjawab.** Pool butuh massa kritis KDMP untuk capai tier. **Solusi:** mulai dari klaster per-kabupaten yang sudah ada (mis. 209 KDMP Kab. Bandung yang sudah RAT), bukan nasional; manfaatkan struktur dinas koperasi kabupaten/kota.
4. **Risiko dianggap "hanya dashboard/marketplace."** Diferensiasi harus tajam: bukan katalog belanja (itu sudah dilakukan RPK Bulog/GudangAda), tapi **mesin agregasi ambang volume + split order proporsional + skor reputasi partisipasi** — mekanisme kolaborasi horizontal yang belum ada di manapun.
5. **Default risk & komitmen kolektif.** Jika satu KDMP mundur setelah pool terbentuk, tier bisa gagal & merugikan peserta lain. **Solusi:** skor reputasi + commitment window (jendela komit sebelum PO dikunci) + verifikasi via SIMKOPDES (NIB/badan hukum) + pembayaran escrow/termin.

### E. Rekomendasi rekonstruksi ide final
- **Nama:** rekomendasi utama **"SentraKop — Sentra Pengadaan Bersama Koperasi Desa Merah Putih"** (alternatif: "KolektaDesa", "Pooling Merah Putih/PMP"). Pilih yang menautkan eksplisit ke KDMP.
- **Positioning:** Infrastruktur/lapisan pengadaan kolektif digital yang mengubah ribuan KDMP terisolasi menjadi satu kekuatan beli setara distributor, terintegrasi SIMKOPDES, berbasis prinsip koperasi sekunder & syariah (ta'awun).
- **Narasi (one-liner):** "80.000 Koperasi Merah Putih membeli sendiri-sendiri dengan harga eceran. SentraKop menggabungkan permintaan mereka agar membeli dengan harga distributor — menyelamatkan margin, mencegah gerai mangkrak, dan mewujudkan janji harga murah Presiden."
- **Fitur MVP (4 inti):** (1) Demand matching engine per kategori barang/wilayah/jendela waktu; (2) Price tier simulator (progress bar menuju ambang harga grosir berikutnya + rupiah yang dihemat); (3) Split-order otomatis alokasi proporsional + generate PO konsolidasi; (4) Skor reputasi partisipasi koperasi. Pembeda tambahan: badge "terverifikasi SIMKOPDES", simulasi dampak ke SHU per anggota.
- **Business model:** fee wakalah/administrasi tipis per transaksi terkonsolidasi (mis. 0,5-1%, jauh di bawah margin distributor 6-7% yang dihemat) — halal secara syariah (wakalah bil ujrah), tidak membebani koperasi. Alternatif: didanai sebagai infrastruktur publik Kemenkop/LPDB (non-profit utility).
- **Metrik dampak konkret (untuk slide):** Contoh 1 klaster 30 KDMP × rata-rata beli 2 kuintal beras/hari = 6 ton/hari; hemat Rp700/kg = **Rp4,2 juta/hari** ≈ **Rp1,53 miliar/tahun** dikembalikan ke anggota via SHU/harga lebih murah. Untuk MinyaKita: pool naik dari tier D2 (Rp14.500) ke D1 (Rp13.500) hemat Rp1.000/L. Skala nasional (jika 40.000 KDMP beroperasi), potensi penghematan ratusan miliar hingga triliunan rupiah/tahun.

## Recommendations

### Tahap 1 — Sebelum sprint (persiapan, orang model bisnis)
1. Kunci narasi "shared procurement layer untuk KDMP", siapkan slide Problem berbasis 3 data keras: (a) 83.383 KDMP tapi banyak omzet Rp500rb-1jt/hari & terancam mangkrak (kutipan Darmadi Durianto, DPR, 11 Juni 2026); (b) gap harga D1-D2 Rp1.000/L MinyaKita (Permendag 18/2024) & ~Rp700/kg beras SPHP; (c) benchmark GPO healthcare AS hemat 13,1% (Dobson DaVanzo 2018/HSCA).
2. Siapkan jawaban 5 pertanyaan maut juri:
   - *Entitas hukum pembeli kolektif?* → Koperasi sekunder/Apex per RUU Perkoperasian (Pasal 43H-43K); platform hanya alat.
   - *Kenapa koperasi sekunder/pembelian bersama dulu gagal?* → Dulu manual, tanpa transparansi digital, tanpa massa KDMP terverifikasi. Kini pertama kali ada 80rb+ unit berbadan hukum + SIMKOPDES + mandat politik.
   - *Logistik last-mile?* → Asset-light; pakai gudang/cold storage/kendaraan KDMP yang sudah didanai Rp2,5 miliar/unit + jaringan BGR/Pos. Belajar dari kegagalan Ula (asset-heavy bakar modal).
   - *Default risk?* → Skor reputasi + commitment window + escrow + verifikasi SIMKOPDES.
   - *Cold start?* → Mulai per-kabupaten (klaster nyata seperti 209 KDMP Kab. Bandung), bukan nasional.
3. Siapkan angle syariah eksplisit (musyarakah/wakalah bil ujrah, ta'awun) — ini "tiket emas" ke hati PEBS FEB UI.

### Tahap 2 — Selama sprint (fullstack dev)
4. **Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Row-Level Security untuk multi-tenant sederhana) + Tailwind/shadcn + deploy Vercel. Bangun sebagai PWA agar bisa diakses "APK-like" di HP juri. Tercepat untuk 1 dev dalam 24-36 jam.
5. **Scope yang DIBANGUN (real):** 4 layar inti + login multi-role (koperasi, admin hub, supplier-view). **Yang DI-MOCK:** pembayaran, logistik tracking, integrasi SIMKOPDES real-time (tampilkan sebagai "terhubung SIMKOPDES" dengan data seed meniru skema kelembagaan/transaksi dari dataset panitia).
6. **Seed data meyakinkan:** 20-30 KDMP fiktif tapi realistis (nama desa nyata, jumlah anggota 250-700, provinsi, komoditas beras/gula/minyak) mengikuti field SIMKOPDES (NIB, badan hukum, kelembagaan). Buat 2-3 pool aktif dengan progress berbeda (mis. satu pool 85% menuju tier D1) agar demo hidup dan menunjukkan "wow moment".
7. Siapkan **akun uji juri** (mis. juri@sentrakop.id / demo123) dengan data sudah terisi; README.md lengkap (arsitektur, cara run, kredensial, disclosure AI). Cantumkan disclosure penggunaan AI sesuai aturan TOR.

### Tahap 3 — Pitching (5% nilai tapi penentu tie-break)
8. Buka dengan hook harga (tunjukkan struk: koperasi beli MinyaKita Rp14.500 vs harusnya Rp13.500 di tier D1). Demo live price tier simulator (fitur paling "wow"). Tutup dengan dampak SHU per anggota + peta jalan integrasi SIMKOPDES/LPDB.
9. Live defense orisinalitas: tekankan tim yang menemukan mekanisme inti (agregasi ambang + split order + reputasi), AI hanya untuk coding/aset pelengkap.

### Benchmark yang mengubah rekomendasi
- Jika juri menekankan "jangan saingi BUMN": pertajam sebagai enabler BUMN (order konsolidasi ke Bulog/ID FOOD/prinsipal), bukan pesaing.
- Jika ada tim lain bawa ide pooling serupa: menangkan lewat kedalaman eksekusi MVP + kualitas seed data + angle syariah + integrasi SIMKOPDES yang eksplisit.
- Jika juri ragu soal legalitas: rujuk langsung Pasal 43H-43K RUU Perkoperasian tentang integrasi horizontal & fungsi Apex.

## Outline dokumen lengkap (README/dokumen teknis)
1. Ringkasan eksekutif & problem statement (data KDMP + gap harga)
2. Solusi & mekanisme (agregasi ambang, tier simulator, split-order, reputasi)
3. Arsitektur teknologi & rencana integrasi SIMKOPDES
4. Model bisnis & kelayakan syariah (wakalah bil ujrah/musyarakah)
5. Analisis dampak (perhitungan penghematan Rp/tahun & SHU per anggota)
6. Peta jalan implementasi (pilot klaster kabupaten → provinsi → nasional)
7. Manajemen risiko (default, cold start, entitas hukum, komitmen)
8. Profil tim & disclosure penggunaan AI

## Outline pitch deck 10-12 slide
1. **Cover** — nama (SentraKop), tagline, tim, Tema 1 (Peningkatan Volume Usaha Koperasi).
2. **Problem** — 83.383 KDMP, "pembeli kecil", omzet Rp500rb-1jt/hari, ancaman mangkrak (kutipan Darmadi Durianto DPR).
3. **Problem finansial** — gap harga D1-D2 (Rp1.000/L MinyaKita, ~Rp700/kg beras), rantai distribusi berlapis (data BPS: gula 25,86%).
4. **Insight/Why now** — Inpres 9 & 17/2025, 80rb KDMP berbadan hukum + SIMKOPDES = massa kritis pertama kali tersedia dalam sejarah.
5. **Solution** — SentraKop shared procurement layer (diagram: banyak KDMP → pool → 1 PO besar → supplier/BUMN/prinsipal).
6. **Product demo** — 4 fitur inti (screenshot price tier simulator sebagai hero shot).
7. **Diferensiasi & Novelty** — tabel vs Smartcoop/RPK Bulog/GudangAda; klaim: satu-satunya horizontal pooling antar-koperasi; pelajaran dari Ula/Warung Pintar (asset-light).
8. **Business & Impact Model** — fee wakalah bil ujrah, kelayakan syariah (ta'awun), perhitungan hemat Rp1,53 miliar/tahun/klaster + dampak SHU per anggota.
9. **Integrasi ekosistem** — SIMKOPDES, Bulog/ID FOOD, LPDB, koperasi sekunder/Apex (RUU Perkoperasian).
10. **Roadmap & kemudahan implementasi** — pilot kabupaten → provinsi → nasional; low-cost, asset-light.
11. **Team & AI disclosure.**
12. **Closing** — visi: mewujudkan janji "harga lebih murah" Presiden & menyelamatkan investasi negara Rp240 triliun agar KDMP tak mangkrak.

## Caveats
- Beberapa proyeksi omzet KDMP nasional (mis. total Rp1.093 triliun, penghematan agregat, laba Rp87 triliun) berasal dari estimasi pengamat (Suroto/AKSES) — gunakan sebagai proyeksi bernuansa, bukan fakta terverifikasi.
- Klaim penghematan 12-20% HPP berasal dari artikel advokasi konsep PUSKOP Pekalongan, bukan data audit — sajikan sebagai estimasi proponen yang dijangkar benchmark GPO internasional (HSCA 13,1%/Dobson DaVanzo 2018).
- Angka harga komoditas fluktuatif; verifikasi ulang di PIHPS (bi.go.id/hargapangan) / Panel Harga Bapanas / SP2KP Kemendag menjelang hari-H.
- SIMKOPDES tidak punya API publik terkonfirmasi; rancang MVP di sekitar dataset Google Drive "Aset Database" yang disediakan panitia, jangan janjikan integrasi real-time yang belum tentu tersedia.
- Modul RAT & EWS kesehatan keuangan tidak terkonfirmasi sebagai modul publik SIMKOPDES bernama; kemungkinan berupa field dalam dataset hackathon — cek dataset panitia lebih dulu.
- Pernyataan Menteri Ferry soal "beli langsung dari prinsipal" adalah intent kebijakan, bukan sistem yang sudah berjalan — justru memperkuat urgensi & timing solusi Anda.
- Target jumlah & tanggal operasional KDMP berubah-ubah (80.000/60.000/40.000; Maret/Oktober/Desember 2026) — gunakan angka terdaftar SIMKOPDES (83.383 per 29 Juni 2026) sebagai basis paling aman, dan sebut target operasional sebagai "moving target" yang justru memperkuat urgensi efisiensi.
