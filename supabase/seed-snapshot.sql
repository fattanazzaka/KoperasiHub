-- supabase/seed-snapshot.sql — DIHASILKAN OTOMATIS oleh scripts/01-snapshot.ts
-- JANGAN diedit tangan. Koperasi Banten asli (snapshot SIMKOPDES) untuk dashboard admin.
-- 6 koperasi demo-inti ada di seed-demo.sql. Jalankan: schema.sql -> seed-snapshot.sql -> seed-demo.sql
-- Dihasilkan: 2026-07-10T15:08:45.545Z · 22 koperasi.

begin;

insert into public.cooperatives
  (koperasi_ref, nama, nik_koperasi, kode_wilayah, desa, kecamatan, kabupaten,
   provinsi, jumlah_anggota, nib, npwp, berbadan_hukum, punya_akun, status_rat,
   simpanan_pokok, simpanan_wajib, volume_transaksi, nilai_transaksi,
   pembangunan_gerai_pct, simkopdes_verified, reputation_score, is_producer)
values
  ('KOP-1B43DAA5DD35', 'KDMP Parage', '920118******00**', '36.02.17.2011', 'Parage', 'Cikulur', 'KAB. LEBAK', 'Banten', 44, '5203481766116', '000024372362812', true, true, 'belum', 4400000, 6600000, 1760, 22000000, 90, true, 91, false),
  ('KOP-4265B69C1B56', 'KDMP Calungbungur', '810815******00**', '36.02.12.2004', 'Calungbungur', 'Sajira', 'KAB. LEBAK', 'Banten', 23, '5202262565230', '000015837956610', true, true, 'belum', 2300000, 3450000, 920, 11500000, 89, true, 81, false),
  ('KOP-4F1092DC17E7', 'KDMP Pondokpanjang', '730207******00**', '36.02.26.2004', 'Pondokpanjang', 'Cihara', 'KAB. LEBAK', 'Banten', 132, '5200372653698', '000002608575886', true, true, 'belum', 13200000, 19800000, 5280, 66000000, 84, true, 79, false),
  ('KOP-773354D8C546', 'KDMP Darmasari', '200311******00**', '36.02.03.2011', 'Darmasari', 'Bayah', 'KAB. LEBAK', 'Banten', 76, '5203808021032', '000026656147224', true, true, 'belum', 7600000, 11400000, 3040, 38000000, 98, true, 75, false),
  ('KOP-F26D18E1DB49', 'KDMP Kumpay', '757103******00**', '36.02.09.2009', 'Kumpay', 'Banjarsari', 'KAB. LEBAK', 'Banten', 29, '5201488568881', '000010419982167', true, true, 'belum', 2900000, 4350000, 1160, 14500000, 89, true, 78, false),
  ('KOP-1F12A9CA1D0D', 'KDMP Cikuya', '340408******00**', '36.01.29.2010', 'Cikuya', 'Sukaresmi', 'KAB. PANDEGLANG', 'Banten', 14, '5203610138836', '000025270971852', true, true, 'belum', 1400000, 2100000, 560, 7000000, 83, true, 87, false),
  ('KOP-1FFC6F9E606E', 'KDMP Mekarsari', '131203******00**', '36.04.30.2009', 'Mekarsari', 'Anyar', 'KAB. SERANG', 'Banten', 168, '5203790468984', '000026533282888', true, true, 'belum', 16800000, 25200000, 6720, 84000000, 81, true, 79, false),
  ('KOP-4257FD47875B', 'KDMP Kamaruton', '750204******00**', '36.04.35.2001', 'Kamaruton', 'Lebak Wangi', 'KAB. SERANG', 'Banten', 131, '5200906563470', '000006345944290', true, true, 'dilaporkan', 13100000, 19650000, 5240, 65500000, 81, true, 79, false),
  ('KOP-1503549DEBD7', 'KDMP Bantar Panjang', '930104******01**', '36.03.03.2014', 'Bantar Panjang', 'Tigaraksa', 'KAB. TANGERANG', 'Banten', 116, '5202618234818', '000018327643726', true, true, 'belum', 11600000, 17400000, 4640, 58000000, 90, true, 91, false),
  ('KOP-1B7D98738E36', 'KDMP Kohod', '630706******00**', '36.03.15.2008', 'Kohod', 'Pakuhaji', 'KAB. TANGERANG', 'Banten', 16, '5200553132682', '000003871928774', true, true, 'belum', 1600000, 2400000, 640, 8000000, 91, true, 83, false),
  ('KOP-46C1BE2A1C84', 'KDMP Muncung', '750413******00**', '36.03.07.2007', 'Muncung', 'Kronjo', 'KAB. TANGERANG', 'Banten', 167, '5204270272657', '000029891908599', true, true, 'diverifikasi', 16700000, 25050000, 6680, 83500000, 80, true, 90, false),
  ('KOP-7430A16FD6F4', 'KDMP Daru', '620502******00**', '36.03.04.2005', 'Daru', 'Jambe', 'KAB. TANGERANG', 'Banten', 161, '5202419832891', '000016938830237', true, true, 'belum', 16100000, 24150000, 6440, 80500000, 94, true, 86, false),
  ('KOP-E10544F77C29', 'KDMP Tipar Raya', '360219******00**', '36.03.04.2003', 'Tipar Raya', 'Jambe', 'KAB. TANGERANG', 'Banten', 78, '5203094764598', '000021663352186', true, true, 'diverifikasi', 7800000, 11700000, 3120, 39000000, 96, true, 85, false),
  ('KOP-FA8E8FB3E4B9', 'KDMP Cikuya', '912005******00**', '36.03.31.2002', 'Cikuya', 'Solear', 'KAB. TANGERANG', 'Banten', 235, '5201169484558', '000008186391906', true, true, 'belum', 23500000, 35250000, 9400, 117500000, 98, true, 81, false),
  ('KOP-2AB060D68AD1', 'KDMP Kebonsari', '760503******01**', '36.72.08.1005', 'Kebonsari', 'Citangkil', 'KOTA CILEGON', 'Banten', 28, '5203038256736', '000021267797152', true, true, 'belum', 2800000, 4200000, 1120, 14000000, 84, true, 91, false),
  ('KOP-56533935A168', 'KDMP Kotabumi', '710601******00**', '36.72.07.1002', 'Kotabumi', 'Purwakarta', 'KOTA CILEGON', 'Banten', 181, '5201121180890', '000007848266230', true, true, 'diverifikasi', 18100000, 27150000, 7240, 90500000, 84, true, 79, false),
  ('KOP-A23F291D3EE0', 'KDMP Citangkil', '180706******00**', '36.72.08.1007', 'Citangkil', 'Citangkil', 'KOTA CILEGON', 'Banten', 68, '5204187529020', '000029312703140', true, true, 'diverifikasi', 6800000, 10200000, 2720, 34000000, 97, true, 77, false),
  ('KOP-DF571BCFB9D2', 'KDMP Rawa Arum', '980214******30**', '36.72.06.1003', 'Rawa Arum', 'Gerogol', 'KOTA CILEGON', 'Banten', 31, '5202116869790', '000014818088530', true, true, 'diverifikasi', 3100000, 4650000, 1240, 15500000, 87, true, 79, false),
  ('KOP-721CE9F7BB94', 'KDMP Poris Plawad Utara', '930111******00**', '36.71.05.1009', 'Poris Plawad Utara', 'Cipondoh', 'KOTA TANGERANG', 'Banten', 98, '5203760432942', '000026323030594', true, true, 'belum', 9800000, 14700000, 3920, 49000000, 87, true, 79, false),
  ('KOP-D5E4E83408CC', 'KDMP Bojong Jaya', '611202******00**', '36.71.07.1002', 'Bojong Jaya', 'Karawaci', 'KOTA TANGERANG', 'Banten', 41, '5200319590941', '000002237136587', true, true, 'dilaporkan', 4100000, 6150000, 1640, 20500000, 85, true, 80, false),
  ('KOP-106DD583A71F', 'KDMP Babakan', '980420******10**', '36.74.07.1005', 'Babakan', 'Setu', 'KOTA TANGERANG SELATAN', 'Banten', 51, '5202387416805', '000016711917635', true, true, 'diverifikasi', 5100000, 7650000, 2040, 25500000, 91, true, 92, false),
  ('KOP-A9AE7A455E30', 'KDMP Kademangan', '610108******00**', '36.74.07.1004', 'Kademangan', 'Setu', 'KOTA TANGERANG SELATAN', 'Banten', 127, '5202256342389', '000015794396723', true, true, 'belum', 12700000, 19050000, 5080, 63500000, 94, true, 92, false)
on conflict (koperasi_ref) do nothing;

commit;
