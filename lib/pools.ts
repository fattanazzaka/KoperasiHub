import "server-only";

import type { AuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { resolveDemandWindow } from "@/lib/demand";
import { getDemoDemands, type DemoDemand } from "@/lib/demo-demands";
import { getDemoPurchaseOrders } from "@/lib/demo-purchase-orders";
import {
  devCommodities,
  devCommodityMarkets,
  devPools,
  type DevCommodity,
  type DevPoolFixture,
  type DevSupplierType,
} from "@/lib/dev-fixture";
import type {
  PoolDetail,
  PoolProgress,
  PoolSupplySource,
  PoolTier,
  PoolUserEntry,
} from "@/lib/pool-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PoolRecord = {
  id: string;
  commodityId: string;
  commodityName: string;
  unit: "kg" | "liter";
  wilayah: string;
  windowStart: string;
  windowEnd: string;
  status: "open" | "locked" | "po_issued";
  baseTotalVolume: number;
  baseParticipantCount: number;
  baselinePrice: number;
  tiers: PoolTier[];
  sources: PoolSupplySource[];
  userEntries: PoolUserEntry[];
};

type PoolStatsRow = {
  pool_id: string;
  total_volume: number | string;
  participant_count: number | string;
};

type UserDemandRow = {
  pool_id: string;
  role: string;
  volume: number;
  harga_baseline: number | null;
  harga_penawaran: number | null;
};

const DAY_IN_MS = 86_400_000;

function calculateDaysRemaining(windowEnd: string): number {
  const end = new Date(`${windowEnd}T23:59:59+07:00`).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / DAY_IN_MS));
}

function deriveProgress(
  totalVolume: number,
  baseTotalVolume: number,
  tiers: PoolTier[],
): PoolProgress {
  // Tangga tier harus monotonik: volume lebih besar = harga lebih murah. Buang tier
  // yang bukan diskon nyata (harga >= tier bervolume lebih kecil) agar penawaran
  // produsen bervolume kecil tidak salah menggerbangkan penerbitan PO dan "target
  // berikutnya" tidak pernah tampil lebih mahal daripada tier yang sudah dicapai (KH-03).
  const ascendingByVolume = [...tiers].sort((a, b) => a.minVolume - b.minVolume);
  const orderedTiers: PoolTier[] = [];
  let bestPriceSoFar = Number.POSITIVE_INFINITY;
  for (const tier of ascendingByVolume) {
    if (tier.pricePerUnit < bestPriceSoFar) {
      orderedTiers.push(tier);
      bestPriceSoFar = tier.pricePerUnit;
    }
  }
  const newlyReached = orderedTiers
    .filter(
      (tier) =>
        baseTotalVolume < tier.minVolume && totalVolume >= tier.minVolume,
    )
    .at(-1);
  const nextTier = orderedTiers.find((tier) => tier.minVolume > totalVolume);
  const currentTier = orderedTiers
    .filter((tier) => tier.minVolume <= totalVolume)
    .at(-1);
  const targetTier = newlyReached ?? nextTier ?? currentTier ?? orderedTiers[0] ?? null;

  if (!targetTier) {
    return {
      targetTier: null,
      eligibleTier: null,
      targetReached: false,
      newlyReachedTierId: null,
      progressPercent: 0,
      remainingVolume: 0,
    };
  }

  const targetReached = totalVolume >= targetTier.minVolume;

  return {
    targetTier,
    eligibleTier: currentTier ?? null,
    targetReached,
    newlyReachedTierId: newlyReached?.id ?? null,
    progressPercent: targetReached
      ? 100
      : Math.min(100, Math.round((totalVolume / targetTier.minVolume) * 100)),
    remainingVolume: Math.max(0, targetTier.minVolume - totalVolume),
  };
}

function buildPoolDetail(record: PoolRecord): PoolDetail {
  const userDemandEntries = record.userEntries.filter(
    (entry) => entry.role === "demand",
  );
  const userDemandVolume = userDemandEntries.reduce(
    (total, entry) => total + entry.volume,
    0,
  );
  const totalVolume = record.baseTotalVolume + userDemandVolume;
  const participantCount =
    record.baseParticipantCount + (userDemandEntries.length > 0 ? 1 : 0);
  const progress = deriveProgress(
    totalVolume,
    record.baseTotalVolume,
    record.tiers,
  );
  const weightedBaselineTotal = userDemandEntries.reduce(
    (total, entry) => total + entry.price * entry.volume,
    0,
  );
  const userBaselinePrice = userDemandVolume
    ? Math.round(weightedBaselineTotal / userDemandVolume)
    : record.baselinePrice;
  const estimatedSavings = progress.targetTier
    ? userDemandEntries.reduce(
        (total, entry) =>
          total +
          Math.max(0, entry.price - progress.targetTier!.pricePerUnit) *
            entry.volume,
        0,
      )
    : 0;

  return {
    id: record.id,
    commodityId: record.commodityId,
    commodityName: record.commodityName,
    unit: record.unit,
    wilayah: record.wilayah,
    windowStart: record.windowStart,
    windowEnd: record.windowEnd,
    status: record.status,
    totalVolume,
    participantCount,
    daysRemaining: calculateDaysRemaining(record.windowEnd),
    joined: userDemandEntries.length > 0,
    progress,
    baselinePrice: record.baselinePrice,
    tiers: [...record.tiers].sort((a, b) => a.minVolume - b.minVolume),
    sources: [...record.sources].sort(
      (a, b) => a.pricePerUnit - b.pricePerUnit,
    ),
    userEntries: record.userEntries,
    userDemandVolume,
    userBaselinePrice,
    estimatedSavings,
  };
}

