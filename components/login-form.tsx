"use client";

import { useActionState } from "react";

import {
  loginAction,
  type LoginState,
} from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import type { DemoAccount } from "@/lib/config";

type LoginFormProps = {
  demoAccount: DemoAccount | null;
};

const initialState: LoginState = { error: null };

export function LoginForm({ demoAccount }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <main className="login-page">
      <div className="login-panel">
        <header className="login-brand">
          <BrandMark />
          <div>
            <h1>KoperasiHub</h1>
            <p>Pengadaan bersama untuk Koperasi Merah Putih.</p>
          </div>
        </header>

        <form className="login-form" action={formAction}>
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={demoAccount?.email}
              required
            />
          </label>

          <label>
            <span>Kata sandi</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue={demoAccount?.password}
              required
            />
          </label>

          {state.error ? (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          ) : null}

          <button type="submit" disabled={isPending}>
            {isPending ? "Memeriksa akses…" : "Masuk"}
          </button>
        </form>

        {demoAccount ? (
          <aside className="demo-account" aria-label="Akun uji juri">
            Akun uji juri: <strong>{demoAccount.email}</strong> /{" "}
            <strong>{demoAccount.password}</strong>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
