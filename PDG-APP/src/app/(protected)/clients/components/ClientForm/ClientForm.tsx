"use client";

import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { useCompanies } from "../../../companies/useCompanies";

interface Props {
  onSuccess?: () => void;
}

export default function ClientForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    display_name: "",
    full_name: "",
    address: "",
    phone: "",
    email: "",
    password: "",
  });

  const [companyIds, setCompanyIds] = useState<number[]>([]);

  const { companies } = useCompanies({ perPage: 100 });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const auPhoneRegex =
    /^(0[23478]\d{8}|04\d{8}|\+612\d{8}|\+613\d{8}|\+617\d{8}|\+618\d{8}|\+614\d{8})$/;

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCompany = (id: number) => {
    setCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const validateForm = () => {
    if (!form.display_name.trim()) return "Display name is required.";
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim() || !emailRegex.test(form.email))
      return "Please enter a valid email address.";

    if (!passwordRegex.test(form.password)) {
      return "Password must be 8–16 characters and include letters and numbers.";
    }

    if (form.phone.trim()) {
      const normalizedPhone = form.phone.replace(/[^0-9+]/g, "");

      if (!auPhoneRegex.test(normalizedPhone)) {
        return "Invalid Australian phone format. Example: 0412 345 678 or +61 412 345 678.";
      }
    }

    if (companyIds.length === 0)
      return "Client must be linked to at least one company.";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const payload = {
        ...form,
        role: "client",
        company_ids: companyIds,
      };

      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create client.");

      setForm({
        display_name: "",
        full_name: "",
        address: "",
        phone: "",
        email: "",
        password: "",
      });
      setCompanyIds([]);

      setSuccess("Client created successfully!");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold">Add New Client</h2>

      {error && <FormAlert type="error" message={error} />}
      {success && <FormAlert type="success" message={success} />}

      <div className="flex flex-wrap gap-4">
        <input
          name="display_name"
          placeholder="Display Name *"
          value={form.display_name}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
          required
        />

        <input
          name="full_name"
          placeholder="Full Name *"
          value={form.full_name}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email *"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password *"
          value={form.password}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
          required
        />

        <input
          name="phone"
          placeholder="Phone (AU)"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
        />

        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block font-semibold">Allowed Companies</label>
        <div className="grid grid-cols-2 gap-2 dark:text-white md:grid-cols-3">
          {companies.map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={companyIds.includes(c.id)}
                onChange={() => toggleCompany(c.id)}
              />
              {c.display_name || c.name}
            </label>
          ))}
        </div>
      </div>

      <Button
        label={loading ? "Saving..." : "Save Client"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
