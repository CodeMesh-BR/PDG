"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useServicesCatalog } from "../../services-catalog/useServicesCatalog";
import { FormAlert } from "@/components/FormAlerts/FormAlert";

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
  const { services } = useServicesCatalog();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const auPhoneRegex =
    /^(0[23478]\d{8}|04\d{8}|\+612\d{8}|\+613\d{8}|\+617\d{8}|\+618\d{8}|\+614\d{8})$/;

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Name must have at least 2 characters.";
    }

    if (!emailRegex.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    const rawPhone = form.phone.trim();

    if (rawPhone) {
      const normalized = rawPhone
        .replace(/[^\d+]/g, "")
        .replace(/\p{Separator}/gu, "");

      console.log("NORM:", normalized);
      console.log("LEN:", normalized.length);
      if (!auPhoneRegex.test(normalized)) {
        return "Invalid Australian phone format. Example: 0412 345 678 or +61 2 9876 5432.";
      }
    }
    console.log("RAW:", rawPhone);

    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (error) setError("");
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

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const existingRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      const existing = await existingRes.json();
      const lowerEmail = form.email.toLowerCase();

      if (
        existing.data?.some((c: any) => c.email?.toLowerCase() === lowerEmail)
      ) {
        setError("This email is already registered.");
        return;
      }

      if (
        form.display_name &&
        existing.data?.some(
          (c: any) =>
            c.display_name?.toLowerCase() === form.display_name.toLowerCase(),
        )
      ) {
        setError("This display name already exists.");
        return;
      }

      if (
        form.address &&
        existing.data?.some(
          (c: any) => c.address?.toLowerCase() === form.address.toLowerCase(),
        )
      ) {
        setError("This address already exists.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`, {
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
      className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900"
    >
      <h2 className="text-lg font-semibold">Add New Company</h2>

      {/* ALERTAS */}
      {error && <FormAlert type="error" message={error} />}
      {success && <FormAlert type="success" message={success} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          name="name"
          placeholder="Name *"
          value={form.name}
          onChange={handleChange}
          className="rounded border p-2 dark:text-white"
          required
        />
        <input
          name="display_name"
          placeholder="Display name"
          value={form.display_name}
          onChange={handleChange}
          className="rounded border p-2 dark:text-white"
        />
        <input
          name="email"
          placeholder="Email *"
          value={form.email}
          onChange={handleChange}
          className="rounded border p-2 dark:text-white"
          required
        />
        <input
          name="phone"
          placeholder="Phone (AU)"
          value={form.phone}
          onChange={handleChange}
          className="rounded border p-2 dark:text-white"
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="col-span-2 rounded border p-2 dark:text-white"
        />
      </div>

      {/* Services multi-select */}
      <div>
        <label className="mb-1 block font-medium">Services</label>

        <select
          onChange={(e) => handleAddService(Number(e.target.value))}
          className="w-full rounded border p-2 dark:text-white"
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

      <Button label={loading ? "Saving..." : "Save Company"} type="submit" />
    </form>
  );
}
