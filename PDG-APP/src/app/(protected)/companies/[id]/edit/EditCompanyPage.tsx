"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useEditCompany } from "./useEditCompany";
import { useRouter } from "next/navigation";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { Star } from "lucide-react";

export default function EditCompanyPage({ id }: { id: number }) {
  const { company, loading, saving, error, services, saveCompany } =
    useEditCompany(id);

  const [original, setOriginal] = useState({
    display_name: "",
    email: "",
    address: "",
  });

  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    email: "",
    address: "",
    phone: "",
  });

  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [defaultServiceId, setDefaultServiceId] = useState<number | null>(null);

  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const auPhoneRegex =
    /^(0[23478]\d{8}|04\d{8}|\+612\d{8}|\+613\d{8}|\+617\d{8}|\+618\d{8}|\+614\d{8})$/;

  const validateForm = () => {
    if (form.name.trim().length < 2)
      return "Name must have at least 2 characters.";
    if (!emailRegex.test(form.email.trim()))
      return "Please enter a valid email address.";

    if (form.phone.trim()) {
      const normalized = form.phone.replace(/[^0-9+]/g, "");
      if (!auPhoneRegex.test(normalized)) {
        return "Invalid Australian phone format. Example: 0412 345 678 or +61 2 9876 5432.";
      }
    }

    if (!defaultServiceId) return "Please select a default service.";

    if (!selectedServices.includes(defaultServiceId)) {
      return "Default service must be included in Services.";
    }

    return null;
  };

  useEffect(() => {
    if (!company) return;

    setForm({
      name: company.name,
      display_name: company.display_name || "",
      email: company.email,
      address: company.address || "",
      phone: company.phone || "",
    });

    setOriginal({
      display_name: company.display_name || "",
      email: company.email || "",
      address: company.address || "",
    });

    const serviceIds = company.services?.map((s) => s.id) || [];
    setSelectedServices(serviceIds);

    const apiDefault = (company as any).default_service_id as
      | number
      | undefined;
    setDefaultServiceId(
      apiDefault ?? (serviceIds.length ? serviceIds[0] : null),
    );
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleAddService = (serviceId: number) => {
    if (!serviceId) return;

    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) return prev;

      const next = [...prev, serviceId];

      setDefaultServiceId((current) => current ?? serviceId);

      return next;
    });
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices((prev) => {
      const next = prev.filter((x) => x !== serviceId);

      setDefaultServiceId((currentDefault) => {
        if (currentDefault !== serviceId) return currentDefault;
        return next.length ? next[0] : null;
      });

      return next;
    });
  };

  const handleSetDefaultService = (serviceId: number) => {
    if (!selectedServices.includes(serviceId)) return;
    setDefaultServiceId(serviceId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setFormError("");

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError("Unauthorized");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const existing = await res.json();

    if (form.email.toLowerCase() !== original.email.toLowerCase()) {
      const exists = existing.data.some(
        (c: any) =>
          Number(c.id) !== Number(id) &&
          c.email?.toLowerCase() === form.email.toLowerCase(),
      );

      if (exists) {
        setFormError("This email is already registered.");
        return;
      }
    }

    if (
      form.display_name.toLowerCase() !== original.display_name.toLowerCase()
    ) {
      const exists = existing.data.some(
        (c: any) =>
          Number(c.id) !== Number(id) &&
          c.display_name?.toLowerCase() === form.display_name.toLowerCase(),
      );

      if (exists) {
        setFormError("This display name already exists.");
        return;
      }
    }

    if (form.address.toLowerCase() !== original.address.toLowerCase()) {
      const exists = existing.data.some(
        (c: any) =>
          Number(c.id) !== Number(id) &&
          c.address?.toLowerCase() === form.address.toLowerCase(),
      );

      if (exists) {
        setFormError("This address already exists.");
        return;
      }
    }

    const serviceIdsPayload = selectedServices.includes(defaultServiceId!)
      ? selectedServices
      : [...selectedServices, defaultServiceId!];

    const ok = await saveCompany({
      ...form,
      service_ids: serviceIdsPayload,
      default_service_id: defaultServiceId,
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
        className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900"
      >
        {formError && <FormAlert type="error" message={formError} />}
        {success && <FormAlert type="success" message={success} />}

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
            placeholder="Phone (AU)"
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

        <div className="mt-4">
          <label className="mb-1 block font-medium">Services</label>

          <select
            onChange={(e) => handleAddService(Number(e.target.value))}
            className="w-full rounded border p-2"
            value=""
          >
            <option value="">Select a service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.type} — {s.description}
              </option>
            ))}
          </select>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedServices.map((serviceId) => {
              const s = services.find((x) => x.id === serviceId);
              if (!s) return null;

              const isDefault = defaultServiceId === serviceId;

              return (
                <span
                  key={serviceId}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-sm text-white"
                >
                  <button
                    type="button"
                    onClick={() => handleSetDefaultService(serviceId)}
                    title={isDefault ? "Default service" : "Set as default"}
                    className="flex items-center"
                  >
                    <Star
                      size={14}
                      className={
                        isDefault
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-white"
                      }
                    />
                  </button>

                  {s.type}

                  <button
                    type="button"
                    onClick={() => handleRemoveService(serviceId)}
                    className="text-white hover:text-gray-200"
                    title="Remove service"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>

          {!defaultServiceId && (
            <p className="mt-2 text-xs text-gray-500">
              A default service is required.
            </p>
          )}
        </div>

        <Button
          label={saving ? "Saving..." : "Save Changes"}
          type="submit"
          disabled={saving}
        />
      </form>
    </div>
  );
}
