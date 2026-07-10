-- supabase/seed-demo.sql — Track B
-- =====================================================================================
-- Koreografi demo KoperasiHub (angka DIBEKUKAN di docs/07-angka-demo-final.md).
-- Klaster: Kota Serang, Banten · Hero: MinyaKita · Cross-supply: telur Cilegon.
--
-- URUTAN JALANKAN di Supabase (SQL Editor / psql):
--   1) supabase/schema.sql        (skema — milik Track A)
--   2) supabase/seed-snapshot.sql (koperasi Banten tambahan — dihasilkan 01-snapshot.ts)
--   3) supabase/seed-demo.sql     (file ini)
--   4) Auth: buat akun juri & admin (lihat CATATAN AKUN di bawah), lalu isi public.users.
--
-- File ini IDEMPOTEN: menghapus data demo lama lalu menyisipkannya kembali.
-- Aman dijalankan berulang (semua tabel di bawah hanya berisi data demo).
-- =====================================================================================

begin;

-- --- Bersihkan data demo lama (urut sesuai FK) ------------------------------------
delete from public.settlements;
delete from public.allocations;
delete from public.demands;
delete from public.pools;
delete from public.price_tiers;
delete from public.suppliers;

-- --- Komoditas ---------------------------------------------------------------------
insert into public.commodities (id, nama, satuan) values
  ('minyak_kita', 'MinyaKita', 'liter'),
  ('telur', 'Telur Ayam', 'kg'),
  ('beras', 'Beras', 'kg'),
  ('gula', 'Gula Pasir', 'kg')
on conflict (id) do nothing;

-- --- Koperasi demo-inti (6 + 3 latar Pool B) --------------------------------------
-- koperasi_ref real (KOP-...) dipertahankan; koperasi sintetis diberi ref 'DEMO-...'
-- agar unik & idempoten. Nama = "KDMP <desa>". Angka simpanan/transaksi = garnish P2.
insert into public.cooperatives
  (koperasi_ref, nama, desa, kecamatan, kabupaten, provinsi, jumlah_anggota,
   berbadan_hukum, punya_akun, status_rat, simpanan_pokok, simpanan_wajib,
   volume_transaksi, nilai_transaksi, pembangunan_gerai_pct, simkopdes_verified,
   reputation_score, is_producer)
values
  ('DEMO-CIPARE','KDMP Cipare','Cipare','Serang','KOTA SERANG','Banten',240,
     true,true,'diverifikasi',24000000,36000000,9600,120000000,95,true,88,false),
  ('KOP-315C5EFCC96D','KDMP Kaligandu','Kaligandu','Serang','KOTA SERANG','Banten',172,
     true,true,'diverifikasi',17200000,25800000,6880,86000000,90,true,84,false),
  ('KOP-63AEF19F6654','KDMP Unyur','Unyur','Serang','KOTA SERANG','Banten',524,
     true,true,'diverifikasi',52400000,78600000,20960,262000000,98,true,90,false),
  ('KOP-F8A0C206EB72','KDMP Terondol','Terondol','Serang','KOTA SERANG','Banten',232,
     true,true,'dilaporkan',23200000,34800000,9280,116000000,88,true,82,false),
  ('KOP-CA604BC75944','KDMP Pancalaksana','Pancalaksana','Curug','KOTA SERANG','Banten',136,
     true,true,'diverifikasi',13600000,20400000,5440,68000000,85,true,80,false),
  ('KOP-0008016CB39E','KDMP Cilegon',null,null,'KOTA CILEGON','Banten',310,
     true,true,'diverifikasi',31000000,46500000,12400,155000000,96,true,89,true),
  ('DEMO-KRAGILAN','KDMP Kragilan','Kragilan','Kragilan','KAB. SERANG','Banten',300,
     true,true,'diverifikasi',30000000,45000000,12000,150000000,92,true,86,false),
  ('DEMO-CIRUAS','KDMP Ciruas','Ciruas','Ciruas','KAB. SERANG','Banten',260,
     true,true,'melaksanakan',26000000,39000000,10400,130000000,87,true,81,false),
  ('DEMO-PONTANG','KDMP Pontang','Pontang','Pontang','KAB. SERANG','Banten',280,
     true,true,'diverifikasi',28000000,42000000,11200,140000000,90,true,85,false)
