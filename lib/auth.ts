import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

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
    kodeWilayah: string | null;
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
    .select(
      "role, display_name, cooperative_id, cooperatives(id, nama, kabupaten, provinsi, kode_wilayah)",
    )
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "koperasi" && profile.role !== "admin")) {
    return null;
  }

  const cooperativeRelation = Array.isArray(profile.cooperatives)
    ? profile.cooperatives[0]
    : profile.cooperatives;
  const cooperative: AuthContext["cooperative"] = cooperativeRelation
    ? {
        id: cooperativeRelation.id,
        nama: cooperativeRelation.nama,
        kabupaten: cooperativeRelation.kabupaten,
        provinsi: cooperativeRelation.provinsi,
        kodeWilayah: cooperativeRelation.kode_wilayah ?? null,
      }
    : null;

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
      displayName: `Pengurus ${juryCooperative.nama}`,
      role: "koperasi",
      cooperative: {
        id: juryCooperative.id,
        nama: juryCooperative.nama,
        kabupaten: juryCooperative.kabupaten,
        provinsi: juryCooperative.provinsi,
        kodeWilayah: juryCooperative.kodeWilayah,
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

async function resolveAuthContext(): Promise<AuthContext | null> {
  return isSupabaseConfigured()
    ? getSupabaseAuthContext()
    : getDemoAuthContext();
}

// A route can request auth from its layout, page, and data loaders. React cache
// keeps those calls on the same render request from repeating Supabase lookups.
export const getAuthContext = cache(resolveAuthContext);
