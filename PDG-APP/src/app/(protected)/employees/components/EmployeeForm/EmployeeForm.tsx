"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";

interface Props {
  onSuccess?: () => void;
}

export default function EmployeeForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

      const res = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create employee");

      setForm({
        full_name: "",
        address: "",
        phone: "",
        email: "",
        password: "",
        role: "",
      });
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
          name="full_name"
          placeholder="Full name *"
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