on conflict (koperasi_ref) do nothing;

-- --- Supplier ----------------------------------------------------------------------
insert into public.suppliers (nama, tipe, cooperative_id, lokasi) values
  ('PT Distribusi Nusantara', 'distributor', null, 'Serang, Banten'),
  ('CV Sumber Protein', 'distributor', null, 'Serang, Banten'),
  ('ID FOOD (Holding Pangan)', 'bumn', null, 'Jakarta'),
  ('KDMP Cilegon', 'koperasi',
     (select id from public.cooperatives where koperasi_ref = 'KOP-0008016CB39E'),
     'Kota Cilegon, Banten');

-- --- Price tiers -------------------------------------------------------------------
-- MinyaKita (Permendag 18/2024): D1 14.000, produsen 13.500 (baseline pasar ~14.500/HET 15.700)
insert into public.price_tiers (supplier_id, commodity_id, nama_tier, min_volume, harga_per_unit)
select s.id, 'minyak_kita', t.nama_tier, t.min_volume, t.harga
from (values ('D1',2000,14000), ('Produsen',5000,13500)) as t(nama_tier,min_volume,harga)
cross join (select id from public.suppliers where nama='PT Distribusi Nusantara') s;

-- Telur: tiga label sumber (termurah = koperasi produsen)
insert into public.price_tiers (supplier_id, commodity_id, nama_tier, min_volume, harga_per_unit)
values
  ((select id from public.suppliers where nama='CV Sumber Protein'),'telur','Grosir',500,26500),
  ((select id from public.suppliers where nama='ID FOOD (Holding Pangan)'),'telur','Kontrak BUMN',500,26000),
  ((select id from public.suppliers where nama='KDMP Cilegon'),'telur','Ternak Anggota',300,25000);

-- --- Pools -------------------------------------------------------------------------
insert into public.pools (commodity_id, wilayah, window_start, window_end, status) values
  ('minyak_kita','Kota Serang','2026-07-06','2026-07-12','open'),   -- Pool A (hero, 85%)
  ('minyak_kita','Kab. Serang','2026-07-06','2026-07-12','open'),   -- Pool B (latar, 40%)
  ('telur','Kota Serang','2026-07-06','2026-07-12','open');          -- Pool C (cross-supply, 60%)

-- PO historis (agar beranda juri tidak nol saat pertama login)
insert into public.pools
  (commodity_id, wilayah, window_start, window_end, status, selected_tier_id, po_number)
select 'minyak_kita','Kota Serang','2026-06-01','2026-06-07','po_issued',
  (select pt.id from public.price_tiers pt
     join public.suppliers s on s.id = pt.supplier_id
     where s.nama='PT Distribusi Nusantara' and pt.commodity_id='minyak_kita'
       and pt.nama_tier='D1'),
  'PO-MK-2026-06-001';

-- --- Demands -----------------------------------------------------------------------
-- Pool A: 4 koperasi mapan @ baseline 14.500 = 1.700 L (85% dari ambang 2.000 L).
-- (Demand juri 400 L SENGAJA tidak diseed — diajukan LIVE saat demo agar pool tembus 100%.)
insert into public.demands (pool_id, cooperative_id, role, volume, harga_baseline)
select p.id, c.id, 'demand', d.volume, 14500
from (values ('KOP-315C5EFCC96D',400),('KOP-63AEF19F6654',500),
             ('KOP-F8A0C206EB72',450),('KOP-CA604BC75944',350)) as d(ref,volume)
join public.cooperatives c on c.koperasi_ref = d.ref
cross join (select id from public.pools
            where commodity_id='minyak_kita' and wilayah='Kota Serang'
              and window_start='2026-07-06') p;

