"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useRouter } from "next/navigation";
import { useEditService } from "./useEditServices";

export default function EditServicePage({ id }: { id: number }) {
  const { service, loading, saving, error, saveService } = useEditService(id);

  const router = useRouter();

  const [form, setForm] = useState({
    type: "",
    description: "",
    value: "",
  });

  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (service) {
      setForm({
        type: service.type,
        description: service.description,
        value: service.value,
      });
    }
  }, [service]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");

    const ok = await saveService(form);

    if (ok) {
      router.push("/services");
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-lg text-gray-500">Loading…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-500">{error}</p>
      </div>
    );

  if (!service) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit Service</h1>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg bg-white p-6 shadow-md"
      >
        <input
          name="type"
          placeholder="Type"
          value={form.type}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="h-28 w-full rounded border p-2"
          required
        />

        <input
          name="value"
          placeholder="Value"
          value={form.value}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        />

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <Button
          label={saving ? "Saving…" : "Save Changes"}
          type="submit"
          disabled={saving}
        />
      </form>
    </div>
  );
}
