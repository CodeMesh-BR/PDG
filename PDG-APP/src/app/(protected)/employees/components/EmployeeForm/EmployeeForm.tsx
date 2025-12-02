"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";

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

  const [availability, setAvailability] = useState<string[]>([]);
  const [contractPdf, setContractPdf] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const auPhoneRegex =
    /^(0[23478]\d{8}|04\d{8}|\+612\d{8}|\+613\d{8}|\+617\d{8}|\+618\d{8}|\+614\d{8})$/;

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;

  const weekDays = [
    { key: "mon", label: "Monday" },
    { key: "tue", label: "Tuesday" },
    { key: "wed", label: "Wednesday" },
    { key: "thu", label: "Thursday" },
    { key: "fri", label: "Friday" },
    { key: "sat", label: "Saturday" },
    { key: "sun", label: "Sunday" },
  ];

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
    if (e.target.files?.[0]) {
      setContractPdf(e.target.files[0]);
    }
  };

  const validateForm = () => {
    if (!form.display_name.trim()) return "Display name is required.";
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim() || !emailRegex.test(form.email))
      return "Please enter a valid email address.";
    if (!form.role) return "Role is required.";

    if (!passwordRegex.test(form.password)) {
      return "Password must be 8–16 characters and include letters and numbers.";
    }

    if (form.phone.trim()) {
      const normalizedPhone = form.phone.replace(/[^0-9+]/g, "");

      if (!auPhoneRegex.test(normalizedPhone)) {
        return "Invalid Australian phone format. Example: 0412 345 678 or +61 412 345 678.";
      }
    }

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
        availability,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to create employee.");

      const createdUserId = data.data.id;

      if (contractPdf) {
        const fd = new FormData();
        fd.append("_method", "PATCH");
        fd.append("contract_pdf", contractPdf);

        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${createdUserId}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          },
        );

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok)
          throw new Error(uploadData.message || "Failed to upload contract.");
      }

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
      <h2 className="text-lg font-semibold">Add New Employee</h2>

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

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded border bg-white p-2 dark:border-white dark:bg-[#3b3a3a] dark:text-white"
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
          className="col-span-2 w-full rounded border p-2 dark:text-white dark:placeholder:text-white md:w-[calc(50%-8px)]"
        />
      </div>

      {/* AVAILABILITY */}
      <div className="mt-4">
        <label className="mb-2 block font-semibold">Weekly Availability</label>
        <div className="grid grid-cols-2 gap-2 dark:text-white md:grid-cols-3">
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

      {/* CONTRACT */}
      <div className="mt-4">
        <div className="w-full">
          <label className="mb-2 block font-semibold">Contract (PDF)</label>

          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="text-lg font-semibold">Drop file here</p>

            <p className="my-2 text-sm text-gray-500">Or</p>

            <label className="cursor-pointer">
              <span className="inline-block rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Browse
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleContractUpload}
                className="hidden"
              />
            </label>

            {contractPdf && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-200">
                Selected file:{" "}
                <span className="font-medium">{contractPdf.name}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        label={loading ? "Saving..." : "Save Employee"}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
