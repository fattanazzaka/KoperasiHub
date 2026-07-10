import { logoutAction } from "@/app/actions/auth";
import { AdminPoolControl } from "@/components/admin-pool-control";
import { BrandMark } from "@/components/brand-mark";
import type { PoolSummary } from "@/lib/pool-types";

type AdminHubProps = {
  pools: PoolSummary[];
  issuedPoolIds: string[];
};

export function AdminHub({ pools, issuedPoolIds }: AdminHubProps) {
  const eligibleCount = pools.filter(
    (pool) =>
      pool.progress.eligibleTier &&
      pool.status !== "po_issued" &&
      !issuedPoolIds.includes(pool.id),
  ).length;

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

      <section className="admin-content">
        <div className="identity-row">
          <div>
            <p className="eyebrow">Kontrol pengadaan bersama</p>
            <h1>Admin Hub</h1>
          </div>
          <span className="admin-ready-count">
            {eligibleCount} pool siap diterbitkan
          </span>
        </div>

        <div className="admin-pool-list">
          {pools.map((pool) => (
            <AdminPoolControl
              key={pool.id}
              pool={pool}
              issued={issuedPoolIds.includes(pool.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
