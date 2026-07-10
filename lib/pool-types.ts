import type { DemandRole } from "@/lib/demand";
import type { DevSupplierType } from "@/lib/dev-fixture";

export type PoolTier = {
  id: string;
  name: string;
  minVolume: number;
  pricePerUnit: number;
};

export type PoolSupplySource = {
  id: string;
  name: string;
  type: DevSupplierType;
  location: string;
  pricePerUnit: number;
};

export type PoolUserEntry = {
  role: DemandRole;
  volume: number;
  price: number;
};

export type PoolProgress = {
  targetTier: PoolTier | null;
  targetReached: boolean;
  newlyReachedTierId: string | null;
  progressPercent: number;
  remainingVolume: number;
};

export type PoolSummary = {
  id: string;
  commodityId: string;
  commodityName: string;
  unit: "kg" | "liter";
  wilayah: string;
  windowStart: string;
  windowEnd: string;
  status: "open" | "locked" | "po_issued";
  totalVolume: number;
  participantCount: number;
  daysRemaining: number;
  joined: boolean;
  progress: PoolProgress;
};

export type PoolDetail = PoolSummary & {
  baselinePrice: number;
  tiers: PoolTier[];
  sources: PoolSupplySource[];
  userEntries: PoolUserEntry[];
  userDemandVolume: number;
  userBaselinePrice: number;
  estimatedSavings: number;
};
