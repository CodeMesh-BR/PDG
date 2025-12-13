"use client";

import { useCompanies } from "./useCompanies";
import CompanyList from "./components/companyList";
import CompanyForm from "./components/companyForms";

export default function CompaniesPage() {
  const { companies, total, loading, error, refresh } = useCompanies();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Companies</h1>

      {/* Formulário de cadastro */}
      <CompanyForm onSuccess={refresh} />

      {/* Lista */}
      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : companies.length === 0 ? (
          <p className="italic text-gray-400">No companies registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-500">{total} total companies</p>
            </div>
            <CompanyList companies={companies} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
