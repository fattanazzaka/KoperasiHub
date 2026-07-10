import "server-only";

import { cookies } from "next/headers";

import {
  DEMO_SESSION_COOKIE,
  isSupabaseConfigured,
} from "@/lib/config";
import { juryCooperative } from "@/lib/dev-fixture";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "koperasi" | "admin";

export type AuthContext = {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  cooperative: {
    id: string;
    nama: string;
    kabupaten: string;
    provinsi: string;
    simkopdesVerified: boolean;
  } | null;
  source: "supabase" | "demo";
};

export function getRoleDestination(role: UserRole): "/beranda" | "/hub" {
  return role === "admin" ? "/hub" : "/beranda";
}

async function getSupabaseAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, display_name, cooperative_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "koperasi" && profile.role !== "admin")) {
    return null;
  }

  let cooperative: AuthContext["cooperative"] = null;

  if (profile.cooperative_id) {
    const { data } = await supabase
      .from("cooperatives")
      .select("id, nama, kabupaten, provinsi, simkopdes_verified")
      .eq("id", profile.cooperative_id)
      .single();

    if (data) {
      cooperative = {
        id: data.id,
        nama: data.nama,
        kabupaten: data.kabupaten,
        provinsi: data.provinsi,
        simkopdesVerified: data.simkopdes_verified,
      };
    }
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile.display_name ?? user.email ?? "Pengguna KoperasiHub",
    role: profile.role,
    cooperative,
    source: "supabase",
  };
}

async function getDemoAuthContext(): Promise<AuthContext | null> {
  const session = (await cookies()).get(DEMO_SESSION_COOKIE)?.value;

  if (session === "jury") {
    return {
      userId: "demo-jury",
      email: process.env.DEMO_JURY_EMAIL ?? "",
      displayName: "Pengurus KDMP Karangmalang",
      role: "koperasi",
      cooperative: {
        id: juryCooperative.id,
        nama: juryCooperative.nama,
        kabupaten: juryCooperative.kabupaten,
        provinsi: juryCooperative.provinsi,
        simkopdesVerified: juryCooperative.simkopdesVerified,
      },
      source: "demo",
    };
  }

  if (session === "admin") {
    return {
      userId: "demo-admin",
      email: process.env.DEMO_ADMIN_EMAIL ?? "",
      displayName: "Admin Hub",
      role: "admin",
      cooperative: null,
      source: "demo",
    };
  }

  return null;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  return isSupabaseConfigured()
    ? getSupabaseAuthContext()
    : getDemoAuthContext();
}
