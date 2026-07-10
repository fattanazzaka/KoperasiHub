"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  issuePoAction,
  type IssuePoState,
} from "@/app/actions/procurement";
import type { PoolSummary } from "@/lib/pool-types";

type AdminPoolControlProps = {
  pool: PoolSummary;
  issued: boolean;
};

const initialState: IssuePoState = { error: null };

export function AdminPoolControl({ pool, issued }: AdminPoolControlProps) {
  const action = issuePoAction.bind(null, pool.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const eligibleTier = pool.progress.eligibleTier;

  return (
    <article className="admin-pool-card">
      <div className="admin-pool-card__info">
        <div>
          <h2>{pool.commodityName}</h2>
          <p>Klaster {pool.wilayah}</p>
        </div>
        <strong>
          {pool.totalVolume.toLocaleString("id-ID")} {pool.unit}
        </strong>
      </div>

      <div className="admin-pool-card__tier">
        {eligibleTier ? (
          <>
            <span>Tier {eligibleTier.name} tersedia</span>
            <strong>
              Rp{eligibleTier.pricePerUnit.toLocaleString("id-ID")}/{pool.unit}
            </strong>
          </>
        ) : (
          <span>Ambang Tier belum tercapai</span>
        )}
      </div>

      {issued || pool.status === "po_issued" ? (
        <Link className="admin-po-link" href={`/po/${pool.id}`}>
          Lihat PO Konsolidasi
        </Link>
      ) : (
        <form action={formAction}>
          <button type="submit" disabled={!eligibleTier || isPending}>
            {isPending ? "Menerbitkan PO…" : "Kunci Pool & Terbitkan PO"}
          </button>
        </form>
      )}

      {state.error ? (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </article>
  );
}
