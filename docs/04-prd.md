# PRD — KoperasiHub MVP (Hackathon Build)

> Acuan requirement untuk sprint 24–36 jam. Hierarki dokumen: `CLAUDE.md` menang atas
> file ini bila bertentangan. Detail desain layar → `docs/05-design-spec.md`.
> Detail skema & seed → `docs/06-data-seed-spec.md`.

## 1. Tujuan produk & tolok ukur keberhasilan demo

KoperasiHub membuktikan satu mekanisme dalam satu demo: **permintaan kecil banyak
koperasi, jika diagregasi, mencapai ambang harga grosir yang tidak bisa dicapai
koperasi manapun sendirian.**

Demo dianggap berhasil bila juri menyaksikan alur ini hidup dalam <3 menit:
koperasi mengajukan kebutuhan → pool bergerak dari 85% → 100% → PO Konsolidasi terbit
→ setiap koperasi melihat alokasi + rupiah yang dihemat.

Pemetaan ke kriteria penilaian: Relevansi (25%) dibawa oleh problem framing & istilah
native SIMKOPDES; Inovasi (20%) oleh mekanisme pooling + cross-supply; Dampak (20%)
oleh angka hemat yang tampil di UI; Kemudahan Implementasi (15%) oleh arsitektur
asset-light & seed berbasis skema resmi; Kualitas Teknologi (15%) oleh demo end-to-end
tanpa crash.

## 2. Persona

1. **Pengurus KDMP pembeli** ("Bu Sri", KDMP Karangmalang, Sragen) — koperasi baru,
   belanja beras/minyak volume kecil, harga mahal. Butuh: ajukan kebutuhan, lihat
   seberapa dekat pool ke harga murah, tahu persis hematnya berapa.
2. **Pengurus KDMP produsen** ("Pak Yon", KDMP Blitar) — surplus telur dari peternak
   anggota. Butuh: menawarkan pasokan ke pool koperasi lain tanpa jadi "penjual
   marketplace".
3. **Admin Hub / koordinator klaster** — mengunci pool saat ambang tercapai,
   menerbitkan PO Konsolidasi, memantau klaster.
4. **Juri** (persona demo!) — login dengan `juri@koperasihub.id`/`demo123`, harus bisa
   memerankan Persona 1 tanpa dipandu: form jelas, alur satu arah, tidak ada dead end.

## 3. Alur inti (happy path yang didemokan)

1. Login sebagai koperasi → dashboard menampilkan pool aktif klaster + total hemat.
2. Buka pool beras (progress 85% menuju Ambang Tier Grosir).
3. Ajukan kebutuhan: volume 800 kg, harga baseline saat ini (mis. Rp15.358/kg), jendela
   minggu ini → pool menembus ambang → animasi tier tercapai.
4. Admin (atau otomatis saat demo) mengunci pool → PO Konsolidasi terbit.
5. Kembali sebagai koperasi: lihat Alokasi Proporsional + "Anda hemat Rp627.200"
   (+ baris Fee Keberhasilan Rp31.360 bila P1 masuk).

## 4. Requirement P0 (wajib — urutan pengerjaan disarankan)

**US-01 — Autentikasi multi-role.**
Sebagai pengguna, saya login dengan email+password dan diarahkan sesuai role
(koperasi / admin).
- AC1: akun juri `juri@koperasihub.id`/`demo123` (role koperasi, data sudah terisi).
- AC2: minimal 1 akun admin demo. Tanpa registrasi publik — seed only.
- AC3: RLS: koperasi hanya melihat demand miliknya + pool wilayahnya; admin melihat semua.

