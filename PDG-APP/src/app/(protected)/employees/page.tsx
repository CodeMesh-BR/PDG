"use client";

import { useEmployees } from "./useEmployees";
import EmployeeForm from "./components/EmployeeForm/EmployeeForm";
import EmployeeList from "./components/EmployeeList/EmployeeList";

export default function EmployeesPage() {
  const { users, total, loading, error, refresh } = useEmployees();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Employees</h1>

      <EmployeeForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="italic text-gray-400">No employees registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-500">{total} total employees</p>
            </div>
            <EmployeeList users={users} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
