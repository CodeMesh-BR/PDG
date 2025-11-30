"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { compactFormat } from "@/lib/format-number";
import { OverviewCard } from "./card";
import * as icons from "./icons";

interface OverviewData {
  employees: { value: number };
  profit: { value: number };
  products: { value: number };
}

export function OverviewCardsGroup() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const usersRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (!usersRes.ok) {
          const err = await usersRes.json();
          throw new Error(err.message || "Failed to fetch employees");
        }

        const usersData = await usersRes.json();
        const totalEmployees = usersData.total ?? usersData.data?.length ?? 0;

        const servicesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/services`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        if (!servicesRes.ok) {
          const err = await servicesRes.json();
          throw new Error(err.message || "Failed to fetch services");
        }

        const servicesData = await servicesRes.json();
        const totalProfit = (servicesData.data || []).reduce(
          (sum: number, service: any) => sum + parseFloat(service.value || 0),
          0,
        );

        setData({
          employees: { value: totalEmployees },
          profit: { value: totalProfit },
          products: { value: (servicesData.data || []).length },
        });
      } catch (err: any) {
        console.error("Error fetching overview:", err.message);
        setError(err.message);
      }
    };

    fetchOverview();
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>Loading overview...</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:gap-7.5">
      <Link href="/employees" className="block transition hover:opacity-90">
        <OverviewCard
          label="Total Employees"
          data={{ value: compactFormat(data.employees.value) }}
          Icon={icons.Users}
        />
      </Link>

      <Link href="/services" className="block transition hover:opacity-90">
        <OverviewCard
          label="Total Profit"
          data={{ value: "$" + compactFormat(data.profit.value) }}
          Icon={icons.Profit}
        />
      </Link>

      <OverviewCard
        label="Total Services"
        data={{ value: compactFormat(data.products.value) }}
        Icon={icons.Product}
      />
    </div>
  );
}
