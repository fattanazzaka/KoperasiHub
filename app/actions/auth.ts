"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getRoleDestination, type UserRole } from "@/lib/auth";
import {
  DEMO_SESSION_COOKIE,
  getDemoAccounts,
  isSupabaseConfigured,
} from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

function readCredential(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = readCredential(formData, "email").toLowerCase();
  const password = readCredential(formData, "password");

  if (!email || !password) {
    return { error: "Masukkan email dan kata sandi untuk melanjutkan." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: "Email atau kata sandi tidak sesuai. Periksa lalu coba lagi." };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || (profile.role !== "koperasi" && profile.role !== "admin")) {
      await supabase.auth.signOut();
      return { error: "Profil akses belum tersedia. Hubungi Admin Hub." };
    }

    redirect(getRoleDestination(profile.role));
  }

  const demoAccounts = getDemoAccounts();
  let session: "jury" | "admin" | null = null;
  let role: UserRole | null = null;

  if (
    demoAccounts.jury &&
    email === demoAccounts.jury.email.toLowerCase() &&
    password === demoAccounts.jury.password
  ) {
    session = "jury";
    role = "koperasi";
  } else if (
    demoAccounts.admin &&
    email === demoAccounts.admin.email.toLowerCase() &&
    password === demoAccounts.admin.password
  ) {
    session = "admin";
    role = "admin";
  }

  if (!session || !role) {
    const configured = demoAccounts.jury || demoAccounts.admin;
    return {
      error: configured
        ? "Email atau kata sandi tidak sesuai. Periksa lalu coba lagi."
        : "Akun demo belum dikonfigurasi di environment lokal.",
    };
  }

  (await cookies()).set(DEMO_SESSION_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(getRoleDestination(role));
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  (await cookies()).delete(DEMO_SESSION_COOKIE);
  redirect("/");
}
