"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SKOR_AMBANG, SKOR_BOBOT } from "@/lib/recommendations";
import type { RecommendationCard } from "@/lib/recommendations";

type FetchState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; cards: RecommendationCard[] };

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatTanggal(isoDate: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${isoDate}T00:00:00+07:00`));
}

function deepLink(card: RecommendationCard): string {
  const params = new URLSearchParams({
    commodity: card.komoditas_id,
    qty: String(card.qty_saran),
    baseline: String(card.harga_baseline),
  });
  if (card.pool_ref) params.set("pool", card.pool_ref);
  return `/ajukan?${params.toString()}`;
}

/** Rincian skor dalam bahasa awam — tautan "Kenapa rekomendasi ini?" (AC4). */
function ScoreBreakdown({ card }: { card: RecommendationCard }) {
  const { urgensi, hematNorm, poolAktif, musiman } = card.skor_rincian;
  const rows = [
    {
      label: `Stok menipis (±${Math.max(1, Math.round(card.days_of_stock))} hari tersisa)`,
      value: SKOR_BOBOT.urgensi * urgensi,
      active: urgensi > 0,
    },
    {
      label: "Potensi hemat vs pembelian terakhirmu",
      value: SKOR_BOBOT.hematNorm * hematNorm,
      active: hematNorm > 0,
    },
    {
      label: "Ada pool aktif di klaster wilayahmu",
      value: SKOR_BOBOT.poolAktif * poolAktif,
      active: poolAktif === 1,
    },
    {
      label: "Faktor musiman (musim tanam / jelang HBKN)",
      value: musiman,
      active: musiman > 0,
    },
  ];

  return (
    <div className="rec-why__body">
      <p>{card.alasan}</p>
      <ul>
        {rows.map((row) => (
          <li key={row.label} className={row.active ? undefined : "is-muted"}>
            <span>{row.label}</span>
            <strong>+{row.value.toFixed(2)}</strong>
          </li>
        ))}
      </ul>
      <p className="rec-why__total">
        Total skor <strong>{card.skor.toFixed(2)}</strong> — tampil karena
        melewati ambang {SKOR_AMBANG.toFixed(2)}.
      </p>
    </div>
  );
}

export function RecommendationCards() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [openWhy, setOpenWhy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/recommendation", { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { rekomendasi?: RecommendationCard[] } | null) => {
        if (cancelled) return;
        const cards = payload?.rekomendasi ?? [];
        setState(
          cards.length > 0 ? { status: "ready", cards } : { status: "empty" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "empty" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rec-section" aria-label="Rekomendasi Pengadaan Cerdas">
      <div className="home-section-heading">
        <h2 className="rec-section__title">Rekomendasi Pengadaan Cerdas</h2>
      </div>

      {state.status === "empty" ? (
        <div className="rec-empty">
          Belum ada rekomendasi baru untuk stok dan riwayat transaksi saat ini.
        </div>
      ) : state.status === "loading" ? (
        <div className="rec-card is-loading" aria-hidden="true">
          <span className="rec-skeleton" />
          <span className="rec-skeleton is-short" />
          <span className="rec-skeleton" />
        </div>
      ) : (
        state.cards.map((card) => {
          const hasPool = card.pool_ref !== null;
          const whyOpen = openWhy === card.komoditas_id;
          const stockDays = Math.max(1, Math.round(card.days_of_stock));

          return (
            <article className="rec-card" key={card.komoditas_id}>
              <header className="rec-card__header">
                <div>
                  <h3>{card.komoditas}</h3>
                  <p className="rec-card__narasi">{card.narasi}</p>
                </div>
                {card.flag_het ? (
                  <span className="rec-badge-het">Beli di atas HET</span>
                ) : null}
              </header>

              <dl className="rec-card__metrics">
                <div>
                  <dt>Stok tersisa</dt>
                  <dd>{stockDays} hari</dd>
                  {card.habis_pada ? (
                    <span>Habis {formatTanggal(card.habis_pada)}</span>
                  ) : null}
                </div>
                <div>
                  <dt>Usulan volume</dt>
                  <dd>
                    {card.qty_saran.toLocaleString("id-ID")} {card.satuan}
                  </dd>
                </div>
                <div className={card.hemat_estimasi > 0 ? "is-savings" : undefined}>
                  <dt>Potensi hemat</dt>
                  <dd className={card.hemat_estimasi > 0 ? undefined : "rec-metric-na"}>
                    {card.hemat_estimasi > 0
                      ? formatRupiah(card.hemat_estimasi)
                      : "—"}
                  </dd>
                </div>
              </dl>

              {card.pool_progress ? (
                <div className="rec-card__pool">
                  <div className="rec-card__pool-heading">
                    <span>
                      Pool aktif · Tier {card.pool_progress.tier_nama}
                    </span>
                    <strong>{card.pool_progress.percent}%</strong>
                  </div>
                  <div className="pool-card__progress" aria-hidden="true">
                    <span
                      style={{ width: `${card.pool_progress.percent}%` }}
                    />
                  </div>
                  <p className="pool-card__volume">
                    {card.pool_progress.total_volume.toLocaleString("id-ID")} /{" "}
                    {card.pool_progress.min_volume.toLocaleString("id-ID")} {card.satuan}
                    {" · "}
                    {formatRupiah(card.pool_progress.tier_harga)}/{card.satuan}
                    {card.deadline_pool
                      ? ` — ditutup ${formatTanggal(card.deadline_pool)}`
                      : ""}
                  </p>
                </div>
              ) : null}

              <div className="rec-card__footer">
                <Link className="rec-cta" href={deepLink(card)}>
                  {hasPool ? "Gabung Pool" : "Buka Permintaan Pool Baru"}
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="rec-why__toggle"
                  aria-expanded={whyOpen}
                  onClick={() =>
                    setOpenWhy(whyOpen ? null : card.komoditas_id)
                  }
                >
                  Kenapa rekomendasi ini?
                </button>
              </div>

              {whyOpen ? <ScoreBreakdown card={card} /> : null}
            </article>
          );
        })
      )}
    </section>
  );
}
