"use client";

import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClientListItem } from "../../useClients";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  clients: ClientListItem[];
  onRefresh: () => void;
}

export default function ClientList({ clients, onRefresh }: Props) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.status !== 204 && !res.ok)
        throw new Error("Failed to delete client");

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/clients/${id}/edit`);
  };

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        No results.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Client</th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Email</th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">Phone</th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Allowed Companies
              </th>
              <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-2 py-2 sm:px-4 sm:py-3">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {c.display_name || c.full_name}
                  </div>
                </td>

                <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                  {c.email}
                </td>

                <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                  {c.phone || "-"}
                </td>

                <td className="px-2 py-2 sm:px-4 sm:py-3">
                  {c.companies?.length ? (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {c.companies.map((co) => (
                        <span
                          key={co.id}
                          className="rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-200 sm:px-2.5 sm:py-1 sm:text-xs"
                        >
                          {co.display_name || co.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-gray-400 dark:text-gray-400 sm:text-xs">
                      No companies assigned.
                    </span>
                  )}
                </td>

                <td className="px-2 py-2 sm:px-4 sm:py-3">
                  <div className="flex justify-end gap-2 sm:gap-3">
                    <button
                      onClick={() => handleEdit(c.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white sm:h-10 sm:w-10"
                      title="Edit"
                    >
                      <Pencil size={16} strokeWidth={2} className="sm:hidden" />
                      <Pencil size={18} strokeWidth={2} className="hidden sm:block" />
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white sm:h-10 sm:w-10"
                      title="Delete"
                    >
                      <Trash2 size={16} strokeWidth={2} className="sm:hidden" />
                      <Trash2 size={18} strokeWidth={2} className="hidden sm:block" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
