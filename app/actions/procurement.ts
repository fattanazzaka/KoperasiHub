"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/lib/auth";
import { issuePurchaseOrder } from "@/lib/procurement";

export type IssuePoState = {
  error: string | null;
};

export async function issuePoAction(
  poolId: string,
  _previousState: IssuePoState,
  _formData: FormData,
): Promise<IssuePoState> {
  void _previousState;
  void _formData;

  const auth = await getAuthContext();
  if (!auth) {
    redirect("/");
  }
  if (auth.role !== "admin") {
    redirect("/beranda");
  }

  const result = await issuePurchaseOrder(auth, poolId);
  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/hub");
  revalidatePath("/pool");
  revalidatePath("/alokasi");
  redirect(`/po/${result.poolId}`);
}
