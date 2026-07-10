# Laporan Evaluasi: Fitur "Cross-Supply Antar-Koperasi" untuk Platform SentraKop

## TL;DR
- **Layak masuk demo, TAPI sebagai perluasan mesin yang sudah ada — bukan fitur kedua yang berdiri sendiri, dan bukan barter.** Cara menang: jadikan koperasi daerah surplus sebagai **SUPPLIER alternatif** di dalam demand pooling yang sama (selain distributor/prinsipal/BUMN pangan). Barter literal harus **ditolak** karena bermasalah dari sisi PPN, akuntansi, dan syariah.
- **Mekanisme optimal = dua transaksi jual-beli rupiah yang di-matching platform, lalu diselesaikan dengan net settlement/muqashshah (set-off utang-piutang).** Akad: **salam** untuk komoditas pertanian, **istishna** untuk produk olahan, tetap di bawah payung **wakalah bil ujrah**. Ini mengalahkan barter literal karena aman pajak sekaligus defensible di depan juri PEBS FEB UI.
- **Fitur ini MENAIKKAN peluang menang** karena menjawab langsung challenge question 2–4 dan punya preseden negara (KAD Bank Indonesia, Misi Dagang Jatim) — **tetapi hanya jika dibingkai "satu mesin, dua arah".** Untuk tim 2 orang dalam sprint 24–36 jam, "satu mesin yang dalam" mengalahkan "dua fitur setengah jadi". Produk olahan dijadikan roadmap, bukan MVP.

---

## Key Findings

1. **Barter literal tidak layak secara pajak.** Direktorat Jenderal Pajak secara eksplisit memasukkan "barter" sebagai bentuk penyerahan Barang Kena Pajak yang dikenakan PPN — setara jual-beli. Barter tidak memberi keuntungan pajak apa pun, malah menambah kerumitan valuasi (menentukan Dasar Pengenaan Pajak) dan pencatatan bagi koperasi desa ber-SDM terbatas.

2. **Barter komoditas pangan berisiko riba fadhl/nasi'ah.** Menukar beras-dengan-beras beda kualitas atau dengan penyerahan tertunda jatuh ke riba. Solusi syariah baku: pecah menjadi dua akad jual-beli rupiah yang sah, lalu selesaikan lewat **muqashshah** (set-off).

3. **Arah ide sudah dibuktikan negara, tapi belum ada platform digitalnya di level koperasi desa.** KAD Bank Indonesia dan Misi Dagang Jawa Timur mempertemukan daerah surplus dengan defisit — celah yang persis akan diisi SentraKop.

4. **Disparitas harga antar-daerah sangat lebar** dan menjadi amunisi pitch yang kuat: bawang merah, telur ayam, dan beras menunjukkan selisih 2–3x lipat antara daerah sentra dan daerah defisit.

5. **Mutual credit (Sardex/WIR) adalah konsep yang lebih matang daripada barter**, tapi terlalu berat untuk dibangun penuh dalam sprint — ambil konsepnya (net settlement) sebagai narasi, bukan sebagai beban coding.

---

## Details

### A. Kelayakan Hukum & Syariah

**Aspek pajak.** DJP menyebut "penyerahan melalui jual beli, barter, atau leasing" sebagai objek PPN yang setara. Jadi barter tidak menghilangkan kewajiban pajak, hanya menambah beban valuasi dan akuntansi (SAK-EP mensyaratkan pengukuran nilai wajar barang yang dipertukarkan — rumit untuk koperasi baru). Keuntungan model jual-beli rupiah: banyak bahan pokok (beras, jagung, kedelai, garam, daging, telur, susu, sayur, buah) **dibebaskan dari PPN** sebagai barang kebutuhan pokok, sehingga transaksi jual-beli komoditas pangan umumnya tidak menambah beban PPN.

