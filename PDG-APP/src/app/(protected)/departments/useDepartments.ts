"use client";

import { API_BASE_URL } from "@/lib/api";

import { useEffect, useState } from "react";

export interface Department {
  id: number;
  name: string;
  description?: string | null;
  bill_by_unit: boolean;
  bill_by_hour: boolean;
  bill_by_quantity: boolean;
  created_at?: string;
  updated_at?: string;
}

export function getBillingModes(department?: Department | null) {
  if (!department) return "";

  const modes = [
    department.bill_by_unit ? "Unit" : "",
    department.bill_by_hour ? "Hour" : "",
    department.bill_by_quantity ? "Quantity" : "",
  ].filter(Boolean);

  return modes.join(", ");
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_BASE_URL}/departments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch departments: ${res.statusText}`);
      }

      const data = await res.json();
      setDepartments(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return { departments, loading, error, refresh: fetchDepartments };
}
