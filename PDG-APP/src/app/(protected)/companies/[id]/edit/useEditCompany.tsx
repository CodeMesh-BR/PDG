"use client";

import { useEffect, useState } from "react";

import { Company } from "../../useCompanies";
import { useServicesCatalog } from "@/app/(protected)/services-catalog/useServicesCatalog";

export function useEditCompany(id: number) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { services } = useServicesCatalog();

  const fetchCompany = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) throw new Error("Failed to load company");

      const data = await res.json();
      setCompany(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveCompany = async (updates: any) => {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updates),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update company");
      }

      await fetchCompany();

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  return { company, loading, saving, error, services, saveCompany };
}
