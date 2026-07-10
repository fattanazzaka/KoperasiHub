# Design Spec — KoperasiHub MVP

> Acuan visual & UX untuk sprint. Requirement fungsional → `docs/04-prd.md`.
> Angka & data contoh → `docs/06-data-seed-spec.md`.

## 1. Arah estetika

**"Infrastruktur publik yang modern."** Ini alat kerja program pemerintah, bukan startup
konsumer: tenang, tegas, kredibel — dengan SATU momen teatrikal (tier tercapai).
Referensi rasa: dashboard SIMKOPDES yang dirapikan, bukan e-commerce.

Satu risiko estetika yang diambil: **Tangga Tier** sebagai elemen tanda tangan (signature)
— bukan progress bar generik, tapi tangga harga yang turun (lihat §4). Segala hal lain
dibuat tenang agar elemen ini yang diingat juri.

## 2. Design tokens

```css
--merah:        #C81E1E;  /* aksen tunggal: CTA, tier aktif, identitas Merah Putih */
--merah-tua:    #8F1212;  /* hover/pressed */
--tinta:        #1B1F24;  /* teks utama */
--abu:          #5C6570;  /* teks sekunder, border: turunkan opacity dari ini */
--kanvas:       #F5F6F8;  /* latar halaman (netral dingin, bukan cream) */
--kartu:        #FFFFFF;
--hijau-hemat:  #0E7B46;  /* KHUSUS angka penghematan — jangan dipakai untuk hal lain */
```
Aturan warna: merah = aksi & pencapaian; hijau = uang yang dihemat; selain itu netral.
Jangan menambah warna status lain (pending dsb. cukup abu).

Tipografi:
- Display/angka besar: **Plus Jakarta Sans** (700/800) — typeface karya desainer
  Indonesia, dibuat untuk komunikasi publik Jakarta; pilihan yang bisa diceritakan.
- Body/UI: **Inter** (400/500/600).
- Semua angka rupiah & volume: `font-variant-numeric: tabular-nums`.
Skala: 32/24/18/15/13. Radius 10px kartu, 8px tombol. Spacing basis 4px.

## 3. Arsitektur informasi & navigasi

Mobile (utama): bottom nav 4 item — **Beranda · Pool · Ajukan (tombol tengah menonjol)
· PO**. Profil lewat avatar di header. Desktop: sidebar kiri dengan item sama.
Tanpa landing page — root `/` langsung login. Semua layar maksimal 2 ketukan dari nav.

## 4. Layar per layar

### 4.1 Login
Logo + nama produk, tagline satu baris: "Pengadaan bersama untuk Koperasi Merah Putih."
Form email/password. Di bawahnya, kartu kecil abu: "Akun uji juri: juri@koperasihub.id /
demo123" (sengaja terlihat — juri tidak boleh mencari kredensial).

