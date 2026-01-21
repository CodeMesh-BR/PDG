"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useRouter } from "next/navigation";
import { useEditServiceCatalog } from "./useEditServicesCatalog";
import { FormAlert } from "@/components/FormAlerts/FormAlert";

export default function EditServiceCatalogPage({ id }: { id: number }) {
  const { service, loading, saving, error, saveService } =
    useEditServiceCatalog(id);

  const router = useRouter();

  const [form, setForm] = useState({
    type: "",
    description: "",
    value: "",
    cost_value: "",
  });

  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (service) {
      setForm({
        type: service.type,
        description: service.description,
        value: service.value,
        cost_value: service.cost_value ?? "",
      });
    }
  }, [service]);

  const validate = () => {
    if (form.type.trim().length < 2) {
      return "Type must be at least 2 characters.";
    }
    if (form.description.trim().length < 3) {
      return "Description must be at least 3 characters.";
    }

    const numericValue = Number(form.value);
    if (!numericValue || numericValue <= 0) {
      return "Value must be a number greater than zero.";
    }

    const numericCostValue = Number(form.cost_value);
    if (!numericCostValue || numericCostValue <= 0) {
      return "Cost value must be a number greater than zero.";
    }

    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const ok = await saveService(form);

    if (ok) {
      router.push("/services-catalog");
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

      {localError && <FormAlert type="error" message={localError} />}
      {success && <FormAlert type="success" message={success} />}

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900"
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
          type="number"
          step="0.01"
          placeholder="Value"
          value={form.value}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        />

        <input
          name="cost_value"
          type="number"
          step="0.01"
          placeholder="Cost Value"
          value={form.cost_value}
          onChange={handleChange}
          className="w-full rounded border p-2"
          required
        />

        <Button
          label={saving ? "Saving…" : "Save Changes"}
          type="submit"
          disabled={saving}
        />
      </form>
    </div>
  );
}
