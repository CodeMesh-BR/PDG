"use client";

import { Company } from "../useCompanies";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";

interface Props {
  companies: Company[];
  onRefresh: () => void;
}

export default function CompanyList({ companies, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/companies/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete company");
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        No results.
      </div>
    );
  }

  const renderServices = (c: Company, limit: number) => {
    const services = c.services ?? [];
    const defaultId = c.default_service_id;

    const defaultService = services.find((s) => s.id === defaultId);

    if (services.length === 0) {
      return (
        <span className="text-xs italic text-gray-400 dark:text-gray-400">
          No services linked
        </span>
      );
    }

    const sorted = [...services].sort((a, b) => {
      const aIsDefault = a.id === defaultId ? 0 : 1;
      const bIsDefault = b.id === defaultId ? 0 : 1;
      return aIsDefault - bIsDefault;
    });

    const visible = sorted.slice(0, limit);
    const remaining = sorted.length - visible.length;

    return (
      <div className="flex flex-wrap gap-2">
        {visible.map((s) => {
          const isDefault = s.id === defaultId;

          return (
            <span
              key={s.id}
              className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-xs text-white"
              title={s.description || s.type}
            >
              <Star
                size={12}
                className={
                  isDefault ? "fill-yellow-400 text-yellow-400" : "text-white"
                }
              />
              {s.type}
            </span>
          );
        })}

        {remaining > 0 && (
          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            +{remaining}
          </span>
        )}

        {!defaultService && defaultId ? (
          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs text-white">
            Default: #{defaultId}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {companies.map((c) => {
          const name = c.display_name || c.name;

          const defaultService = c.services?.find(
            (s) => s.id === c.default_service_id,
          );

          return (
            <div
              key={c.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {name}
                  </div>
                  <div className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                    {c.email}
                  </div>

                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {c.phone || "-"}
                  </div>

                  {c.address && (
                    <div className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {c.address}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => router.push(`/companies/${c.id}/edit`)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                    title="Edit"
                  >
                    <Pencil size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                    title="Delete"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="mt-3">{renderServices(c, 6)}</div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {companies.map((c) => {
                const name = c.display_name || c.name;

                const defaultService = c.services?.find(
                  (s) => s.id === c.default_service_id,
                );

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {name}
                      </div>

                      {c.address && (
                        <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {c.address}
                        </div>
                      )}

                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Default:</span>{" "}
                        {defaultService
                          ? defaultService.type
                          : `#${c.default_service_id}`}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {c.email}
                    </td>

                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {c.phone || "-"}
                    </td>

                    <td className="px-4 py-3">{renderServices(c, 3)}</td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => router.push(`/companies/${c.id}/edit`)}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={18} strokeWidth={2} />
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                          title="Delete"
                        >
                          <Trash2 size={18} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
