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
  password?: string;
  password_confirmation?: string;
  created_at?: string;
}

export function useEditEmployee() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (field: keyof Employee, value: string) => {
    setUser((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!user) return;
    setValidationErrors({});
    setError("");

    if (user.phone && !user.phone.startsWith("+61")) {
      setError("Phone number must start with +61 (Australia).");
      return;
    }

    if (user.password && user.password !== user.password_confirmation) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const payload = Object.fromEntries(
        Object.entries(user).filter(([_, v]) => v !== undefined && v !== null),
      );

      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const data = await res.json();
        setValidationErrors(data.errors || {});
        throw new Error("Validation failed.");
      }

      if (!res.ok) throw new Error(`Failed to update user (${res.status})`);

      router.push("/employees");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete user");

      router.push("/employees");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return {
    user,
    loading,
    saving,
    error,
    validationErrors,
    handleChange,
    handleSave,
    handleDelete,
  };
}