-- Pool B: 3 koperasi Kab. Serang = 800 L (40% dari 2.000 L).
insert into public.demands (pool_id, cooperative_id, role, volume, harga_baseline)
select p.id, c.id, 'demand', d.volume, d.baseline
from (values ('DEMO-KRAGILAN',300,15000),('DEMO-CIRUAS',250,15200),
             ('DEMO-PONTANG',250,15700)) as d(ref,volume,baseline)
join public.cooperatives c on c.koperasi_ref = d.ref
cross join (select id from public.pools
            where commodity_id='minyak_kita' and wilayah='Kab. Serang'
              and window_start='2026-07-06') p;

-- Pool C (telur): 4 koperasi pembeli @ baseline 28.000 = 600 kg (60% dari 1.000 kg).
insert into public.demands (pool_id, cooperative_id, role, volume, harga_baseline)
select p.id, c.id, 'demand', 150, 28000
from (values ('KOP-315C5EFCC96D'),('KOP-63AEF19F6654'),
             ('KOP-F8A0C206EB72'),('KOP-CA604BC75944')) as d(ref)
join public.cooperatives c on c.koperasi_ref = d.ref
cross join (select id from public.pools
            where commodity_id='telur' and wilayah='Kota Serang'
              and window_start='2026-07-06') p;

-- Pool C: entry SUPPLY dari KDMP Cilegon (produsen) — kapasitas 800 kg @ 25.000.
insert into public.demands (pool_id, cooperative_id, role, volume, harga_penawaran)
select p.id, c.id, 'supply', 800, 25000
from public.cooperatives c
cross join (select id from public.pools
            where commodity_id='telur' and wilayah='Kota Serang'
              and window_start='2026-07-06') p
where c.koperasi_ref = 'KOP-0008016CB39E';

-- --- Allocations (PO historis) -----------------------------------------------------
-- 5 koperasi, tier D1 (14.000). hemat = (baseline - 14.000) * volume; fee = 5% * hemat.
insert into public.allocations (pool_id, cooperative_id, volume, harga_tier, hemat_rp, fee_rp)
select p.id, c.id, a.volume, 14000, a.hemat, a.fee
from (values
  ('DEMO-CIPARE',300,510000,25500),      -- juri: (15.700-14.000)*300 = 510.000
  ('KOP-315C5EFCC96D',500,250000,12500),
  ('KOP-63AEF19F6654',600,300000,15000),
  ('KOP-F8A0C206EB72',500,250000,12500),
  ('KOP-CA604BC75944',500,250000,12500)
) as a(ref,volume,hemat,fee)
join public.cooperatives c on c.koperasi_ref = a.ref
cross join (select id from public.pools
            where commodity_id='minyak_kita' and wilayah='Kota Serang'
              and window_start='2026-06-01') p;

-- --- Settlement (P1) ---------------------------------------------------------------
-- Cilegon pasok telur ke Serang (Rp20jt); Serang pasok minyak ke Cilegon (Rp14jt).
-- Neto: Cilegon menerima Rp6.000.000.
insert into public.settlements (coop_a, coop_b, tagihan_a_ke_b, tagihan_b_ke_a)
select a.id, b.id, 20000000, 14000000
from public.cooperatives a, public.cooperatives b
where a.koperasi_ref = 'KOP-0008016CB39E'   -- Cilegon
  and b.koperasi_ref = 'KOP-63AEF19F6654';  -- Unyur

commit;

-- =====================================================================================
-- CATATAN AKUN (langkah terpisah — perlu Supabase Auth, dikerjakan Zaka/Track A):
--   1. Di Supabase Dashboard > Authentication, buat 2 user:
--        juri@koperasihub.id  / demo123
--        admin@koperasihub.id / demo123
--   2. Salin UID masing-masing, lalu jalankan (ganti <UID_...>):
--        insert into public.users (id, cooperative_id, role, display_name) values
--          ('<UID_JURI>',
--             (select id from public.cooperatives where koperasi_ref='DEMO-CIPARE'),
--             'koperasi','Pengurus KDMP Cipare'),
--          ('<UID_ADMIN>', null, 'admin', 'Admin Hub');
--   (Track B akan menyiapkan scripts/03-seed-auth.ts untuk mengotomatiskan ini.)
-- =====================================================================================