**Aspek syariah (penting untuk juri PEBS FEB UI).** Barter (*bai' al-muqayadhah*) sah untuk barang **non-ribawi** tanpa syarat kesamaan nilai/kuantitas dan tanpa keharusan tunai (pandangan Syekh Taqi Utsmani dalam *Fiqh al-Buyu'*). Namun untuk barang **ribawi** — enam komoditas dalam hadis (emas, perak, gandum, sya'ir/jewawut, kurma, garam) yang oleh mayoritas ulama diqiyaskan ke bahan makanan pokok termasuk beras — barter sesama jenis wajib **sama kuantitas DAN tunai (taqabudh)**; beda kualitas atau tertunda jatuh ke **riba fadhl / riba nasi'ah**. Karena cross-supply koperasi sangat mungkin melibatkan beras/pangan dengan kualitas dan waktu penyerahan berbeda, **barter literal berisiko haram**. Jalan aman yang diterima fiqh: pecah menjadi **dua transaksi jual-beli rupiah** (masing-masing *bai'* sah), lalu selesaikan utang-piutang yang timbul lewat **muqashshah** (kompensasi/set-off utang-piutang, dibolehkan dalam fiqh muamalah).

**Akad yang tepat:**
- **Salam** (bayar di muka, barang menyusul dengan spesifikasi jelas) — sesuai **Fatwa DSN-MUI No. 05/DSN-MUI/IV/2000**, ideal untuk komoditas pertanian; cocok saat koperasi defisit memesan hasil panen dari koperasi surplus.
- **Istishna** (pesanan barang yang perlu proses produksi; pembayaran bisa di muka, cicil, atau ditangguhkan) — sesuai **Fatwa DSN-MUI No. 06/DSN-MUI/IV/2000**, cocok untuk **produk olahan/pengrajin** (keripik, abon).
- **Wakalah bil ujrah** tetap dipakai sebagai payung platform (koperasi mewakilkan pengadaan ke platform dengan fee), konsisten dengan positioning SentraKop yang sudah fix.

### B. Pelajaran Mutual Credit (Sardex, WIR)

Sardex (Sardinia, Italia) adalah jaringan *mutual credit* B2B sejak 2009/2010, terinspirasi WIR Bank Swiss. Anggota saling memberi kredit dalam mata uang komplementer berdenominasi euro (tidak ditukar euro). Menurut profil Monneta, Sardex telah mencatat **lebih dari 3.800 akun anggota pada 2017**, dan **volume transaksi melampaui 212 juta unit setara-euro** (kumulatif per 2017; sumber lain menyebut arus transaksi tahunan puluhan juta euro). Batas kredit ditentukan individual (~1% omzet tahunan anggota) dengan batas saldo positif ~10% omzet.

**Pelajaran kunci:** *mutual credit clearing* lebih matang daripada barter bilateral karena menghilangkan syarat *double coincidence of wants* — koperasi A tidak harus butuh persis barang koperasi B. Platform mencatat saldo kredit-debit multilateral; penyelesaian rupiah hanya atas **selisih neto per periode**. **Namun** membangun sistem mutual credit penuh (manajemen saldo, batas kredit, clearing periodik, penanganan gagal bayar) adalah *scope creep* berbahaya untuk sprint 24–36 jam dengan 1 developer. **Rekomendasi: adopsi konsepnya (net settlement) sebagai narasi roadmap; MVP cukup mencatat matching dua transaksi + panel set-off sederhana.**

### C. Preseden Indonesia (bukti arah ide benar)

**Kerja Sama Antar Daerah (KAD) — Bank Indonesia.** Mekanisme mempertemukan daerah surplus dengan daerah defisit pangan untuk pengendalian inflasi, kini di bawah payung **Gerakan Pengendalian Inflasi dan Pangan Sejahtera (GPIPS) 2026** (menggantikan GNPIP). KAD dilakukan secara **G2G dan B2B**, melibatkan produsen, offtaker, koperasi, kelompok tani, dan distributor; BI Jateng eksplisit menyebut inisiatif ini "memetakan wilayah surplus" dan menghubungkannya dengan wilayah defisit. Ini bukti kuat bahwa negara mendorong model surplus→defisit — **tapi masih berbasis event/temu bisnis, belum ada platform digital berkelanjutan di level koperasi desa.**

**Misi Dagang Jawa Timur (Gubernur Khofifah).** Sejak 2019 hingga Januari 2026, Pemprov Jatim telah menyelenggarakan **49 kali misi dagang domestik di 29 provinsi dengan total nilai komitmen transaksi Rp30,52 triliun** yang melibatkan 2.410 pelaku usaha. Misi dagang Jatim–Jateng perdana 2026 (Semarang, 29 Januari 2026) mencatat **total komitmen Rp3.152.408.358.000** (Jatim Jual Rp2.759.547.585.000; Jatim Beli Rp296.860.773.000; investasi Rp96 miliar). Polanya **dua arah** ("Jatim Jual + Jatim Beli") yang secara eksplisit "mengoptimalkan muatan berangkat dan muatan balik antarwilayah" — **narasi sempurna untuk pitch**: keunggulan komparatif antar-daerah + logistik dua-arah sudah terbukti berjalan, SentraKop tinggal mendigitalkannya ke level koperasi desa.

### D. Data Contoh Pitch (Pasangan Daerah–Komoditas)

**Konteks makro (framing "masalahnya distribusi, bukan produksi").** Bapanas memproyeksikan **Neraca Pangan Nasional 2026 surplus** (Kepala Bapanas/Mentan Andi Amran Sulaiman, Raker Komisi IV DPR RI, 7 April 2026): beras surplus ~16,39 juta ton, jagung ~4,3 juta ton, daging ayam ~837 ribu ton, telur ayam ~423 ribu ton. Bapanas sendiri menjalankan **Program Fasilitasi Distribusi Pangan (FDP)** dari daerah surplus ke defisit dengan realisasi 2024 hanya ~750.793 kg — **celah pasar besar** yang menegaskan masalah utama adalah distribusi, bukan produksi.

| Komoditas | Daerah surplus (harga rendah) | Daerah defisit (harga tinggi) | Selisih | Sumber & tanggal |
|---|---|---|---|---|
| **Telur ayam** ⭐ | Peternak Blitar (Jatim) ~Rp15.600–17.000/kg | Papua Barat ~Rp47.000/kg; Maluku Utara ~Rp44.100/kg | **~Rp27.000–31.000/kg (≈3x)** | Peternak: Kompas/CNN, Jun 2026. Defisit: PIHPS via Databoks, Feb–Mar 2026 |
| **Bawang merah** | Petani Brebes (Jateng) ~Rp27.000/kg (panen raya bisa ~Rp15.000) | Pasar modern Maluku/Papua Barat ~Rp90.000–95.000/kg | **~Rp63.000–68.000/kg (≈3x)** | Tribun, Agu 2025 & PIHPS via Databoks 2025–26 *(verifikasi ulang sebelum pitch)* |
| **Beras medium** | Sulsel/Lampung/Jabar di bawah rata-rata nasional | Papua (pasar modern) Rp19.550/kg vs rata-rata nasional Rp16.050/kg | disparitas antar-daerah pernah **30,49%** (KSP, Des 2025) | PIHPS via Databoks, 30 Jun 2026 |
| **Cabai rawit merah** | Sentra Jatim/Jateng (harga produsen jatuh saat panen) | Kalimantan Timur Rp161.200/kg (termahal nasional) | rata-rata nasional Rp102.910/kg | PIHPS via Databoks, 12 Jun 2026 |

**Rekomendasi pemakaian:** gunakan **telur ayam (Blitar→Papua Barat)** sebagai contoh utama — paling aktual (2026), paling dramatis (peternak rugi di bawah HPP di satu sisi, konsumen bayar 3x lipat di sisi lain), dan menunjukkan kegagalan distribusi murni. Bawang merah sebagai contoh kedua. Sebutkan konteks "pasar modern" agar akurat.

### E. Angle Pemberdayaan Produk Olahan (varian kedua user)

**Data nilai tambah (kuat untuk narasi "naik kelas dari mentah ke olahan"):**
- **Kelapa → VCO: nilai tambah hingga 11 kali lipat** kelapa mentah; kelapa parut 6x, arang batok 4,5x, nata de coco 3,6x (BRMP Perkebunan Kementan). Studi lapangan lain mencatat rasio nilai tambah VCO 46–47%.
- **Singkong → tepung mocaf: rasio nilai tambah 67,2% (nilai tambah Rp6.394/kg)** pada studi KWT Gemilang, Palembang.

**Kendala nyata (kenapa jangan di MVP):** standardisasi kualitas; perizinan berjenjang (**SPP-IRT/PIRT** diterbitkan bupati/walikota via OSS untuk produk risiko rendah & peralatan manual/semi-otomatis; produk skala mesin otomatis & masuk ritel modern wajib **izin MD BPOM**; produk umur simpan <7 hari dikecualikan); sertifikasi halal; volume kecil dan tidak kontinu. Untuk koperasi desa baru dengan SDM terbatas, ini **tidak realistis di MVP**.

**Framing terbaik = roadmap fase 2/3.** Narasi: *"Begitu jaringan pengadaan (beli bersama) terbentuk, jalur logistik yang sama menjadi kanal pemasaran produk olahan desa — dari beli bersama menjadi jual bersama."* Ini sekaligus menyambung positioning Kopdes Merah Putih sebagai **offtaker/agregator/konsolidator produk lokal** (pangan, hortikultura, perikanan, kerajinan, kuliner) yang sudah dinyatakan resmi pemerintah.

**Preseden collective marketing kelas dunia:** **KBQ Baburrayyan (Aceh Tengah)** — satu-satunya koperasi Indonesia yang ekspor langsung ke Starbucks tanpa broker. Ketua Rizwan Husni menyebut **anggota 4.260 petani kopi bersertifikasi organik dengan lahan 5.590 hektar**; ekspor ~50 kontainer/tahun (per kontainer ~19,2 ton) dan omzet ekspor dilaporkan mencapai ratusan miliar rupiah per tahun (~Rp165 miliar menurut UKMINDONESIA.ID/IDN Times). Bukti bahwa koperasi bisa menjadi offtaker + pemasar kolektif berskala global — cocok sebagai slide penutup "visi jangka panjang".

### F. Desain MVP Opsi Terpilih (Opsi D: integrasi ke demand pooling)

Alih-alih fitur terpisah, **cross-supply = perluasan sisi suplai**. Ketika koperasi B mengajukan kebutuhan (misal telur), mesin matching mencocokkan tidak hanya ke distributor/BUMN pangan, tetapi juga ke **koperasi surplus A (daerah produsen telur) sebagai supplier alternatif** dalam pool yang sama.

**Perubahan UI minimal (reuse mesin yang sudah ada):**
1. **Toggle peran** saat mendaftar komoditas: *"Saya butuh"* (demand) / *"Saya bisa suplai"* (supply).
2. Di layar matching, tampilkan **sumber suplai berlabel**: `[Distributor]` / `[BUMN Pangan]` / `[Koperasi Produsen]` — masing-masing dengan harga & lokasi. Koperasi produsen otomatis muncul bila lebih murah + ongkos kirim.
3. Bila dua koperasi saling jual-beli (A jual telur ke B, B jual bawang ke A), tampilkan **panel "Net Settlement"**: total tagihan A→B, total B→A, dan **SELISIH neto** yang dibayar tunai. Ini mendemonstrasikan konsep *muqashshah* dalam satu layar — poin syariah + inovasi sekaligus.

**Beban development: rendah–sedang.** Reuse penuh mesin matching & price tier. Tambahan utama: field peran supplier + panel set-off (hitung selisih). Feasible untuk 1 developer **asalkan mesin pooling inti sudah jalan lebih dulu**.

### G. Analisis Strategi Kompetisi (kacamata juri)

**Verdict: MENAIKKAN peluang menang — bila dan hanya bila dibingkai sebagai perluasan mesin yang sama (Opsi D).**

**Pro (memperkuat skor):**
- **Relevansi (25%) & Dampak (20%):** menjawab langsung challenge question 2 (mencocokkan potensi desa dengan pasar), 3 (koperasi surplus MENJADI offtaker/supplier bagi koperasi lain), dan — lewat roadmap — 4 (nilai tambah produk desa). Didukung preseden negara (KAD BI, Misi Dagang Jatim Rp30,52 triliun).
- **Inovasi/Novelty (20%):** mengubah demand pooling satu-arah menjadi **jaringan perdagangan dua-arah antar-koperasi** — diferensiasi kuat, dan panel net settlement/muqashshah adalah "aha moment" syariah untuk juri PEBS.

**Kontra (bila salah eksekusi):**
- Tim 2 orang, sprint 24–36 jam: **dua fitur setengah jadi lebih buruk** daripada satu mesin yang solid. Kualitas Teknologi (15%) & Kemudahan Implementasi (15%) bisa turun, dan juri bisa menilai "overclaim/tidak fokus".

**Rekomendasi tegas:** Demo utama tetap **demand pooling** (mesin inti yang dalam). Cross-supply ditampilkan sebagai **SATU layar tambahan** (supplier alternatif + panel net settlement) yang membuktikan platform bisa dua-arah. Produk olahan = **slide roadmap** di akhir. Ini menampilkan visi besar tanpa mengorbankan kedalaman demo.

---

## Recommendations

1. **TERIMA cross-supply, TOLAK barter literal.** Implementasikan sebagai **Opsi D** (perluasan sisi suplai demand pooling), bukan modul terpisah.
2. **Mekanisme penyelesaian: dua jual-beli rupiah + net settlement (muqashshah).** Akad: **salam** (pertanian), **istishna** (olahan), **wakalah bil ujrah** (payung platform). Siapkan 1 slide diagram akad untuk pertanyaan juri syariah.
3. **MVP secukupnya:** toggle peran supplier + panel net settlement satu layar. **Jangan** bangun mutual credit/mata uang komplementer penuh.
4. **Pitch pakai 2 pasangan data riil:** utama **telur ayam Blitar→Papua Barat** (selisih ~Rp27.000–31.000/kg), pendukung **bawang merah Brebes→Maluku** (selisih ~Rp63.000–68.000/kg). Bingkai dengan makro: "Neraca pangan nasional 2026 surplus — masalahnya distribusi antar-daerah, bukan produksi."
5. **Produk olahan = roadmap fase 2/3** dengan narasi "beli bersama → jual bersama" dan preseden **KBQ Baburrayyan** (4.260 petani, ekspor langsung Starbucks) + data nilai tambah (VCO 11x, mocaf +67%).
6. **Benchmark yang mengubah keputusan (aturan sprint):**
   - Jika **H-6 jam** mesin pooling inti belum solid → **DROP panel net settlement**, sisakan hanya toggle supplier + slide roadmap.
   - Jika mesin pooling solid **H-12 jam** → tambahkan panel net settlement penuh sebagai pembeda.
   - Jika juri pada Q&A menekan sisi syariah → tonjolkan diagram salam/istishna + muqashshah sebagai jawaban "kenapa bukan barter".

---

## Caveats
- **Angka surplus-defisit per provinsi tunggal & resmi tidak tersedia publik**; surplus adalah angka nasional (Bapanas), sedangkan defisit per provinsi (mis. Jabar defisit beras) dihitung media data dari produksi BPS — verifikasi bila untuk klaim resmi.
- **Harga "termahal" PIHPS umumnya pasar modern** (bisa di atas pasar tradisional); sebutkan konteksnya di slide.
- **Angka bawang merah Brebes→Maluku belum terverifikasi ulang** pada sumber PIHPS terbaru dalam riset ini — cek `panelharga.badanpangan.go.id` atau `bi.go.id/hargapangan` sebelum pitch. Data harga bersifat *snapshot* dan fluktuatif; gunakan angka terkini saat presentasi.
- **Mutual credit legal di Eropa dalam kerangka *closed-loop*/"third-party record keeper"**; penerapan mata uang komplementer di Indonesia perlu kajian regulasi tersendiri — karenanya MVP sengaja memakai **jual-beli rupiah biasa + set-off**, bukan mata uang komplementer, agar aman regulasi dan mudah dijelaskan ke juri.
- **Angka Sardex** yang beredar bervariasi antar sumber (>3.800 akun & >212 juta unit setara-euro kumulatif per 2017 vs "mendekati/puluhan juta euro per tahun"); pakai sebagai ilustrasi konsep, bukan klaim presisi.
