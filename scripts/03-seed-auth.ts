/**
 * scripts/03-seed-auth.ts — Track B
 * ---------------------------------------------------------------------------
 * TUJUAN: membuat 2 akun login demo di Supabase Auth (juri & admin), lalu
 * menautkannya ke tabel public.users (juri -> KDMP Cipare, admin -> tanpa koperasi).
 * Idempoten: bila akun sudah ada, dipakai ulang (tidak menggandakan).
 *
 * PRASYARAT:
 *   - schema.sql, seed-demo.sql sudah dijalankan di Supabase (koperasi DEMO-CIPARE ada).
 *   - .env berisi NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (dari Zaka).
 *   - @supabase/supabase-js sudah ada di package.json (ya).
 *
 * JALANKAN:  npx tsx scripts/03-seed-auth.ts
 * ---------------------------------------------------------------------------
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    )
      val = val.slice(1, -1);
    if (!(key in process.env)) process.env[key] = val;
  }
}

async function main() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Terima key rahasia format baru (sb_secret_...) maupun service_role lama.
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "\n❌ Butuh NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SECRET_KEY atau " +
        "SUPABASE_SERVICE_ROLE_KEY) di .env (minta ke Zaka/Track A).\n",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Buat user bila belum ada; kembalikan uid-nya.
  async function findOrCreate(email: string, password: string): Promise<string> {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (!error && data.user) {
      console.log(`  ✅ Akun dibuat: ${email}`);
      return data.user.id;
    }
    // Mungkin sudah ada — cari di daftar user.
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw listErr;
    const found = list.users.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (found) {
      console.log(`  ↺ Akun sudah ada, dipakai ulang: ${email}`);
      return found.id;
    }
    throw new Error(`Gagal membuat/menemukan ${email}: ${error?.message}`);
  }

  const juriEmail = process.env.DEMO_JURY_EMAIL ?? "juri@koperasihub.id";
  const juriPass = process.env.DEMO_JURY_PASSWORD ?? "demo123";
  const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin@koperasihub.id";
  const adminPass = process.env.DEMO_ADMIN_PASSWORD ?? "demo123";

  console.log("\n🔐 Menyiapkan akun login demo ...");
  const juriId = await findOrCreate(juriEmail, juriPass);
  const adminId = await findOrCreate(adminEmail, adminPass);

  // Koperasi juri = KDMP Cipare (dari seed-demo.sql).
  const { data: coop, error: coopErr } = await supabase
    .from("cooperatives")
    .select("id, nama")
    .eq("koperasi_ref", "DEMO-CIPARE")
    .maybeSingle();
  if (coopErr) throw coopErr;
  if (!coop) {
    console.error(
      "\n❌ Koperasi 'DEMO-CIPARE' belum ada. Jalankan supabase/seed-demo.sql dulu.\n",
    );
    process.exit(1);
  }

  // Tautkan ke public.users (upsert agar idempoten).
  const { error: upErr } = await supabase.from("users").upsert(
    [
      {
        id: juriId,
        cooperative_id: coop.id,
        role: "koperasi",
        display_name: "Pengurus KDMP Cipare",
      },
      { id: adminId, cooperative_id: null, role: "admin", display_name: "Admin Hub" },
    ],
    { onConflict: "id" },
  );
  if (upErr) throw upErr;

  console.log("\n✅ Selesai. Akun siap dipakai:");
  console.log(`   Juri : ${juriEmail} / ${juriPass}  → ${coop.nama} (role koperasi)`);
  console.log(`   Admin: ${adminEmail} / ${adminPass}  → role admin\n`);
}

main().catch((e) => {
  console.error("\n❌ Error: " + (e as Error).message);
  process.exit(1);
});
