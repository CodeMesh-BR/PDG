"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useEditCompany } from "./useEditCompany";
import { useRouter } from "next/navigation";

export default function EditCompanyPage({ id }: { id: number }) {
  const { company, loading, saving, error, services, saveCompany } =
    useEditCompany(id);
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        display_name: company.display_name || "",
        email: company.email,
        address: company.address || "",
        phone: company.phone || "",
      });

      setSelectedServices(company.services?.map((s) => s.id) || []);
    }
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddService = (id: number) => {
    if (!selectedServices.includes(id)) {
      setSelectedServices((prev) => [...prev, id]);
    }
  };

  const handleRemoveService = (id: number) => {
    setSelectedServices((prev) => prev.filter((x) => x !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");

    const ok = await saveCompany({
      ...form,
      service_ids: selectedServices,
    });

    if (ok) {
      setSuccess("Company updated successfully!");
      router.push("/companies");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-lg text-gray-500">Loading...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-500">{error}</p>
      </div>
    );

  if (!company) return null;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit Company</h1>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg bg-white p-6 shadow-md"
      >
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

        {/* TAG SELECT */}
        <div className="mt-4">
          <label className="mb-1 block font-medium">Services</label>

          <select
            onChange={(e) => handleAddService(Number(e.target.value))}
            className="w-full rounded border p-2"
          >
            <option value="">Select a service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type} — {s.description}
              </option>
            ))}
          </select>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedServices.map((id) => {
              const s = services.find((x) => x.id === id);
              if (!s) return null;
              return (
                <span
                  key={id}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-sm text-white"
                >
                  {s.type}
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

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-500">{error}</p>}

        <Button
          label={saving ? "Saving..." : "Save Changes"}
          type="submit"
          disabled={saving}
        />
      </form>
    </div>
  );
}
