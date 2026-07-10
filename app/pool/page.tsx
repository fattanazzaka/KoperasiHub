import Link from "next/link";
import { redirect } from "next/navigation";

import { PoolCard } from "@/components/pool-card";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getPoolDetails } from "@/lib/pools";

export const metadata = {
  title: "Pool Permintaan",
};

export default async function PoolListPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi") {
    redirect(getRoleDestination(auth.role));
  }

  const pools = await getPoolDetails(auth);

  return (
    <main className="pool-page">
      <header className="form-header">
        <Link href="/beranda" aria-label="Kembali ke Beranda">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1>Pool Permintaan</h1>
      </header>

      <section className="pool-list">
        <div className="pool-list__intro">
          <p className="eyebrow">Pengadaan bersama</p>
          <h2>Pool aktif di jaringan Anda</h2>
          <p>Pantau volume terkumpul dan Ambang Tier berikutnya.</p>
        </div>

        {pools.length ? (
          <div className="pool-list__cards">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <div className="pool-list__empty">
            <h2>Belum ada pool di wilayah Anda</h2>
            <p>Ajukan kebutuhan pertama untuk membuka Pool Permintaan.</p>
            <Link className="primary-link" href="/ajukan">
              Ajukan kebutuhan
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
