"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export interface Employee {
  id: number;
  display_name: string;
  full_name: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
  availability?: string[];
  contract_pdf_path?: string;
  password?: string;
  password_confirmation?: string;
}

export function useEditEmployee() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<Employee | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [contractPdf, setContractPdf] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const weekDays = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

  /** LOAD USER */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Unauthorized");

        const res = await fetch(`http://localhost:8080/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to load user");

        const data = await res.json();
        setUser(data.data);
        setAvailability(data.data.availability || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  /** FORM CHANGE HANDLER */
  const handleChange = (field: keyof Employee, value: any) => {
    setUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const handleContractUpload = (file: File | null) => {
    setContractPdf(file);
  };

  /** SAVE */
  const handleSave = async () => {
    if (!user) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");


      const payload = {
        display_name: user.display_name,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        availability,
        password: user.password,
        password_confirmation: user.password_confirmation,
      };

      const formData = new FormData();
      formData.append("_method", "PATCH");
Object.entries(payload).forEach(([key, value]) => {
  if (value !== undefined && value !== null) {
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
    } else {
      formData.append(key, value as any);
    }
  }
});

      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: "POST", 
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to update employee");
      }


      if (contractPdf) {
        const fd = new FormData();
        fd.append("_method", "PATCH");
        fd.append("contract_pdf", contractPdf);

        const uploadRes = await fetch(
          `http://localhost:8080/api/users/${id}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: fd,
          }
        );

        if (!uploadRes.ok) {
          const dd = await uploadRes.json().catch(() => ({}));
          throw new Error(dd.message || "Failed to upload contract");
        }
      }

      setSuccess("Employee updated successfully!");

      router.push("/employees");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    user,
    availability,
    weekDays,
    contractPdf,
    loading,
    saving,
    error,
    success,

    handleChange,
    toggleDay,
    handleContractUpload,
    handleSave,
  };
}
