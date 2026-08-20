"use client";

import { API_BASE_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanies } from "../../../companies/useCompanies";

export interface ClientRecord {
  id: number;
  display_name: string;
  full_name: string;
  email: string;
  address?: string;
  phone?: string;
  companies?: { id: number; name: string; display_name?: string }[];
}

export function useEditClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientRecord | null>(null);
  const [companyIds, setCompanyIds] = useState<number[]>([]);

  const { companies } = useCompanies({ perPage: 100 });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to load client");

        const data = await res.json();
        setClient(data.data);
        setCompanyIds((data.data.companies || []).map((c: any) => c.id));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  const handleChange = (field: keyof ClientRecord, value: any) => {
    setClient((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleCompany = (companyId: number) => {
    setCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((c) => c !== companyId)
        : [...prev, companyId],
    );
  };

  const handleSave = async () => {
    if (!client) return;

    setError("");
    setSuccess("");

    if (companyIds.length === 0) {
      setError("Client must be linked to at least one company.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          display_name: client.display_name,
          full_name: client.full_name,
          email: client.email,
          phone: client.phone,
          address: client.address,
          company_ids: companyIds,
          company_ids_provided: true,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to update client");
      }

      setSuccess("Client updated successfully!");
      navigate("/clients");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    client,
    companies,
    companyIds,
    loading,
    saving,
    error,
    success,

    handleChange,
    toggleCompany,
    handleSave,
  };
}
