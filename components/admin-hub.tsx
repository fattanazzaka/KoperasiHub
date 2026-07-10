import { logoutAction } from "@/app/actions/auth";
import { AdminPoolControl } from "@/components/admin-pool-control";
import { BrandMark } from "@/components/brand-mark";
import type { PoolSummary } from "@/lib/pool-types";

type AdminHubProps = {
  pools: PoolSummary[];
  issuedPoolIds: string[];
};

export function AdminHub({ pools, issuedPoolIds }: AdminHubProps) {
  const issuedIds = new Set(issuedPoolIds);
  const eligibleCount = pools.filter(
    (pool) =>
      pool.progress.eligibleTier &&
      pool.status !== "po_issued" &&
      !issuedIds.has(pool.id),
  ).length;
  const openCount = pools.filter((pool) => pool.status === "open").length;
  const issuedCount = pools.filter(
    (pool) => pool.status === "po_issued" || issuedIds.has(pool.id),
  ).length;

  return (
    <main className="role-page">
      <header className="role-header">
        <div className="role-header__brand">
          <BrandMark size="compact" />
          <span>KoperasiHub</span>
        </div>
        <div className="admin-header__actions">
          <span className="admin-role-badge">Admin Hub</span>
          <form action={logoutAction}>
            <button className="text-button" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <section className="admin-content">
        <div className="admin-intro">
          <p className="eyebrow">Kontrol Pengadaan Bersama</p>
          <div className="admin-intro__heading">
            <div>
              <h1>Pusat Kendali Pool</h1>
              <p>
                Pantau Ambang Tier, kunci pool yang memenuhi syarat, lalu terbitkan
                PO Konsolidasi.
              </p>
            </div>
            <span className="admin-ready-count">
              <span aria-hidden="true" />
              {eligibleCount} siap ditindaklanjuti
            </span>
          </div>
        </div>

        <dl className="admin-overview" aria-label="Ringkasan operasional pool">
          <div>
            <dt>Pool aktif</dt>
            <dd>{openCount}</dd>
            <span>Dalam periode pengumpulan</span>
          </div>
          <div className="admin-overview__ready">
            <dt>Siap diterbitkan</dt>
            <dd>{eligibleCount}</dd>
            <span>Ambang Tier telah tercapai</span>
          </div>
          <div>
            <dt>PO terbit</dt>
            <dd>{issuedCount}</dd>
            <span>Pengadaan telah diproses</span>
          </div>
        </dl>

        <section className="admin-pools" aria-labelledby="admin-pools-title">
          <div className="admin-section-heading">
            <div>
              <p className="eyebrow">Antrean Operasional</p>
              <h2 id="admin-pools-title">Pool Permintaan</h2>
            </div>
            <span>{pools.length} pool</span>
          </div>

          {pools.length ? (
            <div className="admin-pool-list">
              {pools.map((pool) => (
                <AdminPoolControl
                  key={pool.id}
                  pool={pool}
                  issued={issuedIds.has(pool.id)}
                />
              ))}
            </div>
          ) : (
            <div className="admin-empty-state">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" />
                  <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
                </svg>
              </span>
              <h3>Belum ada Pool Permintaan</h3>
              <p>Pool baru akan muncul saat koperasi mengajukan kebutuhan.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
