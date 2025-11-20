"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui-elements/button";

interface Company {
  id: number;
  name: string;
  display_name?: string;
}

interface Props {
  onSuccess?: () => void;
}

export default function ServiceForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    value: "",
    company_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");
      const res = await fetch("http://localhost:8080/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("http://localhost:8080/api/services", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create service");

      setForm({ type: "", description: "", value: "", company_id: "" });
      setSuccess("Service created successfully!");
      if (typeof onSuccess === "function") onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-6 shadow-md"
    >
      <h2 className="text-lg font-semibold">Add New Service</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          name="type"
          placeholder="Type *"
          value={form.type}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />
        <input
          name="value"
          type="number"
          step="0.01"
          placeholder="Value *"
          value={form.value}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />
        <textarea
          name="description"
          placeholder="Description *"
          value={form.description}
          onChange={handleChange}
          className="col-span-2 rounded border p-2"
          rows={3}
          required
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button
        label={loading ? "Saving..." : "Save Service"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
