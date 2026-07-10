# Tech Stack & Struktur Folder FINAL — KoperasiHub

> Dokumen keputusan. Tidak ada perubahan stack setelah ini kecuali blocker nyata di
> sprint. Hierarki: CLAUDE.md > dokumen ini > preferensi pribadi.

## 1. Keputusan arsitektur (dengan alasan)

**Prinsip: fasilitas panitia = sumber data, BUKAN infrastruktur runtime.**

| Komponen | Keputusan | Alasan |
|---|---|---|
| Frontend + backend | **Next.js (App Router, TypeScript)** — satu aplikasi, server actions untuk mutasi | 1 repo, 1 deploy, tercepat untuk 1 dev inti |
| Database aplikasi | **Supabase (Postgres + Auth + RLS)** milik tim | Auth & multi-tenant jadi dalam menit; kendali penuh; tidak terganggu 99 tim lain |
| Dataset resmi (shared DB panitia) | **Sumber snapshot saja** — diakses HANYA oleh script ETL (Track B), sekali di awal sprint | Dipakai 100 tim satu kredensial = anggap tidak stabil & publik; runtime tidak boleh bergantung padanya |
| Google Cloud Credit $60 | **TIDAK dipakai untuk runtime MVP.** Amankan akunnya (login sekali, ganti password), lalu biarkan | Setup GCP memakan jam berharga tanpa menambah nilai juri; arsitektur kalian (plain Postgres) portabel ke Cloud SQL — sebut di README/deck sebagai jalur produksi, itu cukup "memanfaatkan" secara narasi |
| Deploy | **Vercel**, auto-deploy dari `main` | Nol konfigurasi; `main` = selalu demo-able |
| UI | **Tailwind CSS + shadcn/ui** | Komponen jadi + tetap bisa ikuti design tokens docs/05 |
| Font | **Plus Jakarta Sans + Inter** via `next/font/google` | Sesuai docs/05 §2 |
| PWA | `manifest.json` + ikon (tanpa service worker rumit) | Cukup untuk terasa app-like di HP juri |
| ETL/seed | **Script TypeScript** dijalankan `tsx`, koneksi via `pg`, env via `dotenv` | Bisa dipandu Claude Code langkah-demi-langkah untuk operator non-programmer |
| ORM | **TIDAK ADA** — `schema.sql` ditulis tangan, query via Supabase client / SQL | Prisma/Drizzle menambah codegen & friksi migrasi di sprint |
| State/data-fetching lib | **TIDAK ADA** — server components + server actions | Skala MVP tidak butuh react-query/zustand |
| Chart lib | **TIDAK ADA** — Tangga Tier & progress = komponen custom (div+CSS) | Sesuai docs/05; angka admin P2 cukup teks |
| Validasi form | Manual di server action (2 form saja) | zod opsional, bukan dependensi wajib |
| Testing | Tidak ada test suite (sesuai CLAUDE.md) | Verifikasi = jalankan alur demo |

**Dependensi lengkap (final):** `next`, `react`, `react-dom`, `@supabase/supabase-js`,
`@supabase/ssr`, `tailwindcss`, shadcn/ui (+`lucide-react`), dev: `typescript`, `tsx`,
`pg`, `@types/pg`, `dotenv`. Tidak menambah paket lain tanpa alasan tertulis di SIAP COMMIT.

## 2. Environment variables (nama final — nilai HANYA di .env & Vercel)

```
# Supabase tim (runtime)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server & scripts saja, JANGAN bocor ke client

# Shared DB panitia (HANYA scripts/ ETL — tidak pernah dipakai runtime)
OFFICIAL_DB_HOST=
OFFICIAL_DB_PORT=5432
OFFICIAL_DB_DATABASE=
OFFICIAL_DB_USERNAME=
OFFICIAL_DB_PASSWORD=
```
`.env` di .gitignore sejak commit pertama. `.env.example` berisi nama variabel saja.
Repo PUBLIK — satu kredensial ter-commit = fatal.

## 3. Struktur folder FINAL (dengan kepemilikan track)

