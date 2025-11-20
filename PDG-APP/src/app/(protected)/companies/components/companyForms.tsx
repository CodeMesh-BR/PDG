"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useServices } from "../../services/useService";

interface Props {
  onSuccess: () => void;
}

export default function CompanyForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  const { services, loading: loadingServices } = useServices();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddService = (id: number) => {
    if (!selectedServices.includes(id)) {
      setSelectedServices((prev) => [...prev, id]);
    }
  };

  const handleRemoveService = (id: number) => {
    setSelectedServices((prev) => prev.filter((s) => s !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("http://localhost:8080/api/companies", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...form,
          service_ids: selectedServices,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create company");
      }

      setForm({
        name: "",
        display_name: "",
        email: "",
        address: "",
        phone: "",
      });
      setSelectedServices([]);

      setSuccess("Company created successfully!");
      onSuccess();
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
      <h2 className="text-lg font-semibold">Add New Company</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          name="name"
          placeholder="Name *"
          value={form.name}
          onChange={handleChange}
          className="rounded border p-2"
          required
        />
        <input
          name="display_name"
          placeholder="Display name"
          value={form.display_name}
          onChange={handleChange}
          className="rounded border p-2"
        />
        <input
          name="email"
          placeholder="Email *"
          type="email"
          value={form.email}
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

      {/* ------------------------------- */}
      {/*  MULTI SELECT INSPIRADO EM TAGS */}
      {/* ------------------------------- */}

      <div>
        <label className="mb-1 block font-medium">Services</label>

        <div className="relative">
          <select
            onChange={(e) => handleAddService(Number(e.target.value))}
            className="w-full rounded border p-2"
            disabled={loadingServices}
          >
            <option value="">Select a service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type} — {s.description}
              </option>
            ))}
          </select>
        </div>

        {/* TAGS */}
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedServices.map((id) => {
            const service = services.find((s) => s.id === id);
            if (!service) return null;
            return (
              <span
                key={id}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-sm text-white"
              >
                {service.type}
                <button
                  type="button"
                  onClick={() => handleRemoveService(id)}
                  className="text-white hover:text-gray-200"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button
        label={loading ? "Saving..." : "Save Company"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
