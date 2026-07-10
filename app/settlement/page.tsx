import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SettlementPanel } from "@/components/settlement-panel";
import { getAuthContext } from "@/lib/auth";
import { getSettlement } from "@/lib/settlement";

export default async function SettlementPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  const settlement = await getSettlement();

  return (
    <AppShell auth={auth} active="settlement">
      <SettlementPanel
        settlement={settlement}
        backHref={auth.role === "admin" ? "/hub" : "/beranda"}
      />
    </AppShell>
  );
}
