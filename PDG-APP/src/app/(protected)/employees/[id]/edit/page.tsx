"use client";

import { Button } from "@/components/ui-elements/button";
import { useEditEmployee } from "./useEditEmployee";

export default function EditEmployeePage() {
  const {
    user,
    loading,
    saving,
    error,
    handleChange,
    handleSave,
    handleDelete,
  } = useEditEmployee();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-gray-500">Loading employee...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-500">{error}</p>
      </div>
    );

  if (!user) return null;

  return (
    <div className="flex items-center justify-center p-6 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 transition-all duration-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Edit Employee
          </h1>
        </div>

        <div className="space-y-5">
          <FormField
            label="Display Name"
            value={user.display_name}
            onChange={(v) => handleChange("display_name", v)}
            placeholder="Display Name"
          />

          <FormField
            label="Full Name"
            value={user.full_name}
            onChange={(v) => handleChange("full_name", v)}
            placeholder="Full Name"
          />

          <FormField
            type="email"
            label="Email"
            value={user.email}
            onChange={(v) => handleChange("email", v)}
            placeholder="Email address"
          />

          <FormField
            label="Phone (Australia)"
            value={user.phone || ""}
            onChange={(v) => handleChange("phone", v)}
            placeholder="+61 4XX XXX XXX"
          />

          <FormField
            label="Address"
            value={user.address || ""}
            onChange={(v) => handleChange("address", v)}
            placeholder="123 George St, Sydney NSW 2000"
          />

          <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-100">
              Change Password
            </h2>

            <FormField
              type="password"
              label="New Password"
              onChange={(v) => handleChange("password", v)}
              placeholder="Enter new password"
            />
            <FormField
              type="password"
              label="Confirm Password"
              onChange={(v) => handleChange("password_confirmation", v)}
              placeholder="Confirm new password"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Role
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              value={user.role}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="client">Client</option>
              <option value="supervisor">Supervisor</option>
              <option value="detailer">Detailer</option>
            </select>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              label={saving ? "Saving..." : "Save Changes"}
              onClick={handleSave}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-indigo-700 hover:shadow-lg"
            />
            <Button
              label="Delete"
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-500 py-2.5 text-white shadow-md transition-all duration-200 hover:bg-red-600 hover:shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable field component */
function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      />
    </div>
  );
}