**US-02 — Pengajuan kebutuhan (demand).**
Sebagai pengurus koperasi, saya mengajukan kebutuhan komoditas agar masuk pool.
- AC1: field: komoditas (pilihan), volume+satuan, harga baseline (label: "Harga beli
  Anda saat ini"), jendela waktu, wilayah (default dari profil koperasi).
- AC2: toggle peran di form yang sama: "Saya butuh" / "Saya bisa suplai" (US-04).
- AC3: submit → demand langsung tergabung ke pool yang cocok (komoditas+wilayah+window)
  atau membuat pool baru; konfirmasi menampilkan pool tujuan.

**US-03 — Pool & Price Tier Simulator (HERO).**
Sebagai pengurus koperasi, saya melihat seberapa dekat pool dengan harga lebih murah.
- AC1: daftar pool: kartu per pool dengan progress bar, komoditas, wilayah, deadline.
- AC2: detail pool: Tangga Tier (baseline → tier 1 → tier 2) dengan posisi volume
  sekarang, kekurangan volume ke tier berikut, dan estimasi hemat per koperasi.
- AC3: angka hemat dihitung dari `harga_baseline` masing-masing koperasi, bukan rata-rata.
- AC4: saat volume menembus ambang: transisi visual "Tier Tercapai" (lihat docs/05).

**US-04 — Cross-supply: koperasi sebagai supplier.**
Sebagai pengurus KDMP produsen, saya menawarkan pasokan ke pool.
- AC1: entry "Saya bisa suplai" membuat penawaran dengan harga & kapasitas.
- AC2: di detail pool, daftar sumber suplai berlabel: [Distributor] / [BUMN Pangan] /
  [Koperasi Produsen], masing-masing harga + lokasi, diurutkan termurah.
- AC3: framing copy = "jaringan supplier"; tidak ada kata jual-beli langsung antar pihak.

**US-05 — Lock pool & PO Konsolidasi.**
Sebagai admin, saya mengunci pool yang mencapai ambang dan menerbitkan PO.
- AC1: tombol "Kunci Pool & Terbitkan PO" aktif hanya saat ambang tier tercapai.
- AC2: PO Konsolidasi = halaman print-friendly: supplier terpilih, total volume, harga
  tier, daftar koperasi peserta + porsi masing-masing, nomor PO, tanggal.

**US-06 — Alokasi Proporsional (split-order).**
Sebagai pengurus koperasi peserta, saya melihat alokasi dan penghematan saya.
- AC1: per koperasi: volume alokasi, harga tier, hemat total (baseline − tier) × volume.
- AC2: ringkasan klaster: total volume, total hemat kolektif.

## 5. Requirement P1 (hanya jika P0 solid — gate di CLAUDE.md)

**US-07 — Baris Fee Keberhasilan.** Di PO/alokasi: baris "Fee Keberhasilan (5% dari
penghematan)" per koperasi; fee = 0 bila tier tidak tercapai. Formula & baseline ikuti
CLAUDE.md §Business model.

**US-08 — Panel Net Settlement.** Bila dua koperasi saling memasok di pool berbeda:
satu layar menampilkan tagihan A→B, B→A, dan selisih neto dibayar tunai. Data boleh
dari seed (satu pasangan disiapkan di docs/06).

## 6. Requirement P2 (mock/seed — tanpa logic riil)

- Skor reputasi partisipasi (kolom statis) + badge "Terverifikasi SIMKOPDES" di profil.
- Dashboard admin agregat: total koperasi, pool aktif, akumulasi hemat klaster (statis).

## 7. Non-fungsional

- Mobile-first (juri mungkin membuka di HP); PWA manifest; deploy Vercel, URL publik.
- Bahasa Indonesia; istilah wajib ikut CLAUDE.md §Istilah (termasuk istilah resmi
  SIMKOPDES: Volume Transaksi, Nilai Transaksi, Simpanan Pokok/Wajib, RAT, NIB, NPWP).
- Demo tidak boleh bergantung jaringan pihak ketiga selain Supabase/Vercel.
- Halaman inti termuat <3 detik di 4G; tanpa error console yang terlihat saat demo.

## 8. Out of scope (mengikat — daftar penuh di CLAUDE.md)

Payment/escrow riil, logistik/notifikasi riil, mutual credit penuh, API SIMKOPDES riil,
modul produk olahan, registrasi publik, halaman marketing/landing (langsung login).

## 9. Definition of Done submission

- [ ] Repo publik + README (arsitektur, install guide, kredensial juri, disclosure AI)
- [ ] URL demo hidup + login juri terverifikasi dari perangkat lain
- [ ] Video demo ≤3 menit terekam (asuransi live demo)
- [ ] Pitch deck PDF ≤12 slide (di luar scope build; angka harus sama dengan seed)
- [ ] Submit di portal SIMKOPDES ≥2 jam sebelum deadline
