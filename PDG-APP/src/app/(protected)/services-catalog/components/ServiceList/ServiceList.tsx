"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Service } from "../../useServicesCatalog";
import * as Icons from "../../../../icons";

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

  return (
    <div className="space-y-4">
      {services.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border bg-gray-50 p-4 shadow-sm dark:bg-gray-900"
        >
          <h3 className="font-semibold dark:text-white">{s.type}</h3>
          <p className="text-sm text-gray-600 dark:text-white">
            {s.description}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-white">
            Value: <strong>${s.value}</strong>
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push(`/services-catalog/${s.id}/edit`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md"
              title="Edit service"
            >
              <Icons.PencilIcon width={20} />
            </button>

            <button
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md"
              title="Delete service"
            >
              <Icons.TrashIcon width={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
