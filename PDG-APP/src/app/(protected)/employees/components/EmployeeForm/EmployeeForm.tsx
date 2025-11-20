"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";

interface Props {
  onSuccess?: () => void;
}

export default function EmployeeForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    display_name: "",
    full_name: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    role: "",
  });

  const weekDays = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

  const [availability, setAvailability] = useState<string[]>([]);
  const [contractPdf, setContractPdf] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleContractUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractPdf(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      // --- STEP 1: CREATE (JSON) ---
      const payload = {
        ...form,
        availability,
        service_ids: [], // opcional
      };

      const res = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create employee");

      const createdUserId = data.data.id;

      // --- STEP 2: IF CONTRACT, UPLOAD VIA UPDATE ---
      if (contractPdf) {
        const formData = new FormData();
        formData.append("contract_pdf", contractPdf);

        const updateRes = await fetch(
          `http://localhost:8080/api/users/${createdUserId}`,
          {
            method: "POST", // Laravel aceita POST + _method
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: (() => {
              const fd = new FormData();
              fd.append("_method", "PATCH");
              fd.append("contract_pdf", contractPdf);
              return fd;
            })(),
          },
        );

        const updateData = await updateRes.json();
        if (!updateRes.ok)
          throw new Error(updateData.message || "Failed to upload contract");
      }

      // --- Reset ---
      setForm({
        display_name: "",
        full_name: "",
        address: "",
        phone: "",
        email: "",
        password: "",
        role: "",
      });
      setAvailability([]);
      setContractPdf(null);

      setSuccess("Employee created successfully!");
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
      <h2 className="text-lg font-semibold">Add New Employee</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          name="display_name"
          placeholder="Display Name *"
          value={form.display_name}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />

        <input
          name="full_name"
          placeholder="Full Name *"
          value={form.full_name}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="rounded border bg-white p-2"
          required
        >
          <option value="" disabled>
            Select Role
          </option>
          <option value="admin">Admin</option>
          <option value="client">Client</option>
          <option value="supervisor">Supervisor</option>
          <option value="detailer">Detailer</option>
        </select>

        <input
          name="email"
          type="email"
          placeholder="Email *"
          value={form.email}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password *"
          value={form.password}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="rounded border p-2"
        />

        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="col-span-2 rounded border p-2"
        />

        <div className="col-span-2 mt-4">
          <label className="mb-2 block font-semibold">
            Weekly Availability
          </label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {weekDays.map((d) => (
              <label key={d.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={availability.includes(d.key)}
                  onChange={() => toggleDay(d.key)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-2 mt-4">
          <label className="mb-2 block font-semibold">Contract (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleContractUpload}
            className="rounded border p-2"
          />
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button
        label={loading ? "Saving..." : "Save Employee"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
