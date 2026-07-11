"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import {
  describeEligibility,
  evaluateSupplierEligibility,
} from "@/lib/cross-supply";
import {
  type DemandFieldErrors,
  resolveDemandWindow,
  validateDemandForm,
} from "@/lib/demand";
import { appendDemoDemand, getDemoDemands } from "@/lib/demo-demands";
import { devPools } from "@/lib/dev-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DemandSuccess = {
  submissionId: string;
  poolId: string;
  poolName: string;
  wilayah: string;
  role: "demand" | "supply";
  volume: number;
  unit: "kg" | "liter";
};

export type DemandActionState = {
  fieldErrors: DemandFieldErrors;
  formError: string | null;
  success: DemandSuccess | null;
};

function createPoolName(commodityName: string, wilayah: string): string {
  return `Pool ${commodityName} — Klaster ${wilayah}`;
}

async function submitToSupabase(
  cooperativeId: string,
  wilayah: string,
  submission: Extract<ReturnType<typeof validateDemandForm>, { success: true }>["data"],
  targetPoolId: string | null,
): Promise<{ demandId: string; poolId: string; wilayah: string } | null> {
  const supabase = await createSupabaseServerClient();
  const poolQuery = () =>
    supabase
      .from("pools")
      .select("id, wilayah, window_start, window_end")
      .eq("commodity_id", submission.commodity.id)
      .eq("wilayah", wilayah)
      .eq("window_start", submission.windowStart)
      .eq("window_end", submission.windowEnd)
      .eq("status", "open")
      .maybeSingle();

  let pool;
  let poolError;

  if (targetPoolId) {
    const targetResult = await supabase
      .from("pools")
      .select("id, wilayah, window_start, window_end")
      .eq("id", targetPoolId)
      .eq("commodity_id", submission.commodity.id)
      .eq("status", "open")
      .maybeSingle();
    pool = targetResult.data;
    poolError = targetResult.error;
  } else {
    const poolResult = await poolQuery();
    pool = poolResult.data;
    poolError = poolResult.error;
  }

  if (poolError) {
    return null;
  }

  if (!pool && targetPoolId) {
    return null;
  }

  if (!pool) {
    const result = await supabase
      .from("pools")
      .insert({
        commodity_id: submission.commodity.id,
        wilayah,
        window_start: submission.windowStart,
        window_end: submission.windowEnd,
        status: "open",
      })
      .select("id, wilayah, window_start, window_end")
      .single();

    pool = result.data;
    poolError = result.error;

    if (poolError?.code === "23505") {
      const retry = await poolQuery();
      pool = retry.data;
      poolError = retry.error;
    }
  }

  if (!pool || poolError) {
    return null;
  }

  const { data: demand, error: demandError } = await supabase
    .from("demands")
    .insert({
      pool_id: pool.id,
      cooperative_id: cooperativeId,
      role: submission.role,
      volume: submission.volume,
      harga_baseline: submission.role === "demand" ? submission.price : null,
      harga_penawaran: submission.role === "supply" ? submission.price : null,
    })
    .select("id")
    .single();

  return demand && !demandError
    ? { demandId: demand.id, poolId: pool.id, wilayah: pool.wilayah }
    : null;
}

function readTargetPoolId(formData: FormData): string | null {
  const value = formData.get("pool");
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function submitDemandAction(
  _previousState: DemandActionState,
  formData: FormData,
): Promise<DemandActionState> {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi" || !auth.cooperative) {
    redirect("/hub");
  }

  const validation = validateDemandForm(formData);

  if (!validation.success) {
    return {
      fieldErrors: validation.errors,
      formError: "Periksa kembali data yang ditandai.",
      success: null,
    };
  }

  const submission = validation.data;
  const targetPoolId = readTargetPoolId(formData);

  // Gerbang cross-supply (ADDENDUM §3): hanya penawaran suplai yang dibatasi;
  // koperasi pembeli (demand) tidak pernah dibatasi kanal.
  if (submission.role === "supply") {
    const eligibility = evaluateSupplierEligibility(
      { kodeWilayah: auth.cooperative.kodeWilayah },
      submission.commodity.id,
    );

    if (!eligibility.eligible) {
      return {
        fieldErrors: {},
        formError: describeEligibility(eligibility),
        success: null,
      };
    }
  }

  let demandId: string;
  let poolId: string;
  let poolWilayah = auth.cooperative.kabupaten;

  if (isSupabaseConfigured()) {
    const result = await submitToSupabase(
      auth.cooperative.id,
      auth.cooperative.kabupaten,
      submission,
      targetPoolId,
    );

    if (!result) {
      return {
        fieldErrors: {},
        formError: "Pengajuan belum tersimpan. Tunggu sebentar lalu kirim kembali.",
        success: null,
      };
    }

    demandId = result.demandId;
    poolId = result.poolId;
    poolWilayah = result.wilayah;
  } else {
    const existingDemands = await getDemoDemands();
    const fixture = targetPoolId
      ? devPools.find(
          (item) =>
            item.id === targetPoolId &&
            item.commodityId === submission.commodity.id,
        )
      : null;
    const existingPoolDemand = targetPoolId
      ? existingDemands.find(
          (item) =>
            item.poolId === targetPoolId &&
            item.commodityId === submission.commodity.id,
        )
      : null;

    if (targetPoolId && !fixture && !existingPoolDemand) {
      return {
        fieldErrors: {},
        formError: "Pool yang dipilih tidak lagi tersedia untuk komoditas ini.",
        success: null,
      };
    }

    const fixtureWindow = fixture
      ? resolveDemandWindow(fixture.windowOption)
      : null;
    const windowOption =
      fixture?.windowOption ??
      existingPoolDemand?.windowOption ??
      submission.windowOption;
    const windowStart =
      fixtureWindow?.windowStart ??
      existingPoolDemand?.windowStart ??
      submission.windowStart;
    const windowEnd =
      fixtureWindow?.windowEnd ??
      existingPoolDemand?.windowEnd ??
      submission.windowEnd;
    poolWilayah =
      fixture?.wilayah ??
      existingPoolDemand?.wilayah ??
      auth.cooperative.kabupaten;
    demandId = crypto.randomUUID();
    poolId =
      targetPoolId ??
      [
        "demo",
        submission.commodity.id,
        poolWilayah.toLowerCase(),
        windowStart,
      ].join("-");

    await appendDemoDemand({
      id: demandId,
      poolId,
      cooperativeId: auth.cooperative.id,
      commodityId: submission.commodity.id,
      wilayah: poolWilayah,
      role: submission.role,
      volume: submission.volume,
      price: submission.price,
      windowOption,
      windowStart,
      windowEnd,
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath("/beranda");
  revalidatePath("/pool");
  revalidatePath(`/pool/${poolId}`);

  const poolName = createPoolName(submission.commodity.nama, poolWilayah);

  return {
    fieldErrors: {},
    formError: null,
    success: {
      submissionId: demandId,
      poolId,
      poolName,
      wilayah: poolWilayah,
      role: submission.role,
      volume: submission.volume,
      unit: submission.commodity.satuan,
    },
  };
}
