import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PoolDetailView } from "@/components/pool-detail-view";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getPoolDetail } from "@/lib/pools";

type PoolDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PoolDetailPageProps) {
  const { id } = await params;
  return { title: `Detail Pool ${id}` };
}

export default async function PoolDetailPage({ params }: PoolDetailPageProps) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi") {
    redirect(getRoleDestination(auth.role));
  }

  const { id } = await params;
  const pool = await getPoolDetail(auth, id);

  if (!pool) {
    notFound();
  }

  return (
    <AppShell auth={auth} active="pool">
      <main className="pool-page">
      <header className="form-header">
        <Link href="/pool" aria-label="Kembali ke daftar Pool Permintaan">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1>Detail Pool</h1>
      </header>

      <section className="pool-detail-wrap">
        <PoolDetailView pool={pool} />
      </section>
      </main>
    </AppShell>
  );
}
