'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-elements/button';
import { useCompanies } from './useCompanies';
import CompanyList from './components/companyList';
import CompanyForm from './components/companyForms';

export default function CompaniesPage() {
  const { companies, total, loading, error, refresh } = useCompanies();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Companies</h1>

      {/* Formulário de cadastro */}
      <CompanyForm onSuccess={refresh} />

      {/* Lista */}
      <div className="mt-10">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading || refreshing ? (
          <p>Loading...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-400 italic">No companies registered yet.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500">{total} total companies</p>
              <Button label="Refresh" onClick={handleRefresh} />
            </div>
            <CompanyList companies={companies} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
