"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon, SettingsIcon } from "./icons";

interface UserProfile {
  id: number;
  display_name: string;
  full_name: string;
  email: string;
  role: string;
  contract_pdf_path?: string | null;
  work_certificate_pdf_path?: string | null;
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  // === BUSCA O MESMO /auth/me DO useProfile ===
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.replace("/auth/sign-in");
          return;
        }

        const res = await fetch("http://localhost:8080/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load user");
        }

        const data = await res.json();

        // MESMA LÓGICA DO useProfile: data.data
        const profile: UserProfile = data.data;
        setUser(profile);
      } catch (err) {
        console.error("Error loading user:", err);
        router.replace("/auth/sign-in");
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      setLoadingLogout(true);
      const token = localStorage.getItem("token");

      if (token) {
        await fetch("http://localhost:8080/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }

      localStorage.removeItem("token");
      setIsOpen(false);
      router.replace("/auth/sign-in");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem("token");
      router.replace("/auth/sign-in");
    } finally {
      setLoadingLogout(false);
    }
  };

  const displayName = user?.display_name || user?.full_name || "User";

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-3">
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{user ? displayName : "Loading..."}</span>
            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[17.5rem]"
        align="end"
      >
        {/* USER INFO */}
        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {user ? displayName : "Loading..."}
            </div>
            <div className="leading-none text-gray-6">{user?.email ?? ""}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        {/* PROFILE */}
        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />
            <span className="mr-auto text-base font-medium">Profile</span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        {/* LOGOUT */}
        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6">
          <button
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white",
              loadingLogout && "cursor-not-allowed opacity-70",
            )}
            onClick={handleLogout}
            disabled={loadingLogout}
          >
            <LogOutIcon />
            <span className="text-base font-medium">
              {loadingLogout ? "Logging out..." : "Log out"}
            </span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
