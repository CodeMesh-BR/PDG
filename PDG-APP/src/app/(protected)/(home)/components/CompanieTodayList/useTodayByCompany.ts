"use client";

import { useEffect, useState } from "react";

export type CompanyToday = {
  company_name: string;
  cars: number;
};

export function useTodayByCompany() {
  const [data, setData] = useState<CompanyToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/today-by-company`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to load companies");
        }

        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading, error };
}
