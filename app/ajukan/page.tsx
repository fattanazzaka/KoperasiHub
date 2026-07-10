import Link from "next/link";
import { redirect } from "next/navigation";

import { DemandForm } from "@/components/demand-form";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { devCommodities } from "@/lib/dev-fixture";

export const metadata = {
  title: "Ajukan Kebutuhan",
};

export default async function SubmitDemandPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi" || !auth.cooperative) {
    redirect(getRoleDestination(auth.role));
  }

  return (
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
        />
      </section>
    </main>
  );
}
