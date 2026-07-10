import "server-only";

import { cookies } from "next/headers";

import type { PurchaseOrder } from "@/lib/procurement-types";

const DEMO_POS_COOKIE = "koperasihub_demo_purchase_orders";
const MAX_DEMO_PURCHASE_ORDERS = 1;

function decodePurchaseOrders(value: string | undefined): PurchaseOrder[] {
  if (!value) {
    return [];
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const purchaseOrders = JSON.parse(decoded);
    return Array.isArray(purchaseOrders) ? purchaseOrders : [];
  } catch {
    return [];
  }
}

export async function getDemoPurchaseOrders(): Promise<PurchaseOrder[]> {
  const value = (await cookies()).get(DEMO_POS_COOKIE)?.value;
  return decodePurchaseOrders(value);
}

export async function saveDemoPurchaseOrder(
  purchaseOrder: PurchaseOrder,
): Promise<void> {
  const cookieStore = await cookies();
  const current = decodePurchaseOrders(cookieStore.get(DEMO_POS_COOKIE)?.value);
  const withoutCurrentPool = current.filter(
    (item) => item.poolId !== purchaseOrder.poolId,
  );
  const purchaseOrders = [...withoutCurrentPool, purchaseOrder].slice(
    -MAX_DEMO_PURCHASE_ORDERS,
  );
  const value = Buffer.from(JSON.stringify(purchaseOrders), "utf8").toString(
    "base64url",
  );

  cookieStore.set(DEMO_POS_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}
