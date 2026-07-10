import "server-only";

import { cookies } from "next/headers";

import type { DemandRole, WindowOption } from "@/lib/demand";

const DEMO_DEMANDS_COOKIE = "koperasihub_demo_demands";
const MAX_DEMO_SUBMISSIONS = 12;

export type DemoDemand = {
  id: string;
  poolId: string;
  cooperativeId: string;
  commodityId: string;
  wilayah: string;
  role: DemandRole;
  volume: number;
  price: number;
  windowOption: WindowOption;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
};

function decodeSubmissions(value: string | undefined): DemoDemand[] {
  if (!value) {
    return [];
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const submissions = JSON.parse(decoded);
    return Array.isArray(submissions) ? submissions : [];
  } catch {
    return [];
  }
}

export async function getDemoDemands(): Promise<DemoDemand[]> {
  const value = (await cookies()).get(DEMO_DEMANDS_COOKIE)?.value;
  return decodeSubmissions(value);
}

export async function appendDemoDemand(demand: DemoDemand): Promise<void> {
  const cookieStore = await cookies();
  const current = decodeSubmissions(cookieStore.get(DEMO_DEMANDS_COOKIE)?.value);
  const submissions = [...current, demand].slice(-MAX_DEMO_SUBMISSIONS);
  const value = Buffer.from(JSON.stringify(submissions), "utf8").toString("base64url");

  cookieStore.set(DEMO_DEMANDS_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}
