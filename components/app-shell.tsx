import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import type { AuthContext } from "@/lib/auth";

export type AppSection =
  | "beranda"
  | "pool"
  | "ajukan"
  | "alokasi"
  | "hub"
  | "settlement";

type AppShellProps = {
  auth: AuthContext;
  active: AppSection;
  children: ReactNode;
};

type NavItem = {
  id: AppSection;
  href: string;
  label: string;
  shortLabel: string;
  marker: string;
};

const cooperativeNavigation: NavItem[] = [
  { id: "beranda", href: "/beranda", label: "Beranda", shortLabel: "Beranda", marker: "01" },
  { id: "pool", href: "/pool", label: "Pool Permintaan", shortLabel: "Pool", marker: "02" },
  { id: "ajukan", href: "/ajukan", label: "Ajukan Kebutuhan", shortLabel: "Ajukan", marker: "+" },
  { id: "alokasi", href: "/alokasi", label: "PO & Alokasi", shortLabel: "PO", marker: "03" },
  { id: "settlement", href: "/settlement", label: "Net Settlement", shortLabel: "Neto", marker: "04" },
];

const adminNavigation: NavItem[] = [
  { id: "hub", href: "/hub", label: "Pusat Kendali", shortLabel: "Kendali", marker: "01" },
  { id: "settlement", href: "/settlement", label: "Net Settlement", shortLabel: "Neto", marker: "02" },
];

export function AppShell({ auth, active, children }: AppShellProps) {
  const isAdmin = auth.role === "admin";
  const navigation = isAdmin ? adminNavigation : cooperativeNavigation;
  const identity = isAdmin ? "Admin Hub" : (auth.cooperative?.nama ?? "Koperasi");
  const location = isAdmin
    ? "Pengelola pengadaan"
    : [auth.cooperative?.kabupaten, auth.cooperative?.provinsi]
        .filter(Boolean)
        .join(", ");

  return (
    <div className={`app-shell${isAdmin ? " app-shell--admin" : ""}`}>
      <aside className="app-sidebar" aria-label="Navigasi utama">
        <Link className="app-sidebar__brand" href={isAdmin ? "/hub" : "/beranda"}>
          <BrandMark size="compact" />
          <span>
            <strong>KoperasiHub</strong>
            <small>Pengadaan Bersama</small>
          </span>
        </Link>

        <nav className="app-sidebar__nav">
          <p>Menu kerja</p>
          {navigation.map((item) => (
            <Link
              className={active === item.id ? "is-active" : undefined}
              href={item.href}
              aria-current={active === item.id ? "page" : undefined}
              key={item.id}
            >
              <span aria-hidden="true">{item.marker}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="app-sidebar__account">
          <span className="app-sidebar__avatar" aria-hidden="true">
            {identity.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{identity}</strong>
            <small>{location}</small>
          </div>
          <form action={logoutAction}>
            <button type="submit">Keluar</button>
          </form>
        </div>
      </aside>

      <div className="app-shell__stage">{children}</div>

      <nav
        className={`app-bottom-nav${isAdmin ? " app-bottom-nav--admin" : ""}`}
        aria-label="Navigasi utama"
      >
        {navigation.map((item) => (
          <Link
            className={active === item.id ? "is-active" : undefined}
            href={item.href}
            aria-current={active === item.id ? "page" : undefined}
            key={item.id}
          >
            <span aria-hidden="true">{item.marker}</span>
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </div>
  );
}
