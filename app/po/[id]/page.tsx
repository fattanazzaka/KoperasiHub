import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { PurchaseOrderDocument } from "@/components/purchase-order-document";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getPurchaseOrder } from "@/lib/procurement";

type PurchaseOrderPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "PO Konsolidasi",
};

export default async function PurchaseOrderPage({
  params,
}: PurchaseOrderPageProps) {
  const auth = await getAuthContext();
  if (!auth) {
    redirect("/");
  }
  if (auth.role !== "admin") {
    redirect(getRoleDestination(auth.role));
  }

  const { id } = await params;
  const purchaseOrder = await getPurchaseOrder(auth, id);
  if (!purchaseOrder) {
    notFound();
  }

  return (
    <main className="po-page">
      <header className="po-toolbar" data-print-hidden>
        <Link href="/hub" aria-label="Kembali ke Admin Hub">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <strong>PO Konsolidasi</strong>
        <PrintButton />
      </header>
      <PurchaseOrderDocument purchaseOrder={purchaseOrder} />
    </main>
  );
}
