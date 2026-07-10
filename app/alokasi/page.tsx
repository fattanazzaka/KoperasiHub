import Link from "next/link";
import { redirect } from "next/navigation";

import { AllocationList } from "@/components/allocation-list";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getCooperativeAllocations } from "@/lib/procurement";

export const metadata = {
  title: "Alokasi Saya",
};

export default async function AllocationPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/");
  }
  if (auth.role !== "koperasi") {
    redirect(getRoleDestination(auth.role));
  }

  const allocations = await getCooperativeAllocations(auth);

  return (
    <main className="allocation-page">
      <header className="form-header">
        <Link href="/beranda" aria-label="Kembali ke Beranda">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1>Alokasi Saya</h1>
      </header>

      <section className="allocation-content">
        <div className="allocation-intro">
          <p className="eyebrow">Alokasi Proporsional</p>
          <h2>PO yang Anda ikuti</h2>
        </div>
        <AllocationList allocations={allocations} />
      </section>
    </main>
  );
}
