"use client";

import { useMemo, useState } from "react";
import ServiceList from "./components/ServiceList/ServiceList";
import { useServicesCatalog } from "./useServicesCatalog";
import ServiceCatalogForm from "./components/SerivceForm/ServiceForm";

export default function ServicesCatalogPage() {
  const { services, total, loading, error, refresh } = useServicesCatalog();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;

    return services.filter((s) => {
      const type = (s.type || "").toLowerCase();
      const desc = (s.description || "").toLowerCase();
      return type.includes(q) || desc.includes(q);
    });
  }, [services, search]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Services</h1>

      <ServiceCatalogForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : services.length === 0 ? (
          <p className="italic text-gray-400">No services registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500">{total} total services</p>
                {search.trim() !== "" && (
                  <p className="text-sm text-gray-400">
                    Showing {filtered.length} result(s)
                  </p>
                )}
              </div>

              <div className="flex w-full gap-2 sm:w-[420px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by type or description..."
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                {search.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <ServiceList services={filtered} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
