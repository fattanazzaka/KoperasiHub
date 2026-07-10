import "server-only";

import type { AuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { getDemoDemands } from "@/lib/demo-demands";
import {
  getDemoPurchaseOrders,
  saveDemoPurchaseOrder,
} from "@/lib/demo-purchase-orders";
import { devCooperatives, devPools } from "@/lib/dev-fixture";
import { calculateSuccessFee } from "@/lib/fees";
import { getPoolDetail } from "@/lib/pools";
import type {
  CooperativeAllocation,
  PurchaseOrder,
  PurchaseOrderAllocation,
} from "@/lib/procurement-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IssueResult =
  | { success: true; poolId: string }
  | { success: false; error: string };

type AggregatedMember = {
  cooperativeId: string;
  cooperativeName: string;
  nib: string;
  volume: number;
  baselineTotal: number;
};

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function createPoNumber(commodityId: string): string {
  const monthRoman = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ][new Date().getMonth()];
  const sequenceByCommodity: Record<string, string> = {
    beras: "0042",
    minyak_kita: "0043",
    telur: "0044",
    gula: "0045",
  };

  return `PO-KSL/${new Date().getFullYear()}/${monthRoman}/${
    sequenceByCommodity[commodityId] ?? "0099"
  }`;
}

function toOrderSummary(
  purchaseOrder: PurchaseOrder,
): Omit<PurchaseOrder, "allocations"> {
  return {
    poolId: purchaseOrder.poolId,
    poNumber: purchaseOrder.poNumber,
    issuedAt: purchaseOrder.issuedAt,
    commodityId: purchaseOrder.commodityId,
    commodityName: purchaseOrder.commodityName,
    unit: purchaseOrder.unit,
    wilayah: purchaseOrder.wilayah,
    supplierName: purchaseOrder.supplierName,
    supplierType: purchaseOrder.supplierType,
    supplierLocation: purchaseOrder.supplierLocation,
    tierId: purchaseOrder.tierId,
    tierName: purchaseOrder.tierName,
    tierPrice: purchaseOrder.tierPrice,
    totalVolume: purchaseOrder.totalVolume,
    totalValue: purchaseOrder.totalValue,
    totalSavings: purchaseOrder.totalSavings,
  };
}

function buildAllocations(
  members: AggregatedMember[],
  tierPrice: number,
): PurchaseOrderAllocation[] {
  return members.map((member) => {
    const baselinePrice = Math.round(member.baselineTotal / member.volume);
    const savings = Math.max(
      0,
      member.baselineTotal - tierPrice * member.volume,
    );

    return {
      cooperativeId: member.cooperativeId,
      cooperativeName: member.cooperativeName,
      nib: member.nib,
      volume: member.volume,
      baselinePrice,
      tierPrice,
      savings,
      fee: calculateSuccessFee(savings),
    };
  });
}

function withSuccessFees(purchaseOrder: PurchaseOrder): PurchaseOrder {
  return {
    ...purchaseOrder,
    allocations: purchaseOrder.allocations.map((allocation) => ({
      ...allocation,
      fee: calculateSuccessFee(allocation.savings),
    })),
  };
}