function demandMatchesFixture(
  demand: DemoDemand,
  fixture: DevPoolFixture,
  windowStart: string,
  windowEnd: string,
): boolean {
  return (
    demand.commodityId === fixture.commodityId &&
    demand.wilayah === fixture.wilayah &&
    demand.windowStart === windowStart &&
    demand.windowEnd === windowEnd
  );
}

function createDevPoolRecord(
  fixture: DevPoolFixture,
  demands: DemoDemand[],
  idOverride?: string,
): PoolRecord {
  const commodity = devCommodities.find(
    (item) => item.id === fixture.commodityId,
  )!;
  const market = devCommodityMarkets[fixture.commodityId];
  const window = resolveDemandWindow(fixture.windowOption);
  const matchingDemands = demands.filter((demand) =>
    demandMatchesFixture(
      demand,
      fixture,
      window.windowStart,
      window.windowEnd,
    ),
  );

  return {
    id: idOverride ?? fixture.id,
    commodityId: commodity.id,
    commodityName: commodity.nama,
    unit: commodity.satuan,
    wilayah: fixture.wilayah,
    windowStart: window.windowStart,
    windowEnd: window.windowEnd,
    status: "open",
    baseTotalVolume: fixture.baseTotalVolume,
    baseParticipantCount: fixture.baseParticipantCount,
    baselinePrice: market.baselinePrice,
    tiers: [...market.tiers],
    sources: [...market.sources],
    userEntries: matchingDemands.map((demand) => ({
      role: demand.role,
      volume: demand.volume,
      price: demand.price,
    })),
  };
}

function createDynamicDevPoolRecord(
  demand: DemoDemand,
  matchingDemands: DemoDemand[],
): PoolRecord {
  const commodity = devCommodities.find(
    (item) => item.id === demand.commodityId,
  ) as DevCommodity;
  const market = devCommodityMarkets[commodity.id];

  return {
    id: demand.poolId,
    commodityId: commodity.id,
    commodityName: commodity.nama,
    unit: commodity.satuan,
    wilayah: demand.wilayah,
    windowStart: demand.windowStart,
    windowEnd: demand.windowEnd,
    status: "open",
    baseTotalVolume: 0,
    baseParticipantCount: 0,
    baselinePrice: market.baselinePrice,
    tiers: [...market.tiers],
    sources: [...market.sources],
    userEntries: matchingDemands.map((entry) => ({
      role: entry.role,
      volume: entry.volume,
      price: entry.price,
    })),
  };
}

async function getDevPoolDetails(): Promise<PoolDetail[]> {
  const [demands, purchaseOrders] = await Promise.all([
    getDemoDemands(),
    getDemoPurchaseOrders(),
  ]);
  const fixtureDetails = devPools.map((fixture) =>
    buildPoolDetail(createDevPoolRecord(fixture, demands)),
  );
  const matchedPoolIds = new Set<string>();

  for (const demand of demands) {
    for (const fixture of devPools) {
      const window = resolveDemandWindow(fixture.windowOption);
      if (
        demandMatchesFixture(
          demand,
          fixture,
          window.windowStart,
          window.windowEnd,
        )
      ) {
        matchedPoolIds.add(demand.poolId);
      }
    }
  }

  const unmatchedDemands = demands.filter(
    (demand) => !matchedPoolIds.has(demand.poolId),
  );
  const dynamicDetails = Array.from(
    new Map(unmatchedDemands.map((demand) => [demand.poolId, demand])).values(),
  ).map((demand) =>
    buildPoolDetail(
      createDynamicDevPoolRecord(
        demand,
        unmatchedDemands.filter((entry) => entry.poolId === demand.poolId),
      ),
    ),
  );

  const issuedPoolIds = new Set(purchaseOrders.map((order) => order.poolId));

  return [...fixtureDetails, ...dynamicDetails].map((pool) =>
    issuedPoolIds.has(pool.id) ? { ...pool, status: "po_issued" } : pool,
  );
}

function normalizeSupplierType(value: string): DevSupplierType {
  return value === "bumn" || value === "koperasi" ? value : "distributor";
}

