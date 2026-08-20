"use client";

import { useMemo, useState } from "react";
import { useClients } from "./useClients";
import ClientForm from "./components/ClientForm/ClientForm";
import ClientList from "./components/ClientList/ClientList";

export default function ClientsPage() {
  const { clients, total, loading, error, refresh } = useClients();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter((c) => {
      const name = (c.display_name || c.full_name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [clients, search]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Clients</h1>

      <ClientForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : clients.length === 0 ? (
          <p className="italic text-gray-400">No clients registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-gray-500">{total} total clients</p>
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
                  placeholder="Search by name or email..."
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

            <ClientList clients={filtered} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
