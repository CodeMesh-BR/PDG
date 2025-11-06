'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-elements/button';
import { useEmployees } from './useEmployees';
import EmployeeForm from './components/EmployeeForm/EmployeeForm';
import EmployeeList from './components/EmployeeList/EmployeeList';

export default function EmployeesPage() {
  const { users, total, loading, error, refresh } = useEmployees();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Employees</h1>

      <EmployeeForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading || refreshing ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400 italic">No employees registered yet.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500">{total} total employees</p>
              <Button label="Refresh" onClick={handleRefresh} />
            </div>
            <EmployeeList users={users} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
