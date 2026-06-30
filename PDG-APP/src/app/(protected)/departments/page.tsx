"use client";

import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { Button } from "@/components/ui-elements/button";
import { Department, getBillingModes, useDepartments } from "./useDepartments";

const emptyForm = {
  name: "",
  description: "",
  bill_by_unit: false,
  bill_by_hour: false,
  bill_by_quantity: false,
};

type DepartmentForm = typeof emptyForm;

export default function DepartmentsPage() {
  const { departments, loading, error, refresh } = useDepartments();
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setLocalError("");
    setSuccess("");
  };

  const validate = () => {
    if (form.name.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (!form.bill_by_unit && !form.bill_by_hour && !form.bill_by_quantity) {
      return "Select at least one billing mode.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const url = editing
        ? `${API_BASE_URL}/departments/${editing.id}`
        : `${API_BASE_URL}/departments`;

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to save department");
      }

      setSuccess(editing ? "Department updated successfully." : "Department created successfully.");
      setForm(emptyForm);
      setEditing(null);
      await refresh();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditing(department);
    setSuccess("");
    setLocalError("");
    setForm({
      name: department.name,
      description: department.description || "",
      bill_by_unit: department.bill_by_unit,
      bill_by_hour: department.bill_by_hour,
      bill_by_quantity: department.bill_by_quantity,
    });
  };

  const handleDelete = async (department: Department) => {
    if (!confirm(`Delete department "${department.name}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${API_BASE_URL}/departments/${department.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete department");
      }

      await refresh();
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Departments</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg bg-white p-6 shadow-md dark:bg-gray-900"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit Department" : "Add New Department"}
          </h2>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              title="Cancel edit"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {localError && <FormAlert type="error" message={localError} />}
        {success && <FormAlert type="success" message={success} />}

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border p-2 dark:text-white"
            required
          />

          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border p-2 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.bill_by_unit}
              onChange={(e) => setForm({ ...form, bill_by_unit: e.target.checked })}
            />
            Unit
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.bill_by_hour}
              onChange={(e) => setForm({ ...form, bill_by_hour: e.target.checked })}
            />
            Hour
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.bill_by_quantity}
              onChange={(e) => setForm({ ...form, bill_by_quantity: e.target.checked })}
            />
            Quantity
          </label>
        </div>

        <Button
          label={saving ? "Saving..." : editing ? "Save Changes" : "Save Department"}
          type="submit"
          disabled={saving}
        />
      </form>

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : departments.length === 0 ? (
          <p className="italic text-gray-400">No departments registered yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Name</th>
                    <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Description</th>
                    <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Billing</th>
                    <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {departments.map((department) => (
                    <tr
                      key={department.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-2 py-2 font-medium text-gray-900 dark:text-white sm:px-4 sm:py-3">
                        {department.name}
                      </td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                        {department.description || "-"}
                      </td>
                      <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                        {getBillingModes(department)}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(department)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                            title="Edit department"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(department)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                            title="Delete department"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
