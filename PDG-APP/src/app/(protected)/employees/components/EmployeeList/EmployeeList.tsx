"use client";

import { Employee } from "../../useEmployees";
import { Button } from "@/components/ui-elements/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  users: Employee[];
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

      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.status !== 204 && !res.ok) {
        throw new Error("Failed to delete employee");
      }

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
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          {/* HEADER */}
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {u.display_name || u.full_name}
              </h3>
              <p className="text-sm text-gray-500">{u.email}</p>
              <p className="text-sm capitalize text-gray-500">{u.role}</p>
            </div>

            <div className="flex h-fit gap-3">
              <Button
                label="Edit"
                onClick={() => handleEdit(u.id)}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              />
              <Button
                label={deletingId === u.id ? "Deleting..." : "Delete"}
                onClick={() => handleDelete(u.id)}
                disabled={deletingId === u.id}
                className="bg-red-500 text-white hover:bg-red-600"
              />
            </div>
          </div>

          {/* CONTRACT */}
          {u.contract_pdf_path && (
            <a
              href={u.contract_pdf_path}
              target="_blank"
              className="text-sm text-blue-600 underline"
            >
              View Contract
            </a>
          )}

          {/* AVAILABILITY */}
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
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
        </div>
      ))}
    </div>
  );
}
