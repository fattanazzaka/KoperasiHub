"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  submitDemandAction,
  type DemandActionState,
} from "@/app/actions/demand";
import {
  describeEligibility,
  evaluateSupplierEligibility,
  type EligibilityResult,
} from "@/lib/cross-supply";
import {
  windowOptions,
  type DemandRole,
} from "@/lib/demand";
import type { DevCommodity } from "@/lib/dev-fixture";

type DemandFormProps = {
  commodities: readonly DevCommodity[];
  cooperativeName: string;
  wilayah: string;
  kodeWilayah: string | null;
  initialCommodityId?: string;
  // Pre-fill dari deep-link kartu rekomendasi (US-09 AC3) — tetap bisa diedit.
  initialVolume?: number;
  initialPrice?: number;
};

const initialState: DemandActionState = {
  fieldErrors: {},
  formError: null,
  success: null,
};

const commodityDefaults: Record<
  string,
  {
    demandVolume: number;
    demandPrice: number;
    supplyVolume: number;
    supplyPrice: number;
  }
> = {
  minyak_kita: {
    demandVolume: 400,
    demandPrice: 15_700,
    supplyVolume: 1_000,
    supplyPrice: 13_500,
  },
  telur: {
    demandVolume: 150,
    demandPrice: 28_000,
    supplyVolume: 800,
    supplyPrice: 25_000,
  },
};

const fallbackDefaults = {
  demandVolume: 800,
  demandPrice: 15_358,
  supplyVolume: 1_500,
  supplyPrice: 14_700,
};

