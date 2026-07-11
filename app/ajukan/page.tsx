import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DemandForm } from "@/components/demand-form";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import type { WindowOption } from "@/lib/demand";
import { devCommodities } from "@/lib/dev-fixture";
import { getPoolDetail } from "@/lib/pools";

export const metadata = {
  title: "Ajukan Kebutuhan",
};

type SubmitDemandPageProps = {
  searchParams: Promise<{
    pool?: string;
    commodity?: string;
    qty?: string;
    baseline?: string;
  }>;
};

/** Parse angka positif dari query deep-link; selain itu abaikan (pakai default form). */
function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function inferWindowOption(windowStart: string, windowEnd: string): WindowOption {
  const start = new Date(`${windowStart}T00:00:00Z`);
  const end = new Date(`${windowEnd}T00:00:00Z`);
  const duration = Math.round((end.getTime() - start.getTime()) / 86_400_000);

  if (duration === 13) return "two-weeks";

  const lastDayOfMonth = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
  ).getUTCDate();
  if (start.getUTCDate() === 1 && end.getUTCDate() === lastDayOfMonth) {
    return "month";
  }

  return "week";
}

export default async function SubmitDemandPage({
  searchParams,
}: SubmitDemandPageProps) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi" || !auth.cooperative) {
    redirect(getRoleDestination(auth.role));
  }

  const { pool, commodity, qty, baseline } = await searchParams;
  const selectedPool = pool ? await getPoolDetail(auth, pool) : null;
  const initialCommodityId =
    commodity ?? selectedPool?.commodityId ?? "minyak_kita";
  const initialPool =
    selectedPool?.status === "open"
      ? {
          id: selectedPool.id,
          commodityId: selectedPool.commodityId,
          wilayah: selectedPool.wilayah,
          windowOption: inferWindowOption(
            selectedPool.windowStart,
            selectedPool.windowEnd,
          ),
        }
      : undefined;

  return (
    <AppShell auth={auth} active="ajukan">
      <main className="form-page">
      <header className="form-header">
        <Link href="/beranda" aria-label="Kembali ke Beranda">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1>Ajukan Kebutuhan</h1>
      </header>

      <section className="form-content">
        <DemandForm
          commodities={devCommodities}
          cooperativeName={auth.cooperative.nama}
          wilayah={auth.cooperative.kabupaten}
          kodeWilayah={auth.cooperative.kodeWilayah}
          initialCommodityId={initialCommodityId}
          initialPool={initialPool}
          initialVolume={parsePositiveInt(qty)}
          initialPrice={parsePositiveInt(baseline)}
        />
      </section>
      </main>
    </AppShell>
  );
}
