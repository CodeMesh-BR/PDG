"use client";

import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [authorized, setAuthorized] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth/sign-in", { replace: true });
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        const role = (data?.data?.role || "").toLowerCase();
        localStorage.setItem("role", role);

        if (!canAccess(pathname, role)) {
          if (role === "detailer") {
            navigate("/start-service", { replace: true });
          } else {
            navigate("/unauthorized", { replace: true });
          }
        } else {
          setAuthorized(true);
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/auth/sign-in", { replace: true });
      }
    };

    verify();
  }, [pathname, navigate]);

  if (!isClient || !authorized) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking access...
      </div>
    );
  }

  return <Outlet />;
}

function canAccess(path: string, role: string | null): boolean {
  if (!role) return false;

  if (role === "admin" || role === "supervisor") return true;

  if (role === "detailer") {
    return path.startsWith("/start-service");
  }

  return false;
}
