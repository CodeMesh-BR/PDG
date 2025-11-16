"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/sign-in");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();

        const role = data?.data?.role || null;
        setUserRole(role);

        // 🔑 Controle de acesso por role
        if (!canAccessPage(pathname, role)) {
          router.replace("/unauthorized");
          return;
        }

        setAuthorized(true);
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("token");
        router.replace("/login");
      }
    };

    fetchUser();
  }, [router, pathname]);

  if (!isClient) return null;

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}

function canAccessPage(path: string, role: string | null): boolean {
  if (!role) return false;

  const rules: Record<string, string[]> = {
    "/employees": ["admin", "Supervisor"],
    "/companies": ["admin", "Supervisor"],
    "/services": ["admin", "Supervisor"],
  };

  for (const [route, allowedRoles] of Object.entries(rules)) {
    if (path.startsWith(route)) {
      return allowedRoles.includes(role);
    }
  }

  return true;
}
