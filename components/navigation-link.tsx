"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

type NavigationLinkProps = {
  href: string;
  className?: string;
  ariaCurrent?: "page";
  children: ReactNode;
};

function PendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`app-nav-pending${pending ? " is-pending" : ""}`}
    />
  );
}

export function NavigationLink({
  href,
  className,
  ariaCurrent,
  children,
}: NavigationLinkProps) {
  return (
    <Link aria-current={ariaCurrent} className={className} href={href}>
      {children}
      <PendingIndicator />
    </Link>
  );
}
