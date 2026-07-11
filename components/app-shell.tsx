import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/actions/auth";
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
};

const cooperativeNavigation: NavItem[] = [
  { id: "beranda", href: "/beranda", label: "Beranda", shortLabel: "Beranda" },
  { id: "pool", href: "/pool", label: "Pool Permintaan", shortLabel: "Pool" },
  { id: "ajukan", href: "/ajukan", label: "Ajukan Kebutuhan", shortLabel: "Ajukan" },
  { id: "alokasi", href: "/alokasi", label: "PO & Alokasi", shortLabel: "PO" },
  { id: "settlement", href: "/settlement", label: "Net Settlement", shortLabel: "Neto" },
];

const adminNavigation: NavItem[] = [
  { id: "hub", href: "/hub", label: "Pusat Kendali", shortLabel: "Kendali" },
  { id: "settlement", href: "/settlement", label: "Net Settlement", shortLabel: "Neto" },
];

function NavigationIcon({ id }: { id: AppSection }) {
  const paths: Record<AppSection, ReactNode> = {
    beranda: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </>
    ),
    pool: (
      <>
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 12 10 5 10-5" />
        <path d="m2 17 10 5 10-5" />
      </>
    ),
    ajukan: <path d="M12 5v14M5 12h14" />,
    alokasi: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </>
    ),
    hub: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <rect height="7" rx="1" width="7" x="14" y="14" />
      </>
    ),
    settlement: (
      <>
        <path d="M7 7h11l-3-3" />
        <path d="m18 7-3 3" />
        <path d="M17 17H6l3 3" />
        <path d="m6 17 3-3" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[id]}
    </svg>
  );
}

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
      <header className="app-topbar">
        <Link className="app-topbar__brand" href={isAdmin ? "/hub" : "/beranda"}>
          <Image
            alt="KoperasiHub"
            height={40}
            priority
            src="/koperasihub-lockup-white.svg"
            width={158}
          />
        </Link>
        <form action={logoutAction}>
          <button className="app-topbar__logout" type="submit">
            Keluar
          </button>
        </form>
      </header>

      <aside className="app-sidebar" aria-label="Navigasi utama">
        <Link className="app-sidebar__brand" href={isAdmin ? "/hub" : "/beranda"}>
          <Image
            alt="KoperasiHub"
            height={64}
            priority
            src="/koperasihub-lockup-white.svg"
            width={252}
          />
        </Link>

        <nav className="app-sidebar__nav">
          {navigation.map((item) => (
            <Link
              className={active === item.id ? "is-active" : undefined}
              href={item.href}
              aria-current={active === item.id ? "page" : undefined}
              key={item.id}
            >
              <span className="app-nav-icon">
                <NavigationIcon id={item.id} />
              </span>
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
            <span className="app-nav-icon">
              <NavigationIcon id={item.id} />
            </span>
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </div>
  );
}
