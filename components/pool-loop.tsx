"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PoolCard } from "@/components/pool-card";
import type { PoolSummary } from "@/lib/pool-types";

type PoolLoopProps = {
  pools: PoolSummary[];
};

const ROTATION_INTERVAL = 4000;

export function PoolLoop({ pools }: PoolLoopProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const lastWheelRef = useRef(0);
  const [startIndex, setStartIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(382);
  const shouldLoop = pools.length > 2;
  const visiblePools = useMemo(
    () =>
      Array.from({ length: Math.min(2, pools.length) }, (_, offset) => {
        const index = (startIndex + offset) % pools.length;
        return pools[index];
      }),
    [pools, startIndex],
  );
  const visiblePosition = visiblePools
    .map((_, offset) => ((startIndex + offset) % pools.length) + 1)
    .join("–");

  const rotate = useCallback(
    (direction: 1 | -1) => {
      setStartIndex((current) =>
        (current + direction + pools.length) % pools.length,
      );
    },
    [pools.length],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const workspace = viewport?.closest(".home-workspace");
    const recommendationArea = workspace?.querySelector(".rec-section");

    if (!viewport || !recommendationArea) return;

    let observedCard: HTMLElement | null = null;

    const syncHeight = () => {
      if (!observedCard) return;
      setViewportHeight(Math.round(observedCard.getBoundingClientRect().height));
    };
    const resizeObserver = new ResizeObserver(syncHeight);
    const observeCurrentCard = () => {
      const currentCard = recommendationArea.querySelector<HTMLElement>(
        ".rec-card, .rec-empty",
      );

      if (currentCard === observedCard) return;
      if (observedCard) resizeObserver.unobserve(observedCard);

      observedCard = currentCard;
      if (observedCard) {
        resizeObserver.observe(observedCard);
        syncHeight();
      }
    };
    const mutationObserver = new MutationObserver(observeCurrentCard);

    observeCurrentCard();
    mutationObserver.observe(recommendationArea, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [pools]);

  useEffect(() => {
    if (!shouldLoop) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return;

    const interval = window.setInterval(() => {
      if (!pausedRef.current) rotate(1);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, [rotate, shouldLoop]);

  if (pools.length === 0) {
    return (
      <>
        <div className="home-section-heading">
          <h2 id="home-pools-title">Pool terdekat ke target</h2>
          <Link href="/pool">Lihat semua</Link>
        </div>
        <p className="home-pools__empty">Belum ada pool aktif.</p>
      </>
    );
  }

  return (
    <div
      className="home-pools__carousel"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          pausedRef.current = false;
        }
      }}
      onFocusCapture={() => {
        pausedRef.current = true;
      }}
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="home-section-heading">
        <h2 id="home-pools-title">Pool terdekat ke target</h2>
        <div className="home-pools__heading-actions">
          {shouldLoop ? (
            <>
              <span className="home-pools__position">
                {visiblePosition} dari {pools.length}
              </span>
              <div className="home-pools__controls" aria-label="Kontrol pool">
                <button
                  aria-label="Tampilkan dua pool sebelumnya"
                  onClick={() => rotate(-1)}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                </button>
                <button
                  aria-label="Tampilkan dua pool berikutnya"
                  onClick={() => rotate(1)}
                  type="button"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </div>
            </>
          ) : null}
          <Link href="/pool">Lihat semua</Link>
        </div>
      </div>

      <div
        aria-label="Daftar pool terdekat ke target"
        className={`home-pools__viewport${visiblePools.length === 1 ? " is-single" : ""}`}
        onKeyDown={(event) => {
          if (!shouldLoop) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            rotate(1);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            rotate(-1);
          }
        }}
        onWheel={(event) => {
          if (!shouldLoop || Math.abs(event.deltaY) < 12) return;

          const now = Date.now();
          if (now - lastWheelRef.current < 350) return;

          lastWheelRef.current = now;
          rotate(event.deltaY > 0 ? 1 : -1);
        }}
        ref={viewportRef}
        style={{ height: viewportHeight }}
        tabIndex={shouldLoop ? 0 : undefined}
      >
        {visiblePools.map((pool) => (
          <PoolCard key={`${startIndex}-${pool.id}`} pool={pool} />
        ))}
      </div>
    </div>
  );
}
