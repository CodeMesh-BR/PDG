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
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {u.display_name || u.full_name}
            </h3>
            <p className="text-sm text-gray-500">{u.email}</p>
            <p className="text-sm capitalize text-gray-500">{u.role}</p>
          </div>

          <div className="flex gap-3">
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
      ))}
    </div>
  );
}
