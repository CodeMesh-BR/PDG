"use client";

import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { useEditClient } from "./useEditClient";

export default function EditClientPage() {
  const {
    client,
    companies,
    companyIds,
    loading,
    saving,
    error,
    success,
    handleChange,
    toggleCompany,
    handleSave,
  } = useEditClient();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-gray-500">Loading client...</p>
      </div>
    );

  if (!client)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Client not found
      </div>
    );

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit Client</h1>

      {error && <FormAlert type="error" message={error} />}
      {success && <FormAlert type="success" message={success} />}

      <div className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900">
        <LabeledInput
          label="Display Name"
          value={client.display_name}
          onChange={(v) => handleChange("display_name", v)}
        />

        <LabeledInput
          label="Full Name"
          value={client.full_name}
          onChange={(v) => handleChange("full_name", v)}
        />

        <LabeledInput
          label="Email"
          type="email"
          value={client.email}
          onChange={(v) => handleChange("email", v)}
        />

        <LabeledInput
          label="Phone"
          value={client.phone || ""}
          onChange={(v) => handleChange("phone", v)}
          placeholder="+61 4XX XXX XXX"
        />

        <LabeledInput
          label="Address"
          value={client.address || ""}
          onChange={(v) => handleChange("address", v)}
        />

        <div className="mt-3">
          <label className="mb-1 block font-medium">Allowed Companies</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {companies.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={companyIds.includes(c.id)}
                  onChange={() => toggleCompany(c.id)}
                />
                {c.display_name || c.name}
              </label>
            ))}
          </div>
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
