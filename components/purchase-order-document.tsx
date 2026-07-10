import { BrandMark } from "@/components/brand-mark";
import { SUCCESS_FEE_PERCENTAGE } from "@/lib/fees";
import type { PurchaseOrder } from "@/lib/procurement-types";

type PurchaseOrderDocumentProps = {
  purchaseOrder: PurchaseOrder;
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

export function PurchaseOrderDocument({
  purchaseOrder,
}: PurchaseOrderDocumentProps) {
  const issuedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(purchaseOrder.issuedAt));
  const totalSuccessFee = purchaseOrder.allocations.reduce(
    (total, allocation) => total + allocation.fee,
    0,
  );

  return (
    <article className="po-document">
      <header className="po-document__heading">
        <BrandMark size="compact" />
        <div>
          <h1>PURCHASE ORDER KONSOLIDASI</h1>
          <p>KoperasiHub — Pengadaan Bersama Koperasi Merah Putih</p>
        </div>
      </header>

      <section className="po-document__meta">
        <dl>
          <div>
            <dt>Nomor PO</dt>
            <dd>{purchaseOrder.poNumber}</dd>
          </div>
          <div>
            <dt>Tanggal terbit</dt>
            <dd>{issuedDate}</dd>
          </div>
          <div>
            <dt>Komoditas</dt>
            <dd>{purchaseOrder.commodityName}</dd>
          </div>
          <div>
            <dt>Klaster</dt>
            <dd>{purchaseOrder.wilayah}</dd>
          </div>
        </dl>

        <div className="po-supplier">
          <span>Supplier terpilih</span>
          <strong>{purchaseOrder.supplierName}</strong>
          <small>
            {supplierLabels[purchaseOrder.supplierType]} ·{" "}
            {purchaseOrder.supplierLocation}
          </small>
          <p>
            Harga Tier {purchaseOrder.tierName}: {formatRupiah(purchaseOrder.tierPrice)}/
            {purchaseOrder.unit}
          </p>
        </div>
      </section>

      <div className="po-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Koperasi</th>
              <th>NIB</th>
              <th>Alokasi</th>
              <th>Harga tier</th>
              <th>Hemat</th>
              <th>Fee Keberhasilan ({SUCCESS_FEE_PERCENTAGE}%)</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrder.allocations.map((allocation) => (
              <tr key={allocation.cooperativeId}>
                <td>{allocation.cooperativeName}</td>
                <td>{allocation.nib}</td>
                <td>
                  {formatNumber(allocation.volume)} {purchaseOrder.unit}
                </td>
                <td>{formatRupiah(allocation.tierPrice)}</td>
                <td className="money-saved">{formatRupiah(allocation.savings)}</td>
                <td className="money-fee">{formatRupiah(allocation.fee)}</td>
              </tr>
            ))}
            <tr className="po-total-row">
              <td colSpan={2}>TOTAL</td>
              <td>
                {formatNumber(purchaseOrder.totalVolume)} {purchaseOrder.unit}
              </td>
              <td>{formatRupiah(purchaseOrder.totalValue)}</td>
              <td className="money-saved">
                {formatRupiah(purchaseOrder.totalSavings)}
              </td>
              <td className="money-fee">{formatRupiah(totalSuccessFee)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="po-note">
        Alokasi Proporsional mengikuti volume kebutuhan setiap koperasi. Fee
        Keberhasilan sebesar {SUCCESS_FEE_PERCENTAGE}% dari penghematan hanya dikenakan
        saat Ambang Tier tercapai dan PO Konsolidasi diterbitkan. Dokumen ini tidak
        memproses pembayaran atau logistik.
      </p>

      <section className="po-signatures">
        <div>
          <span>Diterbitkan oleh,</span>
          <strong>Koordinator Klaster {purchaseOrder.wilayah}</strong>
        </div>
        <div>
          <span>Disetujui supplier,</span>
          <strong>{purchaseOrder.supplierName}</strong>
        </div>
      </section>
    </article>
  );
}
