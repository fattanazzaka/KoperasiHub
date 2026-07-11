import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import type { SettlementDetail, SettlementLeg } from "@/lib/settlement";

type SettlementPanelProps = {
  settlement: SettlementDetail | null;
  backHref: string;
};

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function LegCard({ leg }: { leg: SettlementLeg }) {
  return (
    <div className="settlement-leg">
      <p className="settlement-leg__route">
        <strong>{leg.from}</strong> memasok ke {leg.to}
      </p>
      <p className="settlement-leg__commodity">
        {leg.commodity} · {leg.detail}
      </p>
      <p className="settlement-leg__amount">{formatRupiah(leg.amount)}</p>
      <p className="settlement-leg__caption">
        {leg.to} berutang ke {leg.from}
      </p>
    </div>
  );
}

export function SettlementPanel({ settlement, backHref }: SettlementPanelProps) {
  return (
    <main className="role-page">
      <header className="role-header">
        <div className="role-header__brand">
          <BrandMark size="compact" />
          <span>KoperasiHub</span>
        </div>
        <div className="admin-header__actions">
          <Link className="text-button" href={backHref}>
            Kembali
          </Link>
          <form action={logoutAction}>
            <button className="text-button" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <section className="settlement-content">
        <div className="admin-intro">
          <div className="admin-intro__heading">
            <div>
              <h1>Net Settlement</h1>
              <p>
                Saat dua koperasi saling memasok, tagihan dua arah dikompensasi.
                Hanya selisih neto yang berpindah tunai — satu pembayaran, bukan dua.
              </p>
            </div>
          </div>
        </div>

        {settlement ? (
          <>
            <div className="settlement-board">
              <LegCard leg={settlement.legAtoB} />

              <div className="settlement-net" role="group" aria-label="Selisih neto">
                <span className="settlement-net__label">Selisih neto (tunai)</span>
                <strong className="settlement-net__value">
                  {formatRupiah(settlement.net)}
                </strong>
                <span className="settlement-net__flow">
                  {settlement.payer} membayar {settlement.receiver}
                </span>
              </div>

              <LegCard leg={settlement.legBtoA} />
            </div>

            <p className="settlement-footnote">
              Tanpa net settlement, {settlement.coopA.name} dan{" "}
              {settlement.coopB.name} menerbitkan dua tagihan penuh sebesar{" "}
              {formatRupiah(settlement.legAtoB.amount)} dan{" "}
              {formatRupiah(settlement.legBtoA.amount)}. Dengan kompensasi, cukup{" "}
              <strong>{formatRupiah(settlement.net)}</strong> yang berpindah —
              mengurangi arus kas yang harus disiapkan koperasi.
            </p>
          </>
        ) : (
          <div className="admin-empty-state">
            <h3>Belum ada penyelesaian antar-koperasi</h3>
            <p>
              Panel ini aktif saat dua koperasi saling memasok pada pool berbeda.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