```
koperasihub/
├── CLAUDE.md                       # konstitusi proyek
├── README.md                       # [B]
├── prompt-track-A.md               # prompt sesi Claude Code Zaka
├── prompt-track-B.md               # prompt sesi Claude Code rekan
├── .env.example                    # [A] nama variabel tanpa nilai
├── .gitignore                      # .env, node_modules, .next
├── package.json / next.config / tailwind.config / tsconfig   # [A]
│
├── docs/                           # 00–07 (07 dibuat Track B pasca-ETL)
│
├── supabase/
│   ├── schema.sql                  # [A — KONTRAK antar-track, B hanya membaca]
│   ├── seed-snapshot.sql           # [B] hasil ETL dataset resmi
│   └── seed-demo.sql               # [B] koreografi 3 pool + PO historis + users
│
├── scripts/                        # [B] — dijalankan `npx tsx scripts/xx.ts`
│   ├── 00-cek-koneksi.ts           # uji shared DB + hitung baris per tabel
│   ├── 01-snapshot.ts              # tarik tabel resmi → Supabase
│   ├── 02-pilih-klaster.ts         # pilih kabupaten demo + koperasi juri
│   ├── 03-seed-demo.ts             # generate pools/demands/PO historis
│   └── 04-bekukan-angka.ts         # query ringkasan → docs/07-angka-demo-final.md
│
├── public/                         # [A] manifest.json, ikon PWA, logo
│
├── app/
│   ├── layout.tsx  globals.css     # [A] font, tokens docs/05
│   ├── page.tsx                    # [A] redirect → /login atau /beranda
│   ├── login/page.tsx              # [A] US-01 (+ kartu kredensial juri)
│   ├── (koperasi)/                 # [A] route group ber-auth role koperasi
│   │   ├── beranda/page.tsx        #     docs/05 §4.2
│   │   ├── pool/page.tsx           #     daftar pool §4.3
│   │   ├── pool/[id]/page.tsx      #     detail + Tangga Tier §4.4 (HERO)
│   │   ├── ajukan/page.tsx         #     form US-02/US-04 §4.5
│   │   └── po/
│   │       ├── page.tsx            #     alokasi saya §4.7
│   │       └── [id]/page.tsx       #     PO Konsolidasi print view §4.6
│   ├── admin/                      # [B] dashboard agregat + tombol kunci pool §4.9
│   └── settlement/                 # [B] panel Net Settlement §4.8 (P1)
│
├── components/                     # [A]
│   ├── ui/                         # shadcn
│   ├── tangga-tier.tsx             # signature element + koreografi §5
│   ├── kartu-pool.tsx
│   ├── label-supplier.tsx          # [Distributor]/[BUMN Pangan]/[Koperasi Produsen]
│   └── nav-bawah.tsx
│
└── lib/                            # [A]
    ├── supabase/client.ts  server.ts
    ├── engine/pooling.ts           # agregasi, ambang tier, status pool
    ├── engine/fee.ts               # 5% × (baseline − tier) × volume
    ├── engine/alokasi.ts           # split proporsional
    ├── format.ts                   # formatRupiah, tabular-nums helper
    └── dev-fixture.ts              # 5 koperasi dummy — DIHAPUS saat seed asli masuk
```

Aturan kepemilikan (identik dengan prompt track): [A] = hanya Track A yang menulis,
[B] = hanya Track B. Konflik struktural mustahil selama peta ini dipatuhi.

## 4. Model branch (final, ringan)

- `main` = selalu deploy-able & demo-able (Vercel auto-deploy dari sini).
- **Track A commit langsung ke `main`** (commit manual oleh Zaka di tiap SIAP COMMIT).
- **Track B bekerja di branch `data-etl`** selama fase berisiko (scripts 00–03).
  Merge ke `main` oleh **Zaka** di dua titik: (1) setelah seed final teruji, (2) bila
  ada perubahan besar berikutnya. Setelah seed stabil, Track B boleh langsung di `main`
  (README, app/admin, app/settlement — file-file milik B semua, risiko konflik nol).
- Kebiasaan wajib dua-duanya: `git pull` sebelum setiap commit.
- Claude di kedua track TIDAK menjalankan perintah git yang mengubah state — manusia
  yang mengetik `git checkout -b`, `git merge`, `git commit`.

## 5. Urutan setup hari-H (30 menit pertama, sebelum track berpisah)

1. Zaka: buat repo publik + push kerangka (CLAUDE.md, docs/, prompts, .gitignore,
   .env.example). 2. Zaka: buat project Supabase, catat kredensial ke .env berdua.
3. Zaka: init Next.js + Tailwind + shadcn, push, hubungkan Vercel (set env di Vercel).
4. Rekan: clone, isi .env, `git checkout -b data-etl`, buka sesi Claude Code Track B.
5. Zaka: buka sesi Claude Code Track A → Langkah 0. 6. (Kapan saja) login akun Google
   panitia sekali, ganti password default, simpan — tidak dipakai lagi.
