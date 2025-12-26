"use client";

import { useEffect, useState } from "react";

export type ChartPoint = {
  date: string;
  services: number;
};

export type DashboardOverview = {
  today: {
    cars: number;
    companies: number;
    revenue: number;
  };
  week: ChartPoint[];
  fortnight: ChartPoint[];
};

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/overview`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to load dashboard");
        }

        const json: DashboardOverview = await res.json();
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