async function issueDemoPurchaseOrder(
  auth: AuthContext,
  poolId: string,
): Promise<IssueResult> {
  const existing = (await getDemoPurchaseOrders()).find(
    (purchaseOrder) => purchaseOrder.poolId === poolId,
  );
  if (existing) {
    return { success: true, poolId };
  }

  const pool = await getPoolDetail(auth, poolId);
  const eligibleTier = pool?.progress.eligibleTier;
  if (!pool || !eligibleTier) {
    return {
      success: false,
      error: "Pool belum mencapai Ambang Tier yang dapat dikunci.",
    };
  }

  const fixture = devPools.find((item) => item.id === poolId);
  const members = new Map<string, AggregatedMember>();

  for (const member of fixture?.baseMembers ?? []) {
    members.set(member.cooperativeId, {
      cooperativeId: member.cooperativeId,
      cooperativeName: member.name,
      nib: member.nib,
      volume: member.volume,
      baselineTotal: member.baselinePrice * member.volume,
    });
  }

  const demoDemands = (await getDemoDemands()).filter(
    (demand) =>
      demand.role === "demand" &&
      demand.commodityId === pool.commodityId &&
      demand.wilayah === pool.wilayah &&
      demand.windowStart === pool.windowStart &&
      demand.windowEnd === pool.windowEnd,
  );

  for (const demand of demoDemands) {
    const cooperative = devCooperatives.find(
      (item) => item.id === demand.cooperativeId,
    );
    const current = members.get(demand.cooperativeId);
    if (current) {
      current.volume += demand.volume;
      current.baselineTotal += demand.price * demand.volume;
    } else {
      members.set(demand.cooperativeId, {
        cooperativeId: demand.cooperativeId,
        cooperativeName: cooperative?.nama ?? "KDMP Peserta Demo",
        nib: cooperative?.nib ?? "-",
        volume: demand.volume,
        baselineTotal: demand.price * demand.volume,
      });
    }
  }

  const allocations = buildAllocations([...members.values()], eligibleTier.pricePerUnit);
  if (!allocations.length) {
    return { success: false, error: "Pool belum memiliki peserta untuk dialokasikan." };
  }

  const supplier =
    pool.sources.find(
      (source) => source.pricePerUnit === eligibleTier.pricePerUnit,
    ) ?? pool.sources[0];
  const totalVolume = allocations.reduce((total, item) => total + item.volume, 0);
  const totalSavings = allocations.reduce(
    (total, item) => total + item.savings,
    0,
  );

  await saveDemoPurchaseOrder({
    poolId,
    poNumber: createPoNumber(pool.commodityId),
    issuedAt: new Date().toISOString(),
    commodityId: pool.commodityId,
    commodityName: pool.commodityName,
    unit: pool.unit,
    wilayah: pool.wilayah,
    supplierName: supplier?.name ?? "Jaringan supplier terpilih",
    supplierType: supplier?.type ?? "distributor",
    supplierLocation: supplier?.location ?? pool.wilayah,
    tierId: eligibleTier.id,
    tierName: eligibleTier.name,
    tierPrice: eligibleTier.pricePerUnit,
    totalVolume,
    totalValue: totalVolume * eligibleTier.pricePerUnit,
    totalSavings,
    allocations,
  });

  return { success: true, poolId };
}

