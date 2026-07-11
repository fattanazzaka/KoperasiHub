import Link from "next/link";

import type { PoolSummary } from "@/lib/pool-types";

type PoolCardProps = {
  pool: PoolSummary;
};

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

export function PoolCard({ pool }: PoolCardProps) {
  const target = pool.progress.targetTier;
  const isNear =
    !pool.progress.targetReached && pool.progress.progressPercent >= 80;
  const deadline =
    pool.daysRemaining === 0
      ? "Tutup hari ini"
      : `Tutup dalam ${pool.daysRemaining} hari`;

  return (
    <Link
      className={`pool-card${isNear ? " is-near" : ""}`}
      href={`/pool/${pool.id}`}
    >
      <div className="pool-card__topline">
        <div>
          <h2>{pool.commodityName}</h2>
          <p>Klaster {pool.wilayah}</p>
        </div>
        {pool.progress.targetReached ? (
          <span className="pool-card__status is-reached">Tier tercapai</span>
        ) : isNear ? (
          <span className="pool-card__status">Hampir tercapai</span>
        ) : null}
      </div>

      {target ? (
        <>
          <div className="pool-card__progress" aria-hidden="true">
            <span style={{ width: `${pool.progress.progressPercent}%` }} />
          </div>
          <p className="pool-card__volume">
            <strong>{formatNumber(pool.totalVolume)}</strong> /{" "}
            {formatNumber(target.minVolume)} {pool.unit}
          </p>
        </>
      ) : (
        <p className="pool-card__empty-tier">Menunggu tier harga dari jaringan supplier.</p>
      )}

      <div className="pool-card__meta">
        <span>{deadline}</span>
        <span>{pool.participantCount} koperasi peserta</span>
      </div>
    </Link>
  );
}
