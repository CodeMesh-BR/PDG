"use client";

import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { useEditEmployee } from "./useEditEmployee";

export default function EditEmployeePage() {
  const {
    user,
    availability,
    weekDays,
    contractPdf,
    loading,
    saving,
    error,
    success,
    handleChange,
    toggleDay,
    handleContractUpload,
    handleSave,
  } = useEditEmployee();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-gray-500">Loading employee...</p>
      </div>
    );

  if (!user)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Employee not found
      </div>
    );

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit Employee</h1>

      {error && <FormAlert type="error" message={error} />}
      {success && <FormAlert type="success" message={success} />}

      <div className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900">
        <LabeledInput
          label="Display Name"
          value={user.display_name}
          onChange={(v) => handleChange("display_name", v)}
        />

        <LabeledInput
          label="Full Name"
          value={user.full_name}
          onChange={(v) => handleChange("full_name", v)}
        />

        <LabeledInput
          label="Email"
          type="email"
          value={user.email}
          onChange={(v) => handleChange("email", v)}
        />

        <LabeledInput
          label="Phone"
          value={user.phone || ""}
          onChange={(v) => handleChange("phone", v)}
          placeholder="+61 4XX XXX XXX"
        />

        <LabeledInput
          label="Address"
          value={user.address || ""}
          onChange={(v) => handleChange("address", v)}
        />

        <div>
          <label className="mb-1 block font-medium">Role</label>
          <select
            value={user.role}
            onChange={(e) => handleChange("role", e.target.value)}
            className="w-full rounded border p-2"
          >
            <option value="admin">Admin</option>
            <option value="client">Client</option>
            <option value="supervisor">Supervisor</option>
            <option value="detailer">Detailer</option>
          </select>
        </div>

        <div className="mt-3">
          <label className="mb-1 block font-medium">Weekly Availability</label>
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

        <div className="mt-4">
          <label className="mb-1 block font-medium">Contract (PDF)</label>

          {user.contract_pdf_path && (
            <a
              href={user.contract_pdf_path}
              target="_blank"
              className="mb-2 block text-sm text-blue-600 underline"
            >
              View current contract
            </a>
          )}

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleContractUpload(e.target.files?.[0] || null)}
            className="w-full rounded border p-2"
          />
        </div>

        <div className="mt-6 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <p className="mb-2 font-medium">Change Password</p>

          <LabeledInput
            type="password"
            label="New Password"
            value={user.password || ""}
            onChange={(v) => handleChange("password", v)}
          />

          <LabeledInput
            type="password"
            label="Confirm Password"
            value={user.password_confirmation || ""}
            onChange={(v) => handleChange("password_confirmation", v)}
          />
        </div>

        <div className="pt-3">
          <Button
            label={saving ? "Saving..." : "Save Changes"}
            onClick={handleSave}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border p-2"
      />
    </div>
  );
}
