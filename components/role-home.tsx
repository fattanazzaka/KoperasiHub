import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { PoolCard } from "@/components/pool-card";
import { RecommendationCards } from "@/components/recommendation-cards";
import type { AuthContext } from "@/lib/auth";
import type { PoolSummary } from "@/lib/pool-types";
import type { CooperativeAllocation } from "@/lib/procurement-types";

type RoleHomeProps = {
  auth: AuthContext;
  pools: PoolSummary[];
  allocations: CooperativeAllocation[];
};

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function RoleHome({ auth, pools, allocations }: RoleHomeProps) {
  const totalSavings = allocations.reduce(
    (total, item) => total + item.allocation.savings,
    0,
  );
  const activePools = pools.filter((pool) => pool.status === "open");
  const priorityPools = [...activePools]
    .sort((a, b) => b.progress.progressPercent - a.progress.progressPercent)
    .slice(0, 2);

  return (
    <main className="role-page">
      <header className="role-header">
        <div className="role-header__brand">
          <BrandMark size="compact" />
          <span>KoperasiHub</span>
        </div>
        <form action={logoutAction}>
          <button className="text-button" type="submit">
            Keluar
          </button>
        </form>
      </header>

      <section className="role-content">
        <div className="identity-row">
          <div>
            <p className="eyebrow">Beranda koperasi</p>
            <h1>{auth.cooperative?.nama}</h1>
            <p className="identity-row__location">
              {auth.cooperative?.kabupaten}, {auth.cooperative?.provinsi}
            </p>
          </div>
          {auth.cooperative?.simkopdesVerified ? (
            <span className="verified-badge">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m6 10 2.4 2.4L14 7" />
              </svg>
              Terverifikasi SIMKOPDES
            </span>
          ) : null}
        </div>

        <dl className="home-summary" aria-label="Ringkasan koperasi">
          <div>
            <dt>Total hemat</dt>
            <dd className="is-savings">{formatRupiah(totalSavings)}</dd>
            <span>Dari PO yang sudah terbit</span>
          </div>
          <div>
            <dt>Pool aktif</dt>
            <dd>{activePools.length}</dd>
            <span>Di jaringan pengadaan</span>
          </div>
          <div>
            <dt>PO diikuti</dt>
            <dd>{allocations.length}</dd>
            <span>Dengan Alokasi Proporsional</span>
          </div>
        </dl>

        <div className="home-workspace">
          <section className="home-workspace__main">
            <RecommendationCards />
          </section>

          <section className="home-pools" aria-labelledby="home-pools-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Perlu perhatian</p>
                <h2 id="home-pools-title">Pool terdekat ke target</h2>
              </div>
              <Link href="/pool">Lihat semua</Link>
            </div>
            <div className="home-pools__list">
              {priorityPools.map((pool) => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
