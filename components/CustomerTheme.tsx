"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function CustomerTheme({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <div className={isAdmin ? "" : "rangrez-customer-theme"}>
      {children}
    </div>
  );
}
