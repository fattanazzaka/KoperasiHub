import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DemandForm } from "@/components/demand-form";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { devCommodities } from "@/lib/dev-fixture";

export const metadata = {
  title: "Ajukan Kebutuhan",
};

type SubmitDemandPageProps = {
  searchParams: Promise<{ commodity?: string; qty?: string; baseline?: string }>;
};

/** Parse angka positif dari query deep-link; selain itu abaikan (pakai default form). */
function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
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

  const { commodity, qty, baseline } = await searchParams;

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
          initialCommodityId={commodity ?? "minyak_kita"}
          initialVolume={parsePositiveInt(qty)}
          initialPrice={parsePositiveInt(baseline)}
        />
      </section>
      </main>
    </AppShell>
  );
}
