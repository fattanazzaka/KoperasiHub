export type PurchaseOrderAllocation = {
  cooperativeId: string;
  cooperativeName: string;
  nib: string;
  volume: number;
  baselinePrice: number;
  tierPrice: number;
  savings: number;
  fee: number;
};

export type PurchaseOrder = {
  poolId: string;
  poNumber: string;
  issuedAt: string;
  commodityId: string;
  commodityName: string;
  unit: "kg" | "liter";
  wilayah: string;
  supplierName: string;
  supplierType: "distributor" | "bumn" | "koperasi";
  supplierLocation: string;
  tierId: string;
  tierName: string;
  tierPrice: number;
  totalVolume: number;
  totalValue: number;
  totalSavings: number;
  allocations: PurchaseOrderAllocation[];
};

export type CooperativeAllocation = {
  purchaseOrder: Omit<PurchaseOrder, "allocations">;
  allocation: PurchaseOrderAllocation;
};