async function issueSupabasePurchaseOrder(
  auth: AuthContext,
  poolId: string,
): Promise<IssueResult> {
  const poolDetail = await getPoolDetail(auth, poolId);
  const eligibleTier = poolDetail?.progress.eligibleTier;
  if (!poolDetail || !eligibleTier) {
    return {
      success: false,
      error: "Pool belum mencapai Ambang Tier yang dapat dikunci.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: currentPool } = await supabase
    .from("pools")
    .select("status, po_number")
    .eq("id", poolId)
    .single();
  if (currentPool?.status === "po_issued") {
    return { success: true, poolId };
  }

  const { data: demands, error: demandError } = await supabase
    .from("demands")
    .select(
      "cooperative_id, volume, harga_baseline, cooperatives(id, nama, nib)",
    )
    .eq("pool_id", poolId)
    .eq("role", "demand");
  if (demandError || !demands?.length) {
    return { success: false, error: "Demand peserta pool belum tersedia." };
  }

  const members = new Map<string, AggregatedMember>();
  for (const demand of demands) {
    const cooperative = unwrapRelation(demand.cooperatives);
    const current = members.get(demand.cooperative_id);
    const baselinePrice = demand.harga_baseline ?? eligibleTier.pricePerUnit;
    if (current) {
      current.volume += demand.volume;
      current.baselineTotal += baselinePrice * demand.volume;
    } else {
      members.set(demand.cooperative_id, {
        cooperativeId: demand.cooperative_id,
        cooperativeName: cooperative?.nama ?? "KDMP Peserta",
        nib: cooperative?.nib ?? "-",
        volume: demand.volume,
        baselineTotal: baselinePrice * demand.volume,
      });
    }
  }

  const allocations = buildAllocations([...members.values()], eligibleTier.pricePerUnit);
  const poNumber = createPoNumber(poolDetail.commodityId);
  const { error: lockError } = await supabase
    .from("pools")
    .update({ status: "locked", selected_tier_id: eligibleTier.id })
    .eq("id", poolId)
    .eq("status", "open");
  if (lockError) {
    return { success: false, error: "Pool gagal dikunci." };
  }

  const { error: allocationError } = await supabase.from("allocations").upsert(
    allocations.map((allocation) => ({
      pool_id: poolId,
      cooperative_id: allocation.cooperativeId,
      volume: allocation.volume,
      harga_tier: allocation.tierPrice,
      hemat_rp: allocation.savings,
      fee_rp: allocation.fee,
    })),
    { onConflict: "pool_id,cooperative_id" },
  );
  if (allocationError) {
    return { success: false, error: "Alokasi Proporsional gagal dibuat." };
  }

  const { error: issueError } = await supabase
    .from("pools")
    .update({ status: "po_issued", po_number: poNumber })
    .eq("id", poolId)
    .eq("status", "locked");

  return issueError
    ? { success: false, error: "PO Konsolidasi gagal diterbitkan." }
    : { success: true, poolId };
}

export async function issuePurchaseOrder(
  auth: AuthContext,
  poolId: string,
): Promise<IssueResult> {
  if (auth.role !== "admin") {
    return { success: false, error: "Hanya Admin Hub yang dapat mengunci pool." };
  }

  return isSupabaseConfigured()
    ? issueSupabasePurchaseOrder(auth, poolId)
    : issueDemoPurchaseOrder(auth, poolId);
}

async function getSupabasePurchaseOrder(poolId: string): Promise<PurchaseOrder | null> {
  const supabase = await createSupabaseServerClient();
  const { data: pool } = await supabase
    .from("pools")
    .select(
      "id, po_number, commodity_id, wilayah, status, commodities(id, nama, satuan), price_tiers(id, nama_tier, harga_per_unit, suppliers(id, nama, tipe, lokasi))",
    )
    .eq("id", poolId)
    .eq("status", "po_issued")
    .single();
  if (!pool) {
    return null;
  }

  const { data: allocationRows } = await supabase
    .from("allocations")
    .select(
      "cooperative_id, volume, harga_tier, hemat_rp, fee_rp, cooperatives(id, nama, nib)",
    )
    .eq("pool_id", poolId);
  const commodity = unwrapRelation(pool.commodities);
  const tier = unwrapRelation(pool.price_tiers);
  const supplier = tier ? unwrapRelation(tier.suppliers) : null;
  const allocations: PurchaseOrderAllocation[] = (allocationRows ?? []).map(
    (row) => {
      const cooperative = unwrapRelation(row.cooperatives);
      return {
        cooperativeId: row.cooperative_id,
        cooperativeName: cooperative?.nama ?? "KDMP Peserta",
        nib: cooperative?.nib ?? "-",
        volume: row.volume,
        baselinePrice: row.harga_tier + Math.round(row.hemat_rp / row.volume),
        tierPrice: row.harga_tier,
        savings: row.hemat_rp,
        fee: calculateSuccessFee(row.hemat_rp),
      };
    },
  );
  const totalVolume = allocations.reduce((total, item) => total + item.volume, 0);

  return {
    poolId: pool.id,
    poNumber: pool.po_number,
    issuedAt: new Date().toISOString(),
    commodityId: commodity?.id ?? pool.commodity_id,
    commodityName: commodity?.nama ?? pool.commodity_id,
    unit: commodity?.satuan === "liter" ? "liter" : "kg",
    wilayah: pool.wilayah,
    supplierName: supplier?.nama ?? "Jaringan supplier terpilih",
    supplierType:
      supplier?.tipe === "bumn" || supplier?.tipe === "koperasi"
        ? supplier.tipe
        : "distributor",
    supplierLocation: supplier?.lokasi ?? pool.wilayah,
    tierId: tier?.id ?? "",
    tierName: tier?.nama_tier ?? "Terpilih",
    tierPrice: tier?.harga_per_unit ?? allocations[0]?.tierPrice ?? 0,
    totalVolume,
    totalValue: totalVolume * (tier?.harga_per_unit ?? allocations[0]?.tierPrice ?? 0),
    totalSavings: allocations.reduce((total, item) => total + item.savings, 0),
    allocations,
  };
}

export async function getPurchaseOrder(
  auth: AuthContext,
  poolId: string,
): Promise<PurchaseOrder | null> {
  if (auth.role !== "admin") {
    return null;
  }

  if (isSupabaseConfigured()) {
    return getSupabasePurchaseOrder(poolId);
  }

  const purchaseOrder = (await getDemoPurchaseOrders()).find(
    (item) => item.poolId === poolId,
  );
  return purchaseOrder ? withSuccessFees(purchaseOrder) : null;
}

export async function getIssuedPoolIds(): Promise<string[]> {
  return isSupabaseConfigured()
    ? []
    : (await getDemoPurchaseOrders()).map((item) => item.poolId);
}

export async function getCooperativeAllocations(
  auth: AuthContext,
): Promise<CooperativeAllocation[]> {
  if (auth.role !== "koperasi" || !auth.cooperative) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return (await getDemoPurchaseOrders()).flatMap((purchaseOrder) => {
      const allocation = purchaseOrder.allocations.find(
        (item) => item.cooperativeId === auth.cooperative!.id,
      );
      return allocation
        ? [
            {
              purchaseOrder: toOrderSummary(purchaseOrder),
              allocation: {
                ...allocation,
                fee: calculateSuccessFee(allocation.savings),
              },
            },
          ]
        : [];
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("allocations")
    .select(
      "pool_id, cooperative_id, volume, harga_tier, hemat_rp, fee_rp, pools(id, po_number, commodity_id, wilayah, commodities(id, nama, satuan), price_tiers(id, nama_tier, harga_per_unit, suppliers(id, nama, tipe, lokasi)))",
    )
    .eq("cooperative_id", auth.cooperative.id);
  const { data: aggregateRows } = await supabase.rpc("get_allocation_stats");

  return (rows ?? []).flatMap((row): CooperativeAllocation[] => {
    const pool = unwrapRelation(row.pools);
    if (!pool?.po_number) {
      return [];
    }
    const commodity = unwrapRelation(pool.commodities);
    const tier = unwrapRelation(pool.price_tiers);
    const supplier = tier ? unwrapRelation(tier.suppliers) : null;
    const aggregate = (aggregateRows ?? []).find(
      (item: { pool_id: string }) => item.pool_id === row.pool_id,
    );
    const allocation: PurchaseOrderAllocation = {
      cooperativeId: row.cooperative_id,
      cooperativeName: auth.cooperative!.nama,
      nib: "-",
      volume: row.volume,
      baselinePrice: row.harga_tier + Math.round(row.hemat_rp / row.volume),
      tierPrice: row.harga_tier,
      savings: row.hemat_rp,
      fee: calculateSuccessFee(row.hemat_rp),
    };
    const totalVolume = Number(aggregate?.total_volume ?? row.volume);

    return [
      {
        allocation,
        purchaseOrder: {
          poolId: row.pool_id,
          poNumber: pool.po_number,
          issuedAt: new Date().toISOString(),
          commodityId: commodity?.id ?? pool.commodity_id,
          commodityName: commodity?.nama ?? pool.commodity_id,
          unit: commodity?.satuan === "liter" ? "liter" : "kg",
          wilayah: pool.wilayah,
          supplierName: supplier?.nama ?? "Jaringan supplier terpilih",
          supplierType:
            supplier?.tipe === "bumn" || supplier?.tipe === "koperasi"
              ? supplier.tipe
              : "distributor",
          supplierLocation: supplier?.lokasi ?? pool.wilayah,
          tierId: tier?.id ?? "",
          tierName: tier?.nama_tier ?? "Terpilih",
          tierPrice: row.harga_tier,
          totalVolume,
          totalValue: totalVolume * row.harga_tier,
          totalSavings: Number(aggregate?.total_savings ?? row.hemat_rp),
        },
      },
    ];
  });
}