### 4.2 Beranda koperasi
```
[Header: nama koperasi + badge ✓ Terverifikasi SIMKOPDES]
[Kartu ringkas 2 kolom: Total Hemat (hijau, angka besar) | Pool Diikuti]
[Seksi "Pool aktif di wilayah Anda" → kartu pool (lihat 4.3)]
[CTA merah: + Ajukan Kebutuhan]
```
Kartu Total Hemat adalah bukti dampak — selalu tampil, walau Rp0 ("Mulai pool pertama
Anda").

### 4.3 Kartu pool (dipakai di Beranda & daftar Pool)
Satu kartu = satu pool: nama komoditas + wilayah, progress bar tipis merah, teks
"4.250 / 5.000 kg menuju Ambang Tier Grosir", deadline window, jumlah koperasi peserta.
Progress ≥80%: kartu diberi border merah tipis + label "Hampir tercapai" — mengarahkan
juri ke pool demo.

### 4.4 Detail pool — layar HERO
```
[Judul: Beras Medium — Klaster Sragen        deadline: 3 hari]
[=========== TANGGA TIER (signature) ===========]
[Baseline Anda Rp15.358] → [Tier Grosir Rp14.574 | min 5.000 kg | posisi 4.250 kg]
                         → [Tier Penggilingan Rp13.765 | min 20.000 kg | terkunci]
[Progress bar besar + "Kurang 750 kg lagi menuju harga grosir"]
[Estimasi hemat ANDA di tier ini: Rp— (hijau, dihitung dari baseline pribadi)]
[Sumber suplai (diurutkan termurah):]
  [BUMN Pangan]        Bulog Kanwil Jateng      Rp14.574/kg
  [Distributor]        PT Pangan Sejahtera      Rp14.650/kg
  [Koperasi Produsen]  KDMP Sumber Rejeki       Rp14.700/kg   ← label beda warna teks
[CTA: Gabung Pool Ini] [sekunder: daftar peserta]
```
Tangga Tier digambar sebagai anak tangga menurun kiri→kanan (harga turun = melangkah
naik kelas). Tier terkunci digambar redup dengan ikon gembok + syarat volumenya —
memberi alasan pool berikutnya lebih besar.

### 4.5 Form Ajukan Kebutuhan
Satu kolom, urutan: toggle peran (segmented: **Saya butuh** | Saya bisa suplai) →
komoditas (select) → volume+satuan → "Harga beli Anda saat ini /kg" (helper: "Dipakai
menghitung penghematan Anda — isi jujur, bukan harga eceran nasional") → jendela waktu
→ tombol "Kirim ke Pool". Sukses: sheet konfirmasi "Bergabung ke Pool Beras Klaster
Sragen" + posisi pool terbaru. Mode "Saya bisa suplai": field berubah jadi harga
penawaran + kapasitas.

### 4.6 PO Konsolidasi (print view)
Halaman putih polos ala dokumen resmi: kop "PURCHASE ORDER KONSOLIDASI" + nomor PO +
tanggal; blok supplier terpilih; tabel peserta (koperasi, NIB, volume alokasi, harga
tier, hemat); total; baris Fee Keberhasilan per koperasi (P1). Tombol "Cetak / Simpan
PDF" (window.print cukup). Ini artefak yang di-screenshot untuk deck.

### 4.7 Alokasi saya
Daftar PO yang diikuti koperasi login: volume alokasi, harga, hemat (hijau). Baris fee
kecil abu di bawahnya (P1): "Fee Keberhasilan 5%: Rp31.360".

### 4.8 (P1) Panel Net Settlement
Dua kolom koperasi berhadapan, tagihan dua arah, garis tengah dengan angka NETO besar:
"KDMP A membayar KDMP B: Rp X". Satu layar, tanpa navigasi lanjutan.

### 4.9 (P2) Dashboard admin
Angka agregat statis: koperasi terdaftar, pool aktif, total volume, total hemat klaster.
Satu halaman, tanpa interaksi selain tombol kunci pool (US-05).

## 5. Koreografi momen "Tier Tercapai" (satu-satunya animasi orkestrasi)

Saat demand juri menembus ambang: (1) progress bar mengisi sampai penuh ±400ms ease-out;
(2) anak tangga Tier Grosir berubah solid merah + label "TERCAPAI"; (3) angka hemat
count-up dari Rp0 → Rp627.200 (±800ms); (4) tombol admin "Kunci Pool & Terbitkan PO"
menyala. Tanpa confetti, tanpa suara. `prefers-reduced-motion`: langsung state akhir.
Di luar momen ini, transisi standar 150ms saja.

## 6. Copy & microcopy

- Suara: kalimat aktif, sentence case, tanpa jargon startup. Tombol menyatakan akibat:
  "Kirim ke Pool", "Kunci Pool & Terbitkan PO" — bukan "Submit"/"OK".
- Istilah mengikuti CLAUDE.md (Pengadaan Bersama, Ambang Tier, PO Konsolidasi, Alokasi
  Proporsional, Fee Keberhasilan; istilah resmi SIMKOPDES untuk field koperasi).
- Empty state mengarahkan: "Belum ada pool di wilayah Anda — ajukan kebutuhan pertama."
- Error menjelaskan + memberi jalan: "Volume harus lebih dari 0 kg. Ubah lalu kirim lagi."
- Angka rupiah selalu dipisah titik ribuan, tanpa desimal.

## 7. Aksesibilitas & kualitas dasar

Kontras teks ≥4.5:1 (merah #C81E1E di atas putih lolos untuk teks besar/ikon; teks kecil
pakai --tinta). Fokus keyboard terlihat (outline merah 2px). Target sentuh ≥44px.
Breakpoint: 1 kolom <768px, 2 kolom ≥768px, sidebar ≥1024px.

## 8. Skrip video demo 3 menit (asuransi)

0:00–0:20 masalah (1 kalimat + angka 83.383 vs 1.061) · 0:20–0:50 login juri, beranda,
kartu pool 85% · 0:50–1:40 detail pool: Tangga Tier, sumber suplai 3 label, ajukan 800 kg
→ MOMEN tier tercapai · 1:40–2:20 kunci pool → PO Konsolidasi print view · 2:20–3:00
alokasi + hemat per koperasi, tutup dengan total hemat klaster & satu kalimat visi.
