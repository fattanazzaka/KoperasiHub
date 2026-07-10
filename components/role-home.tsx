import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import type { AuthContext } from "@/lib/auth";

type RoleHomeProps = {
  auth: AuthContext;
};

export function RoleHome({ auth }: RoleHomeProps) {
  const isAdmin = auth.role === "admin";
  const title = isAdmin ? "Admin Hub" : auth.cooperative?.nama;

  return (
    <main className="role-page">
      <header className="role-header">
        <div className="role-header__brand">
          <BrandMark size="compact" />
          <span>KoperasiHub</span>
        </div>
        <form action={logoutAction}>
          <button className="text-button" type="submit">
            Keluar
          </button>
        </form>
      </header>

      <section className="role-content">
        <div className="identity-row">
          <div>
            <p className="eyebrow">{isAdmin ? "Akses pengelola" : "Beranda koperasi"}</p>
            <h1>{title}</h1>
          </div>
          {!isAdmin && auth.cooperative?.simkopdesVerified ? (
            <span className="verified-badge">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m6 10 2.4 2.4L14 7" />
              </svg>
              Terverifikasi SIMKOPDES
            </span>
          ) : null}
        </div>

        <article className="access-card">
          <span className="access-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <div>
            <h2>Login berhasil</h2>
            <p>
              Anda masuk sebagai <strong>{isAdmin ? "Admin Hub" : "koperasi"}</strong>
              {auth.email ? ` melalui ${auth.email}.` : "."}
            </p>
            <p className="access-note">
              {isAdmin
                ? "Akses pengelolaan pool telah terverifikasi."
                : `Wilayah akun: ${auth.cooperative?.kabupaten}, ${auth.cooperative?.provinsi}.`}
            </p>
          </div>
        </article>

        {!isAdmin ? (
          <Link className="primary-link" href="/ajukan">
            <span aria-hidden="true">+</span>
            Ajukan Kebutuhan
          </Link>
        ) : null}
      </section>
    </main>
  );
}
