import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AdminHub } from "@/components/admin-hub";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getPoolDetails } from "@/lib/pools";
import { getIssuedPoolIds } from "@/lib/procurement";

export default async function AdminHubPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "admin") {
    redirect(getRoleDestination(auth.role));
  }

  const [pools, issuedPoolIds] = await Promise.all([
    getPoolDetails(auth),
    getIssuedPoolIds(),
  ]);

  return (
    <AppShell auth={auth} active="hub">
      <AdminHub pools={pools} issuedPoolIds={issuedPoolIds} />
    </AppShell>
  );
}
