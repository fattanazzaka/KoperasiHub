import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { RoleHome } from "@/components/role-home";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getPoolDetails } from "@/lib/pools";
import { getCooperativeAllocations } from "@/lib/procurement";

export default async function CooperativeHomePage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi") {
    redirect(getRoleDestination(auth.role));
  }

  const [pools, allocations] = await Promise.all([
    getPoolDetails(auth, {
      status: "open",
      wilayah: auth.cooperative?.kabupaten,
    }),
    getCooperativeAllocations(auth),
  ]);

  return (
    <AppShell auth={auth} active="beranda">
      <RoleHome auth={auth} pools={pools} allocations={allocations} />
    </AppShell>
  );
}
