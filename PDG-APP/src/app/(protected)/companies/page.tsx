"use client";

import { useMemo, useState } from "react";
import { useCompanies } from "./useCompanies";
import CompanyList from "./components/companyList";
import CompanyForm from "./components/companyForms";

export default function CompaniesPage() {
  const { companies, total, loading, error, refresh } = useCompanies();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((c) => {
      const name = (c.display_name || c.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [companies, search]);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Companies</h1>

      <CompanyForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}

        {loading ? (
          <p>Loading...</p>
        ) : companies.length === 0 ? (
          <p className="italic text-gray-400">No companies registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-gray-500">{total} total companies</p>
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
                  placeholder="Search by company name..."
                  className="w-full rounded rounded-md border border-gray-300 p-2 px-3 py-2 text-sm outline-none focus:border-gray-400 dark:text-white"
                />
                {search.trim() !== "" && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <CompanyList companies={filtered} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
