import EmployeeForm from "./components/EmployeeForm/EmployeeForm";
import { useEmployees } from "./useEmployees";
import EmployeesSection from "../users/components/EmployeesSection";

export default function EmployeesPage() {
  const { users, total, loading, error, refresh } = useEmployees();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Employees</h1>

      <EmployeeForm onSuccess={refresh} />

      <div className="mt-10">
        <EmployeesSection
          users={users}
          total={total}
          loading={loading}
          error={error}
          refresh={refresh}
        />
      </div>
    </div>
  );
}
