"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  issuePoAction,
  type IssuePoState,
} from "@/app/actions/procurement";
import type { PoolSummary } from "@/lib/pool-types";

type AdminPoolControlProps = {
  pool: PoolSummary;
  issued: boolean;
};

const initialState: IssuePoState = { error: null };

export function AdminPoolControl({ pool, issued }: AdminPoolControlProps) {
  const action = issuePoAction.bind(null, pool.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleTier = pool.progress.eligibleTier;
  const targetTier = pool.progress.targetTier;
  const isIssued = issued || pool.status === "po_issued";
  const isReady = Boolean(eligibleTier) && !isIssued;
  const status = isIssued
    ? { label: "PO terbit", modifier: "issued" }
    : isReady
      ? { label: "Siap diterbitkan", modifier: "ready" }
      : pool.status === "locked"
        ? { label: "Pool dikunci", modifier: "locked" }
        : { label: "Mengumpulkan demand", modifier: "open" };
  const displayedTier = isReady || isIssued ? (eligibleTier ?? targetTier) : targetTier;
  const targetVolume = displayedTier?.minVolume ?? pool.totalVolume;
  const displayedProgress = isReady || isIssued ? 100 : pool.progress.progressPercent;
  const progressLabel = displayedTier
    ? `${pool.totalVolume.toLocaleString("id-ID")} dari ${targetVolume.toLocaleString("id-ID")} ${pool.unit}`
    : `${pool.totalVolume.toLocaleString("id-ID")} ${pool.unit}`;

  return (
    <article className={`admin-pool-card admin-pool-card--${status.modifier}`}>
      <div className="admin-pool-card__topline">
        <span className={`admin-status admin-status--${status.modifier}`}>
          <span aria-hidden="true" />
          {status.label}
        </span>
        <span className="admin-pool-card__deadline">
          {pool.daysRemaining > 0
            ? `${pool.daysRemaining} hari tersisa`
            : "Periode berakhir"}
        </span>
      </div>

      <div className="admin-pool-card__info">
        <div>
          <h2>{pool.commodityName}</h2>
          <p>Klaster {pool.wilayah}</p>
        </div>
        <span className="admin-pool-card__participants">
          {pool.participantCount} koperasi
        </span>
      </div>

      <div className="admin-pool-progress">
        <div className="admin-pool-progress__copy">
          <span>{isReady || isIssued ? "Volume terkumpul" : "Menuju Ambang Tier"}</span>
          <strong>{progressLabel}</strong>
        </div>
        <div
          className="admin-pool-progress__track"
          role="progressbar"
          aria-label={`Progres pool ${pool.commodityName}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayedProgress}
        >
          <span style={{ width: `${displayedProgress}%` }} />
        </div>
        <div className="admin-pool-progress__meta">
          <span>{displayedProgress}%</span>
          {!isReady && !isIssued && pool.progress.remainingVolume > 0 ? (
            <span>
              Kurang {pool.progress.remainingVolume.toLocaleString("id-ID")} {pool.unit}
            </span>
          ) : (
            <span>Ambang Tier tercapai</span>
          )}
        </div>
      </div>

      <div className="admin-pool-card__tier">
        <div>
          <span>{eligibleTier ? "Tier terbaik tersedia" : "Target berikutnya"}</span>
          <strong>
            {displayedTier?.name ?? "Belum tersedia"}
          </strong>
        </div>
        {displayedTier ? (
          <div className="admin-pool-card__price">
            <span>Harga per {pool.unit}</span>
            <strong>
              Rp{displayedTier.pricePerUnit.toLocaleString("id-ID")}
            </strong>
          </div>
        ) : null}
      </div>

      {isIssued ? (
        <Link className="admin-po-link" href={`/po/${pool.id}`}>
          <span>Lihat PO Konsolidasi</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      ) : (
        <form action={formAction}>
          <button type="submit" disabled={!isReady || isPending}>
            <span>
              {isPending ? "Menerbitkan PO…" : "Kunci Pool & Terbitkan PO"}
            </span>
            {!isPending ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 12h12M13 7l5 5-5 5" />
              </svg>
            ) : null}
          </button>
          {!isReady ? (
            <p className="admin-action-note">
              Tombol aktif setelah Ambang Tier tercapai.
            </p>
          ) : null}
        </form>
      )}

      {state.error ? (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </article>
  );
}
