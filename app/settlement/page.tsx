import { redirect } from "next/navigation";

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
    <SettlementPanel
      settlement={settlement}
      backHref={auth.role === "admin" ? "/hub" : "/beranda"}
    />
  );
}
