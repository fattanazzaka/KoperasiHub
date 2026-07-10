# Data & Seed Spec — KoperasiHub MVP

> Skema final + seed data yang membuat demo hidup. Angka di sini WAJIB konsisten dengan
> pitch deck (aturan: juri tidak boleh melihat dua angka berbeda untuk hal yang sama).
> Sumber harga: BPS Mei 2026 (beras), Permendag 18/2024 (MinyaKita) — verifikasi ulang H-1.

## 1. Skema (Postgres/Supabase)

```sql
-- Field koperasi meniru skema resmi dashboard SIMKOPDES (pers/dashboard, pers/kelembagaan)
create table cooperatives (
  id uuid primary key default gen_random_uuid(),
  nama text not null,                    -- "KDMP Karangmalang"
  desa text, kecamatan text, kabupaten text not null, provinsi text not null,
  jumlah_anggota int,
  nib text, npwp text,
  berbadan_hukum boolean default true,
  punya_akun boolean default true,
  status_rat text check (status_rat in
    ('belum','melaksanakan','dilaporkan','diverifikasi')),
  simpanan_pokok bigint, simpanan_wajib bigint,        -- rupiah
  volume_transaksi bigint default 0,                    -- unit fisik kumulatif
  nilai_transaksi bigint default 0,                     -- rupiah kumulatif
  pembangunan_gerai_pct int default 100,
  simkopdes_verified boolean default true,
  reputation_score int default 80,                      -- P2: statis dari seed
  is_producer boolean default false                     -- penanda koperasi produsen
);

create table users (        -- dipetakan ke auth.users Supabase via id
  id uuid primary key,
  cooperative_id uuid references cooperatives,
  role text check (role in ('koperasi','admin')) not null,
  display_name text
);

create table commodities (
  id text primary key,      -- 'beras' | 'minyak_kita' | 'gula' | 'telur'
  nama text, satuan text    -- 'kg' | 'liter'
);

create table suppliers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text check (tipe in ('distributor','bumn','koperasi')) not null,
  cooperative_id uuid references cooperatives,  -- terisi bila tipe='koperasi'
  lokasi text
);

create table price_tiers (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers not null,
  commodity_id text references commodities not null,
  nama_tier text,                       -- 'Grosir', 'Penggilingan', 'D1'
  min_volume int not null,
  harga_per_unit int not null           -- rupiah
);

create table pools (
  id uuid primary key default gen_random_uuid(),
  commodity_id text references commodities not null,
  wilayah text not null,                -- kabupaten klaster, mis. 'Sragen'
  window_start date, window_end date,
  status text check (status in ('open','locked','po_issued')) default 'open',
  selected_tier_id uuid references price_tiers,   -- terisi saat lock
  po_number text                                   -- terisi saat po_issued
);
-- total volume pool = SUM(demands.volume) where role='demand' — hitung via view/query,
-- jangan simpan ganda.

create table demands (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid references pools not null,
  cooperative_id uuid references cooperatives not null,
  role text check (role in ('demand','supply')) not null,
  volume int not null,
  harga_baseline int,                   -- wajib utk role='demand' (harga beli saat ini)
  harga_penawaran int,                  -- wajib utk role='supply'
  created_at timestamptz default now()
);

create table allocations (              -- terbentuk saat PO terbit
  id uuid primary key default gen_random_uuid(),
  pool_id uuid references pools not null,
  cooperative_id uuid references cooperatives not null,
  volume int not null,
  harga_tier int not null,
  hemat_rp int not null,                -- (harga_baseline - harga_tier) * volume
  fee_rp int not null default 0         -- P1: round(0.05 * hemat_rp)
);

create table settlements (              -- P1, cukup 1 baris seed
  id uuid primary key default gen_random_uuid(),
  coop_a uuid references cooperatives, coop_b uuid references cooperatives,
  tagihan_a_ke_b bigint, tagihan_b_ke_a bigint
);                                      -- neto dihitung di UI
```

RLS minimum: `cooperatives` readable semua login; `demands`/`allocations` hanya milik
koperasi sendiri (`cooperative_id = auth koperasi`) kecuali role admin; `pools` readable
semua. Jangan lebih rumit dari ini.

## 2. Seed: koperasi (24 unit)

Pola: 20 koperasi pembeli tersebar di 3 klaster Jateng/Jatim + 3 koperasi produsen +
1 koperasi akun juri. Semua `berbadan_hukum=true`, `punya_akun=true`,
`pembangunan_gerai_pct` 80–100, `simpanan_pokok` 25–100 jt, `simpanan_wajib` 10–50 jt,
`jumlah_anggota` 250–700, `status_rat` mayoritas 'diverifikasi' (2–3 unit 'dilaporkan').
NIB/NPWP dummy 13/15 digit konsisten format.

Contoh baris konkret (sisanya generate mengikuti pola):

| nama | kabupaten | prov | anggota | keterangan |
|---|---|---|---|---|
| KDMP Karangmalang | Sragen | Jateng | 412 | **akun juri** — klaster beras |
| KDMP Gemolong | Sragen | Jateng | 388 | klaster beras |
| KDMP Masaran | Sragen | Jateng | 540 | klaster beras |
| KDMP Plupuh | Sragen | Jateng | 295 | klaster beras |
| … (total 8 koperasi klaster Sragen) | | | | |
| KDMP Kaliwungu | Kudus | Jateng | 460 | klaster MinyaKita (6 unit) |
| KDMP Gunungpati | Semarang | Jateng | 505 | klaster telur (6 unit) |
| KDMP Sumber Rejeki | Sragen | Jateng | 610 | **produsen beras** `is_producer` |
| KDMP Ringinrejo | Blitar | Jatim | 655 | **produsen telur** `is_producer` |
| KDMP Wlingi | Blitar | Jatim | 470 | produsen telur cadangan |

