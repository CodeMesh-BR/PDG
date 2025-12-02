"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";

interface Props {
  onSuccess?: () => void;
}

export default function ServiceCatalogForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    value: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

    return null;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
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

      setForm({ type: "", description: "", value: "" });
      setSuccess("Service created successfully!");

      if (onSuccess) onSuccess();
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
      <h2 className="text-lg font-semibold">Add New Service</h2>

      {error && <FormAlert type="error" message={error} />}
      {success && <FormAlert type="success" message={success} />}

      <div className="flex flex-wrap gap-4">
        <input
          name="type"
          placeholder="Type *"
          value={form.type}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white md:w-[calc(50%-8px)]"
          required
        />

        <input
          name="value"
          type="number"
          step="0.01"
          placeholder="Value *"
          value={form.value}
          onChange={handleChange}
          className="w-full rounded border p-2 dark:text-white md:w-[calc(50%-8px)]"
          required
        />

        <textarea
          name="description"
          placeholder="Description *"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="col-span-2 w-full rounded border p-2 dark:text-white"
          required
        />
      </div>

      <Button
        label={loading ? "Saving..." : "Save Service"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
