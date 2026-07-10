# KoperasiHub

**Infrastruktur B2B Pengadaan Bersama lintas Koperasi Desa Merah Putih (KDMP).**

Koperasi desa yang baru dan kecil tidak punya *buying power* untuk menembus harga grosir.
KoperasiHub mengagregasi permintaan banyak koperasi per komoditas + wilayah + jendela
waktu. Saat volume gabungan menembus **Ambang Tier** grosir, sistem menerbitkan
**PO Konsolidasi** ke supplier, lalu membagi pasokan kembali ke tiap koperasi lewat
**Alokasi Proporsional** — masing-masing melihat rupiah yang dihemat.

Slot supplier dalam satu mesin yang sama bisa diisi distributor, BUMN pangan, **atau
koperasi lain yang surplus komoditas** (cross-supply = perluasan Jaringan Supplier).
Asset-light, siap integrasi SIMKOPDES. Bukan marketplace, bukan barter.

> Dibangun untuk Final Hackathon Digital Cooperatives Expo 2026 (Kemenkop RI × PEBS FEB UI).
> Tema 1: Peningkatan Volume Usaha Koperasi.

---

## 1. Arsitektur

**Prinsip inti:** fasilitas data panitia = *sumber snapshot*, **bukan** infrastruktur
runtime. Dataset resmi 27 tabel (SIMKOPDES) di-*snapshot* SEKALI di awal oleh script ETL
Track B ke Supabase tim; aplikasi runtime **hanya** membaca Supabase — tidak pernah
menyentuh shared DB panitia (yang dipakai bersama 100 tim dan dianggap tidak stabil).

```
   ┌─────────────────────────┐        ETL (sekali, scripts/*.ts)
   │  Shared DB Panitia       │   ─────────────────────────────────►  ┌──────────────────┐
   │  (SIMKOPDES, 27 tabel)   │   snapshot + pilih klaster + baseline  │  Supabase (tim)  │
   │  READ-ONLY               │                                        │  Postgres + Auth  │
   └─────────────────────────┘                                        │  + RLS multi-tenant│
                                                                       └────────┬─────────┘
                                                                                │ (runtime: baca saja)
                                                                                ▼
                                            ┌──────────────────────────────────────────────┐
                                            │  Next.js (App Router, TypeScript)              │
                                            │  Server Components + Server Actions            │
                                            │  ── Pooling Engine  (agregasi & Ambang Tier)   │
                                            │  ── Fee Engine      (5% × penghematan)         │
                                            │  ── Alokasi Engine  (split proporsional)       │
                                            │  UI: Tailwind + shadcn/ui · PWA · mobile-first │
                                            └──────────────────────────────────────────────┘
                                                                                │
                                                                                ▼
                                                                    Deploy: Vercel (auto)
```

**Alur inti yang didemokan (<3 menit):** koperasi mengajukan kebutuhan → pool bergerak
85% → 100% → PO Konsolidasi terbit → tiap koperasi melihat Alokasi + rupiah dihemat.

### Stack
| Lapis | Pilihan |
|---|---|
| Frontend + backend | Next.js 16 (App Router, TypeScript), Server Actions |
| Database aplikasi | Supabase (Postgres + Auth + Row Level Security) |
| UI | Tailwind CSS + shadcn/ui, mobile-first, PWA manifest |
| ETL / seed | Script TypeScript (`pg`), dijalankan dengan `tsx` |
| Deploy | Vercel (auto-deploy dari `main`) |

Tanpa ORM, tanpa react-query, tanpa chart library — Tangga Tier adalah komponen custom.

---

## 2. Panduan Instalasi (menjalankan lokal)

**Prasyarat:** Node.js ≥ 20.19.

```bash
# 1. Pasang dependensi
npm install

# 2. Siapkan environment
cp .env.example .env
#    lalu isi nilai kredensial di .env (lihat daftar variabel di bawah)

# 3. Jalankan server pengembangan
npm run dev
#    buka http://localhost:3000
```

### Variabel environment (isi di `.env` — JANGAN commit)
`.env` sudah masuk `.gitignore`. Repo ini **publik** — satu kredensial ter-commit = fatal.

```
# Supabase tim (runtime aplikasi)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server & script seed saja — jangan bocor ke client

# Akun demo untuk juri (dipakai script seed auth)
DEMO_JURY_EMAIL=juri@koperasihub.id
DEMO_JURY_PASSWORD=demo123
DEMO_ADMIN_EMAIL=admin@koperasihub.id
DEMO_ADMIN_PASSWORD=demo123

# Shared DB panitia — HANYA dipakai script ETL (scripts/), tidak pernah runtime
OFFICIAL_DB_HOST=
OFFICIAL_DB_PORT=5432
OFFICIAL_DB_DATABASE=
OFFICIAL_DB_USERNAME=
OFFICIAL_DB_PASSWORD=
```

### Menyiapkan database aplikasi (Supabase)
```bash
# Terapkan skema aplikasi ke project Supabase (via SQL editor atau psql):
#   jalankan isi supabase/schema.sql

# (Track B) Isi data snapshot + demo:
#   jalankan supabase/seed-snapshot.sql lalu supabase/seed-demo.sql
```

### Script ETL (Track B — opsional, hanya untuk regenerasi seed)
```bash
npm install --no-save pg tsx          # paket pendukung ETL (tidak mengubah package.json)
npx tsx scripts/00-cek-koneksi.ts     # uji koneksi shared DB + hitung baris tiap tabel
```

---

## 3. Demo & Akun Uji Juri

- **URL demo:** _(diisi setelah deploy Vercel)_
- **Akun koperasi (juri):** `juri@koperasihub.id` / `demo123` → KDMP Karangmalang, Sragen
- **Akun admin hub:** `admin@koperasihub.id` / `demo123`

Login juri sudah berisi data (pool aktif klaster beras Sragen + PO historis), sehingga
juri bisa langsung memerankan pengurus koperasi tanpa perlu dipandu.

---

## 4. Disclosure Penggunaan AI

Sesuai aturan lomba: **Claude Code** (Anthropic) digunakan sebagai asisten *coding* dan
*debugging* selama sprint pengembangan. Seluruh gagasan produk, konsep bisnis, keputusan
desain, riset kebijakan, dan angka dampak berasal dari tim; AI dipakai untuk mempercepat
implementasi teknis, bukan untuk merumuskan strategi atau klaim.

---

## 5. Struktur Ringkas

```
app/            # Next.js App Router — layar koperasi, admin, settlement
components/     # Tangga Tier, kartu pool, label supplier, dsb.
lib/            # engine pooling / fee / alokasi, klien Supabase
scripts/        # [Track B] ETL & seed: 00-cek-koneksi … 04-bekukan-angka
supabase/       # schema.sql (kontrak) + seed-snapshot.sql + seed-demo.sql
docs/           # spesifikasi produk, data, desain, model bisnis (00–07)
```

---

_Sumber harga jangkar: BPS Mei 2026 (beras: eceran Rp15.358 / grosir Rp14.574 /
penggilingan Rp13.765 per kg) dan Permendag 18/2024 (MinyaKita). Angka demo final
dibekukan di `docs/07-angka-demo-final.md` setelah ETL._
