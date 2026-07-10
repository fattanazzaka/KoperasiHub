import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getAuthContext, getRoleDestination } from "@/lib/auth";
import { getDemoAccounts } from "@/lib/config";

export default async function LoginPage() {
  const auth = await getAuthContext();

  if (auth) {
    redirect(getRoleDestination(auth.role));
  }

  return <LoginForm demoAccount={getDemoAccounts().jury} />;
}