Akun: `juri@koperasihub.id`/`demo123` → KDMP Karangmalang (role koperasi);
`admin@koperasihub.id`/`demo123` (role admin).

## 3. Seed: supplier & price tiers

**Beras** (basis BPS Mei 2026 — eceran 15.358, grosir 14.574, penggilingan 13.765):
| Supplier | tipe | tier | min_volume | harga |
|---|---|---|---|---|
| Bulog Kanwil Jateng | bumn | Grosir | 5.000 kg | 14.574 |
| Bulog Kanwil Jateng | bumn | Penggilingan | 20.000 kg | 13.765 |
| PT Pangan Sejahtera | distributor | Grosir | 5.000 kg | 14.650 |
| KDMP Sumber Rejeki | koperasi | Panen Lokal | 3.000 kg | 14.700 |

**MinyaKita** (Permendag 18/2024 — D2 14.500, D1 14.000, produsen 13.500; HET 15.700):
| Supplier | tipe | tier | min_volume | harga |
|---|---|---|---|---|
| PT Distribusi Nusantara | distributor | D1 | 2.000 L | 14.000 |
| PT Distribusi Nusantara | distributor | Produsen | 10.000 L | 13.500 |

**Telur** (klaster Semarang; baseline lokal ~28.000):
| Supplier | tipe | tier | min_volume | harga |
|---|---|---|---|---|
| CV Sumber Protein | distributor | Grosir | 500 kg | 26.500 |
| KDMP Ringinrejo (Blitar) | koperasi | Ternak Anggota | 1.000 kg | 24.500 |

> Catatan deck vs demo: narasi deck boleh pakai kontras dramatis Blitar (Rp16.000) vs
> Papua Barat (Rp47.000); demo memakai Blitar→Semarang (Rp24.500 incl. estimasi kirim
> vs baseline 28.000) agar realistis untuk klaster pilot Jateng. Jangan tertukar.

## 4. Seed: pools & demands (3 pool, kondisi berbeda)

**Pool A — Beras, Sragen (POOL DEMO UTAMA, 85%).** Window minggu berjalan, status open.
7 demand dari 7 koperasi Sragen, total **4.250 kg** (mis. 700+650+600+600+550+600+550).
`harga_baseline` bervariasi 15.200–15.500 (rata ±15.358). Ambang tier 1 = 5.000 kg →
progress 85%, kurang 750 kg.
**Skenario momen wow:** juri (KDMP Karangmalang, belum tergabung) mengajukan **800 kg,
baseline 15.358** → total 5.050 kg → Tier Grosir tercapai → admin lock → PO terbit.
Angka yang muncul untuk juri: hemat = (15.358−14.574)×800 = **Rp627.200**;
fee (P1) = **Rp31.360**; hemat kolektif pool ≈ (rata baseline−14.574)×5.050 ≈ **Rp3,9 jt**
per satu siklus order. (Cek pembulatan saat implementasi; tampilkan tanpa desimal.)

**Pool B — MinyaKita, Kudus (40%).** 4 demand total 800 L dari ambang 2.000 L.
Menunjukkan pool tahap awal; tidak disentuh saat demo, cukup terlihat di daftar.

**Pool C — Telur, Semarang (60%, cross-supply).** 4 demand total 600 kg dari ambang
1.000 kg; 1 entry `role='supply'` dari KDMP Ringinrejo (kapasitas 1.500 kg, harga
24.500). Detail pool ini menunjukkan tiga label sumber suplai berdampingan — bukti
visual cross-supply tanpa perlu interaksi.

**PO historis (1 buah, status po_issued):** pool beras Sragen periode lalu, 5.200 kg,
tier 14.574, hemat kolektif ~Rp4,1 jt — supaya halaman "PO" dan "Total Hemat" beranda
tidak kosong saat juri pertama login. Allocations terisi untuk 7 koperasi termasuk
KDMP Karangmalang (hemat Rp580 rb — angka Total Hemat di beranda juri).

**Settlement (P1, 1 baris):** KDMP Ringinrejo memasok telur ke pool yang diikuti
KDMP Sumber Rejeki; KDMP Sumber Rejeki memasok beras ke pool yang diikuti Ringinrejo.
Tagihan: A→B Rp36.750.000, B→A Rp29.148.000 → neto **Ringinrejo menerima Rp7.602.000**.

## 5. Checklist konsistensi angka (sebelum submit)

- [ ] Harga tier di seed == harga di deck == harga di README (satu keluarga angka).
- [ ] Hemat Rp627.200 (juri) & Rp784/kg muncul konsisten di UI, video, dan deck.
- [ ] Total Hemat beranda juri ≠ 0 saat pertama login (dari PO historis).
- [ ] Semua nama koperasi memakai prefiks "KDMP" + nama kecamatan/desa nyata.
- [ ] Verifikasi ulang harga BPS/Permendag H-1; bila berubah, update seed + deck bersamaan.
