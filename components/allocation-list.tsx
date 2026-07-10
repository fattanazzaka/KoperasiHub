import type { CooperativeAllocation } from "@/lib/procurement-types";

type AllocationListProps = {
  allocations: CooperativeAllocation[];
};

function formatNumber(value: number): string {
  return value.toLocaleString("id-ID");
}

function formatRupiah(value: number): string {
  return `Rp${formatNumber(value)}`;
}

export function AllocationList({ allocations }: AllocationListProps) {
  if (!allocations.length) {
    return (
      <div className="allocation-empty">
        <h2>Belum ada Alokasi Proporsional</h2>
        <p>Alokasi akan muncul setelah Admin Hub menerbitkan PO Konsolidasi.</p>
      </div>
    );
  }

  return (
    <div className="allocation-list">
      {allocations.map(({ purchaseOrder, allocation }) => (
        <article className="allocation-card" key={purchaseOrder.poolId}>
          <div className="allocation-card__heading">
            <div>
              <p className="eyebrow">{purchaseOrder.poNumber}</p>
              <h2>{purchaseOrder.commodityName}</h2>
              <span>Klaster {purchaseOrder.wilayah}</span>
            </div>
            <span className="allocation-status">PO terbit</span>
          </div>

          <dl className="allocation-metrics">
            <div>
              <dt>Alokasi Anda</dt>
              <dd>
                {formatNumber(allocation.volume)} {purchaseOrder.unit}
              </dd>
            </div>
            <div>
              <dt>Harga tier</dt>
              <dd>
                {formatRupiah(allocation.tierPrice)}/{purchaseOrder.unit}
              </dd>
            </div>
            <div className="allocation-savings">
              <dt>Anda hemat</dt>
              <dd>{formatRupiah(allocation.savings)}</dd>
            </div>
          </dl>

          <div className="cluster-summary">
            <span>Ringkasan klaster</span>
            <strong>
              {formatNumber(purchaseOrder.totalVolume)} {purchaseOrder.unit} · hemat{" "}
              {formatRupiah(purchaseOrder.totalSavings)}
            </strong>
          </div>
        </article>
      ))}
    </div>
  );
}
