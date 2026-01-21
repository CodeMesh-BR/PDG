"use client";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [checkedRole, setCheckedRole] = useState(false);

  const isAuthPage =
    pathname?.startsWith("/auth") ||
    pathname === "/auth/sign-in" ||
    pathname === "/unauthorized";

  useEffect(() => {
    if (isAuthPage) {
      setCheckedRole(true);
      return;
    }

    const cachedRole = localStorage.getItem("role");
    if (cachedRole) {
      setRole(cachedRole.toLowerCase());
      setCheckedRole(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setCheckedRole(true);
      return;
    }

    const fetchRole = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          setCheckedRole(true);
          return;
        }

        const data = await res.json();
        const nextRole = (data?.data?.role || "").toLowerCase();
        if (nextRole) {
          localStorage.setItem("role", nextRole);
          setRole(nextRole);
        }
      } finally {
        setCheckedRole(true);
      }
    };

    fetchRole();
  }, [isAuthPage]);

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-dark">
        {children}
      </main>
    );
  }

  if (!checkedRole) {
    return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-dark">
        {children}
      </main>
    );
  }

  const isDetailer = role === "detailer";

  return (
    <div className="flex min-h-screen">
      {!isDetailer && <Sidebar />}

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header hideSidebarToggle={isDetailer} />
        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
