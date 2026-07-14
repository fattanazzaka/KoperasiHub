import type { PoolSummary } from "@/lib/pool-types";

function normalizeWilayah(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/\./g, "")
    .replace(/^kabupaten\b/, "kab")
    .replace(/\s+/g, " ");
}

export function getActionablePools<T extends PoolSummary>(
  pools: readonly T[],
  wilayah: string,
): T[] {
  const normalizedWilayah = normalizeWilayah(wilayah);

  return pools
    .filter(
      (pool) =>
        pool.status === "open" &&
        pool.daysRemaining > 0 &&
        pool.progress.targetTier !== null &&
        normalizeWilayah(pool.wilayah) === normalizedWilayah,
    )
    .sort(
      (a, b) =>
        b.progress.progressPercent - a.progress.progressPercent ||
        a.daysRemaining - b.daysRemaining,
    );
}