export function DemandForm({
  commodities,
  cooperativeName,
  wilayah,
  kodeWilayah,
  initialCommodityId,
  initialVolume,
  initialPrice,
}: DemandFormProps) {
  const defaultCommodityId =
    initialCommodityId &&
    commodities.some((item) => item.id === initialCommodityId)
      ? initialCommodityId
      : (commodities[0]?.id ?? "");
  const [role, setRole] = useState<DemandRole>("demand");
  const [commodityId, setCommodityId] = useState<string>(defaultCommodityId);
  const [dismissedSubmission, setDismissedSubmission] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    submitDemandAction,
    initialState,
  );
  const commodity = useMemo(
    () => commodities.find((item) => item.id === commodityId) ?? commodities[0],
    [commodities, commodityId],
  );
  const showSuccess = Boolean(
    state.success && state.success.submissionId !== dismissedSubmission,
  );
  const isDemand = role === "demand";
  const defaults = commodityDefaults[commodityId] ?? fallbackDefaults;
  // Pre-fill deep-link hanya berlaku untuk komoditas yang direkomendasikan &
  // peran demand; ganti komoditas/peran → kembali ke default biasa. Input tetap
  // editable (hanya defaultValue; remount via key saat role/komoditas berubah).
  const prefillActive = isDemand && commodityId === defaultCommodityId;
  const volumeDefault =
    prefillActive && initialVolume ? initialVolume : undefined;
  const priceDefault = prefillActive && initialPrice ? initialPrice : undefined;
  // Eligibilitas cross-supply (ADDENDUM §3) per komoditas untuk peran suplai.
  // Gerbang sebenarnya tetap di server action; ini hanya feedback & guard UX.
  const supplyEligibilityByCommodity = useMemo(() => {
    const map: Record<string, EligibilityResult> = {};
    for (const item of commodities) {
      map[item.id] = evaluateSupplierEligibility({ kodeWilayah }, item.id);
    }
    return map;
  }, [commodities, kodeWilayah]);
  const supplyEligibility =
    supplyEligibilityByCommodity[commodityId] ??
    evaluateSupplierEligibility({ kodeWilayah }, commodityId);
  const blockSupply = !isDemand && !supplyEligibility.eligible;

  return (
    <>
      <form className="demand-form" action={formAction} noValidate>
        <input type="hidden" name="role" value={role} />

        <fieldset className="role-segment" aria-label="Peran pengajuan">
          <button
            type="button"
            className={isDemand ? "is-active" : undefined}
            aria-pressed={isDemand}
            onClick={() => setRole("demand")}
          >
            Saya butuh
          </button>
          <button
            type="button"
            className={!isDemand ? "is-active" : undefined}
            aria-pressed={!isDemand}
            onClick={() => setRole("supply")}
          >
            Saya bisa suplai
          </button>
        </fieldset>

        {state.fieldErrors.role ? (
          <p className="field-error" role="alert">
            {state.fieldErrors.role}
          </p>
        ) : null}

        <label className="field-group">
          <span>Komoditas</span>
          <select
            name="commodity"
            value={commodityId}
            onChange={(event) => setCommodityId(event.target.value)}
            aria-invalid={Boolean(state.fieldErrors.commodity)}
            aria-describedby={state.fieldErrors.commodity ? "commodity-error" : undefined}
          >
            {commodities.map((item) => {
              const supplyResult = supplyEligibilityByCommodity[item.id];
              const optionBlocked = !isDemand && !supplyResult?.eligible;
              const suffix = !optionBlocked
                ? ""
                : supplyResult?.reason === "blocked_channel"
                  ? " — wajib pooling"
                  : " — wilayah tak terkualifikasi";
              return (
                <option key={item.id} value={item.id} disabled={optionBlocked}>
                  {item.nama}
                  {suffix}
                </option>
              );
            })}
          </select>
          {state.fieldErrors.commodity ? (
            <small className="field-error" id="commodity-error">
              {state.fieldErrors.commodity}
            </small>
          ) : null}
        </label>

        {!isDemand ? (
          <p
            className={`supply-eligibility${blockSupply ? " is-blocked" : " is-eligible"}`}
            role={blockSupply ? "alert" : undefined}
          >
            {blockSupply
              ? describeEligibility(supplyEligibility)
              : "Wilayah Anda terkualifikasi memasok komoditas ini."}
          </p>
        ) : null}

        <div className="volume-row">
          <label className="field-group">
            <span>{isDemand ? "Volume kebutuhan" : "Kapasitas suplai"}</span>
            <input
              key={`${role}-${commodityId}`}
              name="volume"
              type="number"
              inputMode="numeric"
              min="1"
              max="1000000"
              step="1"
              defaultValue={
                volumeDefault ??
                (isDemand ? defaults.demandVolume : defaults.supplyVolume)
              }
              aria-invalid={Boolean(state.fieldErrors.volume)}
              aria-describedby={state.fieldErrors.volume ? "volume-error" : undefined}
              required
            />
            {state.fieldErrors.volume ? (
              <small className="field-error" id="volume-error">
                {state.fieldErrors.volume}
              </small>
            ) : null}
          </label>

          <label className="field-group">
            <span>Satuan</span>
            <input value={commodity?.satuan ?? "-"} readOnly aria-readonly="true" />
          </label>
        </div>

        <label className="field-group" key={`price-${role}-${commodityId}`}>
          <span>
            {isDemand ? "Harga beli Anda saat ini" : "Harga penawaran Anda"} /
            {commodity?.satuan ?? "unit"}
          </span>
          <div className="currency-input">
            <span aria-hidden="true">Rp</span>
            <input
              name="price"
              type="number"
              inputMode="numeric"
              min="1"
              max="1000000000"
              step="1"
              defaultValue={
                priceDefault ??
                (isDemand ? defaults.demandPrice : defaults.supplyPrice)
              }
              aria-invalid={Boolean(state.fieldErrors.price)}
              aria-describedby={state.fieldErrors.price ? "price-error" : "price-help"}
              required
            />
          </div>
          <small className="field-help" id="price-help">
            {isDemand
              ? "Dipakai menghitung penghematan Anda — isi jujur, bukan harga eceran nasional."
              : "Harga franco gudang klaster, sudah termasuk ongkos kirim."}
          </small>
          {state.fieldErrors.price ? (
            <small className="field-error" id="price-error">
              {state.fieldErrors.price}
            </small>
          ) : null}
        </label>

        <label className="field-group">
          <span>Jendela waktu</span>
          <select
            name="window"
            defaultValue="week"
            aria-invalid={Boolean(state.fieldErrors.window)}
            aria-describedby={state.fieldErrors.window ? "window-error" : undefined}
          >
            {windowOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors.window ? (
            <small className="field-error" id="window-error">
              {state.fieldErrors.window}
            </small>
          ) : null}
        </label>

        <label className="field-group">
          <span>Wilayah pool</span>
          <input value={wilayah} readOnly aria-readonly="true" />
          <small className="field-help">Mengikuti profil {cooperativeName}.</small>
        </label>

        {state.formError ? (
          <p className="form-error" role="alert">
            {state.formError}
          </p>
        ) : null}

        <button
          className="submit-demand"
          type="submit"
          disabled={isPending || blockSupply}
        >
          {isPending
            ? "Mengirim ke Pool…"
            : blockSupply
              ? "Belum memenuhi syarat pemasok"
              : isDemand
                ? "Kirim ke Pool"
                : "Kirim penawaran ke Pool"}
        </button>
      </form>

      {showSuccess && state.success ? (
        <div className="confirmation-layer">
          <button
            type="button"
            className="confirmation-backdrop"
            aria-label="Tutup konfirmasi"
            onClick={() => setDismissedSubmission(state.success?.submissionId ?? null)}
          />
          <section className="confirmation-sheet" role="dialog" aria-modal="true">
            <span className="sheet-handle" aria-hidden="true" />
            <p className="eyebrow">
              {state.success.role === "demand" ? "Kebutuhan tercatat" : "Penawaran tercatat"}
            </p>
            <h2>{state.success.poolName}</h2>
            <p className="confirmation-summary">
              {state.success.volume.toLocaleString("id-ID")} {state.success.unit} telah{" "}
              {state.success.role === "demand"
                ? "bergabung ke Pool Permintaan yang sesuai."
                : "diteruskan ke jaringan supplier untuk pool ini."}
            </p>
            <Link className="sheet-primary" href={`/pool/${state.success.poolId}`}>
              Lihat posisi di Detail Pool
            </Link>
            <button
              className="sheet-secondary"
              type="button"
              onClick={() => setDismissedSubmission(state.success?.submissionId ?? null)}
            >
              Buat pengajuan lain
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
