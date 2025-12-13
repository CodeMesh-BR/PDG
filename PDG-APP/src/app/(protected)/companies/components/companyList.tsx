"use client";

import { Company } from "../useCompanies";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

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

  return (
    <div className="space-y-4">
      {companies.map((c) => (
        <div
          key={c.id}
          className="rounded-lg border bg-gray-50 p-4 shadow-sm dark:bg-gray-900"
        >
          {/* INFO DA EMPRESA */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {c.display_name || c.name}
            </h3>

            <p className="text-sm text-gray-600 dark:text-white">{c.email}</p>
            <p className="text-sm text-gray-600 dark:text-white">{c.phone}</p>
            <p className="text-sm text-gray-400 dark:text-white">{c.address}</p>
          </div>

          {/* SERVIÇOS */}
          {c.services && c.services.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {c.services.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1 text-xs text-white"
                >
                  {s.type}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs italic text-gray-400">
              No services linked
            </p>
          )}

          {/* BOTÕES ABAIXO */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push(`/companies/${c.id}/edit`)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md"
              title="Edit"
            >
              <Pencil size={18} strokeWidth={2} />
            </button>

            <button
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md disabled:opacity-50"
              title="Delete"
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
