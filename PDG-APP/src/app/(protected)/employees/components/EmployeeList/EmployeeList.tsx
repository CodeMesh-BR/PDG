"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EmployeeListItem } from "../../useEmployees";
import * as Icons from "@/app/icons";

interface Props {
  users: EmployeeListItem[];
  onRefresh: () => void;
}

export default function EmployeeList({ users, onRefresh }: Props) {
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

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:bg-gray-900"
        >
          {/* HEADER */}
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {u.display_name || u.full_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-white">{u.email}</p>
              <p className="text-sm capitalize text-gray-500 dark:text-white">
                {u.role}
              </p>
            </div>
          </div>

          {u.contract_pdf_path && (
            <a
              href={u.contract_pdf_path}
              target="_blank"
              className="text-sm text-blue-600 underline"
            >
              View Contract
            </a>
          )}

          {/* Availability */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Availability:
            </p>

            {u.availability?.length ? (
              <div className="flex flex-wrap gap-2">
                {u.availability.map((day) => (
                  <span
                    key={day}
                    className="rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                  >
                    {dayLabels[day] || day.toUpperCase()}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-gray-400">
                No availability set.
              </p>
            )}
          </div>
          <div className="flex h-fit gap-3">
            <button
              onClick={() => handleEdit(u.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md"
              title="Edit"
            >
              <Icons.PencilIcon width={20} />
            </button>

            <button
              onClick={() => handleDelete(u.id)}
              disabled={deletingId === u.id}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md"
              title="Delete"
            >
              <Icons.TrashIcon width={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
