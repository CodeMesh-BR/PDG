"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authorized, setAuthorized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/sign-in");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        const role = data?.data?.role;

        if (!canAccess(pathname, role)) {
          router.replace("/unauthorized");
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        localStorage.removeItem("token");
        router.replace("/auth/sign-in");
      }
    };

    verify();
  }, [pathname, router]);

  if (!isClient || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking access...
      </div>
    );
  }

  return <>{children}</>;
}

function canAccess(path: string, role: string | null): boolean {
  if (!role) return false;

  if (role === "admin" || role === "supervisor") return true;

  const detailerAllowed = ["/start-service", "/services-report", "/reports"];

  return detailerAllowed.some((route) => path.startsWith(route));
}
