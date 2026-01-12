"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Service } from "../../useServicesCatalog";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  services: Service[];
  onRefresh: () => void;
}

export default function ServiceCatalogList({ services, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/services/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete service");
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        No results.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-gray-900 dark:text-white">
                  {s.type}
                </div>
                <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {s.description}
                </div>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  Value: <strong>${s.value}</strong>
                </div>

                {s.companies && s.companies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.companies.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                        title={c.display_name || c.name}
                      >
                        {c.display_name || c.name}
                      </span>
                    ))}
                    {s.companies.length > 4 && (
                      <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        +{s.companies.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => router.push(`/services-catalog/${s.id}/edit`)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                  title="Edit service"
                >
                  <Pencil size={18} strokeWidth={2} />
                </button>

                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                  title="Delete service"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Companies</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {s.type}
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    <span className="line-clamp-2">{s.description}</span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                    ${s.value}
                  </td>

                  <td className="px-4 py-3">
                    {s.companies && s.companies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {s.companies.slice(0, 3).map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                            title={c.display_name || c.name}
                          >
                            {c.display_name || c.name}
                          </span>
                        ))}
                        {s.companies.length > 3 && (
                          <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                            +{s.companies.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-gray-400 dark:text-gray-400">
                        -
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          router.push(`/services-catalog/${s.id}/edit`)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                        title="Edit service"
                      >
                        <Pencil size={18} strokeWidth={2} />
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={deletingId === s.id}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                        title="Delete service"
                      >
                        <Trash2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