async function getSupabasePoolDetails(
  auth: AuthContext,
): Promise<PoolDetail[]> {
  const supabase = await createSupabaseServerClient();
  const { data: pools, error: poolsError } = await supabase
    .from("pools")
    .select(
      "id, commodity_id, wilayah, window_start, window_end, status, commodities(id, nama, satuan)",
    )
    .order("window_end", { ascending: true });

  if (poolsError || !pools?.length) {
    return [];
  }

  const poolIds = pools.map((pool) => pool.id);
  const commodityIds = [...new Set(pools.map((pool) => pool.commodity_id))];
  const [{ data: stats }, { data: tierRows }] = await Promise.all([
    supabase.rpc("get_pool_stats"),
    supabase
      .from("price_tiers")
      .select(
        "id, commodity_id, nama_tier, min_volume, harga_per_unit, suppliers(id, nama, tipe, lokasi)",
      )
      .in("commodity_id", commodityIds)
      .order("min_volume", { ascending: true }),
  ]);
  let userDemands: UserDemandRow[] = [];

  if (auth.cooperative) {
    const { data } = await supabase
      .from("demands")
      .select("pool_id, role, volume, harga_baseline, harga_penawaran")
      .eq("cooperative_id", auth.cooperative.id)
      .in("pool_id", poolIds);
    userDemands = (data ?? []) as UserDemandRow[];
  }

  return pools.map((pool) => {
    const commodityRelation = Array.isArray(pool.commodities)
      ? pool.commodities[0]
      : pool.commodities;
    const commodity = commodityRelation ?? {
      id: pool.commodity_id,
      nama: pool.commodity_id,
      satuan: "kg",
    };
    const rows = (tierRows ?? []).filter(
      (row) => row.commodity_id === pool.commodity_id,
    );
    const tiersByThreshold = new Map<number, PoolTier>();
    const sourcesBySupplier = new Map<string, PoolSupplySource & { minVolume: number }>();

    for (const row of rows) {
      const existingTier = tiersByThreshold.get(row.min_volume);
      if (!existingTier || row.harga_per_unit < existingTier.pricePerUnit) {
        tiersByThreshold.set(row.min_volume, {
          id: row.id,
          name: row.nama_tier,
          minVolume: row.min_volume,
          pricePerUnit: row.harga_per_unit,
        });
      }

      const supplierRelation = Array.isArray(row.suppliers)
        ? row.suppliers[0]
        : row.suppliers;
      if (supplierRelation) {
        const existingSource = sourcesBySupplier.get(supplierRelation.id);
        if (!existingSource || row.min_volume < existingSource.minVolume) {
          sourcesBySupplier.set(supplierRelation.id, {
            id: supplierRelation.id,
            name: supplierRelation.nama,
            type: normalizeSupplierType(supplierRelation.tipe),
            location: supplierRelation.lokasi ?? "Lokasi belum tersedia",
            pricePerUnit: row.harga_per_unit,
            minVolume: row.min_volume,
          });
        }
      }
    }

    const poolStats = ((stats ?? []) as PoolStatsRow[]).find(
      (item) => item.pool_id === pool.id,
    );
    const entries = userDemands
      .filter((demand) => demand.pool_id === pool.id)
      .map((demand): PoolUserEntry => ({
        role: demand.role === "supply" ? "supply" : "demand",
        volume: demand.volume,
        price:
          demand.role === "supply"
            ? (demand.harga_penawaran ?? 0)
            : (demand.harga_baseline ?? 0),
      }));
    const userDemandVolume = entries
      .filter((entry) => entry.role === "demand")
      .reduce((total, entry) => total + entry.volume, 0);
    const totalVolume = Number(poolStats?.total_volume ?? 0);

    return buildPoolDetail({
      id: pool.id,
      commodityId: commodity.id,
      commodityName: commodity.nama,
      unit: commodity.satuan === "liter" ? "liter" : "kg",
      wilayah: pool.wilayah,
      windowStart: pool.window_start,
      windowEnd: pool.window_end,
      status: pool.status,
      baseTotalVolume: Math.max(0, totalVolume - userDemandVolume),
      baseParticipantCount: Math.max(
        0,
        Number(poolStats?.participant_count ?? 0) - (userDemandVolume ? 1 : 0),
      ),
      baselinePrice: 0,
      tiers: [...tiersByThreshold.values()],
      sources: [...sourcesBySupplier.values()].map((source) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        location: source.location,
        pricePerUnit: source.pricePerUnit,
      })),
      userEntries: entries,
    });
  });
}

export async function getPoolDetails(auth: AuthContext): Promise<PoolDetail[]> {
  return isSupabaseConfigured()
    ? getSupabasePoolDetails(auth)
    : getDevPoolDetails();
}

export async function getPoolDetail(
  auth: AuthContext,
  poolId: string,
): Promise<PoolDetail | null> {
  const pools = await getPoolDetails(auth);
  const directMatch = pools.find((pool) => pool.id === poolId);

  if (directMatch) {
    return directMatch;
  }

  if (!isSupabaseConfigured()) {
    const demands = await getDemoDemands();
    const linkedDemand = demands.find((demand) => demand.poolId === poolId);

    if (linkedDemand) {
      const matchingFixture = devPools.find((fixture) => {
        const window = resolveDemandWindow(fixture.windowOption);
        return demandMatchesFixture(
          linkedDemand,
          fixture,
          window.windowStart,
          window.windowEnd,
        );
      });

      if (matchingFixture) {
        return buildPoolDetail(
          createDevPoolRecord(matchingFixture, demands, poolId),
        );
      }
    }
  }

  return null;
}
