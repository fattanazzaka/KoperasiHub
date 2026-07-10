import { redirect } from "next/navigation";

import { RoleHome } from "@/components/role-home";
import { getAuthContext, getRoleDestination } from "@/lib/auth";

export default async function CooperativeHomePage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/");
  }

  if (auth.role !== "koperasi") {
    redirect(getRoleDestination(auth.role));
  }

  return <RoleHome auth={auth} />;
}
