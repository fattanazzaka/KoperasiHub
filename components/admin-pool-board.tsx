"use client";

import { useState } from "react";

import { AdminPoolControl } from "@/components/admin-pool-control";
import type { PoolSummary } from "@/lib/pool-types";

type AdminPoolBoardProps = {
  pools: PoolSummary[];
  issuedPoolIds: string[];
};

type PoolFilter = "ready" | "active" | "issued";

const filterLabels: Record<PoolFilter, { label: string; description: string }> = {
  ready: {
    label: "Siap diproses",
    description: "Ambang Tier tercapai dan menunggu penerbitan PO.",
  },
  active: {
    label: "Masih aktif",
    description: "Demand masih dikumpulkan menuju Ambang Tier.",
  },
  issued: {
    label: "PO terbit",
    description: "Pool yang sudah selesai diproses oleh Admin Hub.",
  },
};

export function AdminPoolBoard({ pools, issuedPoolIds }: AdminPoolBoardProps) {
  const issuedIds = new Set(issuedPoolIds);
  const groups: Record<PoolFilter, PoolSummary[]> = {
    ready: pools.filter(
      (pool) =>
        Boolean(pool.progress.eligibleTier) &&
        pool.status !== "po_issued" &&
        !issuedIds.has(pool.id),
    ),
    active: pools.filter(
      (pool) =>
        pool.status !== "po_issued" &&
        !issuedIds.has(pool.id) &&
        !pool.progress.eligibleTier,
    ),
    issued: pools.filter(
      (pool) => pool.status === "po_issued" || issuedIds.has(pool.id),
    ),
  };
  const [filter, setFilter] = useState<PoolFilter>(
    groups.ready.length
      ? "ready"
      : groups.active.length
        ? "active"
        : "issued",
  );
  const visiblePools = groups[filter];

  return (
    <section className="admin-pools" aria-labelledby="admin-pools-title">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">Antrean operasional</p>
          <h2 id="admin-pools-title">Pool Permintaan</h2>
        </div>
        <span>{pools.length} pool tercatat</span>
      </div>

      <div className="admin-pool-tabs" role="tablist" aria-label="Status pool">
        {(Object.keys(filterLabels) as PoolFilter[]).map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={filter === item}
            className={filter === item ? "is-active" : undefined}
            onClick={() => setFilter(item)}
            key={item}
          >
            <span>{filterLabels[item].label}</span>
            <strong>{groups[item].length}</strong>
          </button>
        ))}
      </div>

      <div className="admin-pool-board__intro">
        <p>{filterLabels[filter].description}</p>
        <span>{visiblePools.length} hasil</span>
      </div>

      {visiblePools.length ? (
        <div className="admin-pool-list">
          {visiblePools.map((pool) => (
            <AdminPoolControl
              key={pool.id}
              pool={pool}
              issued={issuedIds.has(pool.id)}
            />
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <h3>Tidak ada pool dalam status ini</h3>
          <p>Pilih status lain untuk melihat antrean operasional.</p>
        </div>
      )}
    </section>
  );
}
