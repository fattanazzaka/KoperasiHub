"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PoolDetail } from "@/lib/pool-types";

type PoolDetailViewProps = {
  pool: PoolDetail;
};

const supplierLabels = {
  bumn: "BUMN Pangan",
  distributor: "Distributor",
  koperasi: "Koperasi Produsen",
} as const;

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

function formatRupiah(value: number): string {
  return `Rp${formatNumber(value)}`;
}

export function PoolDetailView({ pool }: PoolDetailViewProps) {
  const isAchievement = Boolean(pool.progress.newlyReachedTierId);
  const target = pool.progress.targetTier;
  const previousVolume = Math.max(0, pool.totalVolume - pool.userDemandVolume);
  const initialProgress =
    isAchievement && target
      ? Math.min(100, Math.round((previousVolume / target.minVolume) * 100))
      : pool.progress.progressPercent;
  const [progressPercent, setProgressPercent] = useState(initialProgress);
  const [animatedSavings, setAnimatedSavings] = useState(
    isAchievement ? 0 : pool.estimatedSavings,
  );

  useEffect(() => {
    if (!isAchievement) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      const reducedMotionFrame = window.requestAnimationFrame(() => {
        setProgressPercent(pool.progress.progressPercent);
        setAnimatedSavings(pool.estimatedSavings);
      });

      return () => window.cancelAnimationFrame(reducedMotionFrame);
    }

    const progressFrame = window.requestAnimationFrame(() => {
      setProgressPercent(pool.progress.progressPercent);
    });
    const startedAt = performance.now();
    let savingsFrame = 0;

    const updateSavings = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 800);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedSavings(Math.round(pool.estimatedSavings * eased));

      if (progress < 1) {
        savingsFrame = window.requestAnimationFrame(updateSavings);
      }
    };

    savingsFrame = window.requestAnimationFrame(updateSavings);

    return () => {
      window.cancelAnimationFrame(progressFrame);
      window.cancelAnimationFrame(savingsFrame);
    };
  }, [isAchievement, pool.estimatedSavings, pool.progress.progressPercent]);

  const progressCopy = !target
    ? "Tier harga belum tersedia"
    : pool.progress.targetReached
      ? `Ambang Tier ${target.name} tercapai`
      : `Kurang ${formatNumber(pool.progress.remainingVolume)} ${pool.unit} lagi menuju harga ${target.name.toLowerCase()}`;

  return (
    <div className="pool-detail">
      <section className="pool-detail__intro">
        <h1>
          {pool.commodityName} — Klaster {pool.wilayah}
        </h1>
        <div>
          <span>
            {pool.daysRemaining === 0
              ? "Tutup hari ini"
              : `Tutup dalam ${pool.daysRemaining} hari`}
          </span>
          <span>{pool.participantCount} koperasi peserta</span>
        </div>
      </section>

      <section className="tier-card" aria-labelledby="tier-heading">
        <h2 id="tier-heading">Tangga Tier</h2>

        <article className="baseline-step">
          <div>
            <strong>
              {pool.userDemandVolume ? "Baseline Anda" : "Baseline contoh"}
            </strong>
            <span>harga beli sendiri saat ini</span>
          </div>
          <p>
            {pool.userBaselinePrice
              ? formatRupiah(pool.userBaselinePrice)
              : "Belum tersedia"}
            {pool.userBaselinePrice ? <small>/{pool.unit}</small> : null}
          </p>
        </article>

        {pool.tiers.length ? (
          <div className="tier-steps">
            {pool.tiers.map((tier, index) => {
              const isTarget = target?.id === tier.id;
              const reached = pool.totalVolume >= tier.minVolume;
              const newlyReached = pool.progress.newlyReachedTierId === tier.id;

              return (
                <article
                  className={`tier-step${isTarget ? " is-target" : ""}${
                    newlyReached ? " is-achieved" : ""
                  }${!reached && !isTarget ? " is-locked" : ""}`}
                  key={tier.id}
                  style={{ marginLeft: `${Math.min(40, (index + 1) * 20)}px` }}
                >
                  <div>
                    <div className="tier-step__name">
                      {!reached && !isTarget ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="10" width="16" height="11" rx="2" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : null}
                      <strong>Tier {tier.name}</strong>
                      {newlyReached ? <span>TERCAPAI</span> : null}
                      {isTarget && !reached ? <span>TIER AKTIF</span> : null}
                    </div>
                    <small>
                      {!reached && !isTarget ? "TERKUNCI · " : ""}min{" "}
                      {formatNumber(tier.minVolume)} {pool.unit}
                      {isTarget ? ` · posisi ${formatNumber(pool.totalVolume)} ${pool.unit}` : ""}
                    </small>
                  </div>
                  <p>
                    {formatRupiah(tier.pricePerUnit)}
                    <small>/{pool.unit}</small>
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="tier-empty">
            Jaringan supplier sedang menyiapkan Ambang Tier untuk pool ini.
          </div>
        )}

        <div className="hero-progress">
          <div className="hero-progress__track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="hero-progress__copy">
            <strong>{progressCopy}</strong>
            {target ? (
              <span>
                {formatNumber(pool.totalVolume)} / {formatNumber(target.minVolume)}{" "}
                {pool.unit}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="savings-card">
        <p>
          {pool.progress.targetReached
            ? "Hemat Anda — Ambang Tier tercapai"
            : "Estimasi hemat Anda di tier ini"}
        </p>
        {pool.userDemandVolume && target ? (
          <>
            <strong>{formatRupiah(animatedSavings)}</strong>
            <small>
              kebutuhan Anda {formatNumber(pool.userDemandVolume)} {pool.unit} × selisih{" "}
              {formatRupiah(
                Math.max(0, pool.userBaselinePrice - target.pricePerUnit),
              )}
              /{pool.unit} dari baseline {formatRupiah(pool.userBaselinePrice)}
            </small>
          </>
        ) : (
          <div className="savings-empty">
            Ajukan kebutuhan untuk melihat estimasi penghematan pribadi.
          </div>
        )}
      </section>

      <section className="supply-card">
        <h2>Sumber suplai — termurah dulu</h2>
        {pool.sources.length ? (
          pool.sources.map((source) => (
            <article className="supply-row" key={source.id}>
              <div>
                <span className={`supplier-type supplier-type--${source.type}`}>
                  {supplierLabels[source.type]}
                </span>
                <strong>{source.name}</strong>
                <small>{source.location}</small>
              </div>
              <p>
                {formatRupiah(source.pricePerUnit)}
                <small>/{pool.unit}</small>
              </p>
            </article>
          ))
        ) : (
          <p className="supply-empty">
            Belum ada sumber suplai untuk komoditas dan wilayah ini.
          </p>
        )}
      </section>

      {pool.joined ? (
        <div className="joined-state">
          <span aria-hidden="true">✓</span> Anda tergabung —{" "}
          {formatNumber(pool.userDemandVolume)} {pool.unit}
        </div>
      ) : (
        <Link
          className="join-pool"
          href={`/ajukan?commodity=${encodeURIComponent(pool.commodityId)}`}
        >
          Gabung Pool Ini
        </Link>
      )}
    </div>
  );
}
