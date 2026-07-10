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
  validateDemandForm,
} from "@/lib/demand";
import { appendDemoDemand } from "@/lib/demo-demands";
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
): Promise<{ demandId: string; poolId: string } | null> {
  const supabase = await createSupabaseServerClient();
  const poolQuery = () =>
    supabase
      .from("pools")
      .select("id")
      .eq("commodity_id", submission.commodity.id)
      .eq("wilayah", wilayah)
      .eq("window_start", submission.windowStart)
      .eq("window_end", submission.windowEnd)
      .eq("status", "open")
      .maybeSingle();

  let { data: pool, error: poolError } = await poolQuery();

  if (poolError) {
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
      .select("id")
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
    ? { demandId: demand.id, poolId: pool.id }
    : null;
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

  const poolName = createPoolName(
    submission.commodity.nama,
    auth.cooperative.kabupaten,
  );
  let demandId: string;
  let poolId: string;

  if (isSupabaseConfigured()) {
    const result = await submitToSupabase(
      auth.cooperative.id,
      auth.cooperative.kabupaten,
      submission,
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
  } else {
    demandId = crypto.randomUUID();
    poolId = [
      "demo",
      submission.commodity.id,
      auth.cooperative.kabupaten.toLowerCase(),
      submission.windowStart,
    ].join("-");

    await appendDemoDemand({
      id: demandId,
      poolId,
      cooperativeId: auth.cooperative.id,
      commodityId: submission.commodity.id,
      wilayah: auth.cooperative.kabupaten,
      role: submission.role,
      volume: submission.volume,
      price: submission.price,
      windowOption: submission.windowOption,
      windowStart: submission.windowStart,
      windowEnd: submission.windowEnd,
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath("/beranda");

  return {
    fieldErrors: {},
    formError: null,
    success: {
      submissionId: demandId,
      poolId,
      poolName,
      wilayah: auth.cooperative.kabupaten,
      role: submission.role,
      volume: submission.volume,
      unit: submission.commodity.satuan,
    },
  };
}
