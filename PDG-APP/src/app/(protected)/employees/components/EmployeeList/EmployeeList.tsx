"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EmployeeListItem } from "../../useEmployees";
import { Pencil, Trash2, FileText } from "lucide-react";

interface Props {
  users: EmployeeListItem[];
  onRefresh: () => void;
  view: "cards" | "table";
}

export default function EmployeeList({ users, onRefresh, view }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const dayLabels: Record<string, string> = {
    mon: "MON",
    tue: "TUE",
    wed: "WED",
    thu: "THU",
    fri: "FRI",
    sat: "SAT",
    sun: "SUN",
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (res.status !== 204 && !res.ok)
        throw new Error("Failed to delete employee");

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/employees/${id}/edit`);
  };

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        No results.
      </div>
    );
  }

  return (
    <>
      {view === "cards" ? (
        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {u.display_name || u.full_name}
                  </div>
                  <div className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                    {u.email}
                  </div>
                  <div className="mt-1 text-sm capitalize text-gray-600 dark:text-gray-300">
                    {u.role}
                  </div>

                  {u.contract_pdf_path && (
                    <a
                      href={u.contract_pdf_path}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-blue-600 underline dark:text-blue-300"
                    >
                      <FileText size={16} />
                      View Contract
                    </a>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleEdit(u.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white"
                    title="Edit"
                  >
                    <Pencil size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white"
                    title="Delete"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Availability:
                </div>

                {u.availability?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {u.availability.map((day) => (
                      <span
                        key={day}
                        className="rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        {dayLabels[day] || day.toUpperCase()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm italic text-gray-400 dark:text-gray-400">
                    No availability set.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                    Employee
                  </th>
                  <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                    Email
                  </th>
                  <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                    Role
                  </th>
                  <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                    Availability
                  </th>
                  <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                    Contract
                  </th>
                  <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {u.display_name || u.full_name}
                      </div>
                    </td>

                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                      {u.email}
                    </td>

                    <td className="px-2 py-2 capitalize text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                      {u.role}
                    </td>

                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      {u.availability?.length ? (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {u.availability.slice(0, 5).map((day) => (
                            <span
                              key={day}
                              className="rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200 sm:px-2.5 sm:py-1 sm:text-xs"
                            >
                              {dayLabels[day] || day.toUpperCase()}
                            </span>
                          ))}
                          {u.availability.length > 5 && (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] text-gray-700 dark:bg-gray-700 dark:text-gray-200 sm:px-2.5 sm:py-1 sm:text-xs">
                              +{u.availability.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-gray-400 dark:text-gray-400 sm:text-xs">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-2 text-center sm:px-4 sm:py-3">
                      {u.contract_pdf_path ? (
                        <a
                          href={u.contract_pdf_path}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 underline dark:text-blue-300"
                        >
                          <FileText size={14} className="sm:hidden" />
                          <FileText size={16} className="hidden sm:block" />
                        </a>
                      ) : (
                        <span className="text-[10px] italic text-gray-400 dark:text-gray-400 sm:text-xs">
                          -
                        </span>
                      )}
                    </td>

                    <td className="px-2 py-2 sm:px-4 sm:py-3">
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <button
                          onClick={() => handleEdit(u.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white sm:h-10 sm:w-10"
                          title="Edit"
                        >
                          <Pencil size={16} strokeWidth={2} className="sm:hidden" />
                          <Pencil size={18} strokeWidth={2} className="hidden sm:block" />
                        </button>

                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
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
      )}
    </>
  );
}
