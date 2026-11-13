import { useState } from "react";
import EmployeeForm from "../employees/components/EmployeeForm/EmployeeForm";
import ClientForm from "../clients/components/ClientForm/ClientForm";
import { useEmployees } from "../employees/useEmployees";
import { useClients } from "../clients/useClients";
import EmployeesSection from "./components/EmployeesSection";
import CompanyUsersSection from "./components/CompanyUsersSection";

type UserType = "employee" | "client" | "checkpoint_admin";

const USER_TYPES: { value: UserType; label: string; plural: string }[] = [
  { value: "employee", label: "Employee", plural: "employees" },
  { value: "client", label: "Client", plural: "clients" },
  {
    value: "checkpoint_admin",
    label: "Admin Checkpoint",
    plural: "admin checkpoints",
  },
];

export default function UsersPage() {
  const [formType, setFormType] = useState<UserType>("employee");
  const [tab, setTab] = useState<UserType>("employee");

  const employees = useEmployees();
  const clients = useClients("client");
  const checkpoints = useClients("checkpoint_admin");

  const refreshFor = (type: UserType) => () => {
    if (type === "employee") employees.refresh();
    else if (type === "client") clients.refresh();
    else checkpoints.refresh();
    setTab(type);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Users</h1>

      <div className="mb-4 max-w-sm">
        <label htmlFor="user-type" className="mb-2 block font-semibold">
          User type
        </label>
        <select
          id="user-type"
          value={formType}
          onChange={(e) => setFormType(e.target.value as UserType)}
          className="w-full rounded border bg-white p-2 dark:border-white dark:bg-[#3b3a3a] dark:text-white"
        >
          {USER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {formType === "employee" ? (
        <EmployeeForm onSuccess={refreshFor("employee")} />
      ) : (
        // key resets the form state when switching between company-scoped types
        <ClientForm
          key={formType}
          role={formType}
          onSuccess={refreshFor(formType)}
        />
      )}

      <div className="mt-10">
        <div
          role="tablist"
          aria-label="User types"
          className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700"
        >
          {USER_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              id={`users-tab-${t.value}`}
              aria-selected={tab === t.value}
              aria-controls={`users-panel-${t.value}`}
              onClick={() => setTab(t.value)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`users-panel-${tab}`}
          aria-labelledby={`users-tab-${tab}`}
        >
          {tab === "employee" && (
            <EmployeesSection
              users={employees.users}
              total={employees.total}
              loading={employees.loading}
              error={employees.error}
              refresh={employees.refresh}
            />
          )}
          {tab === "client" && (
            <CompanyUsersSection
              label="clients"
              users={clients.clients}
              total={clients.total}
              loading={clients.loading}
              error={clients.error}
              refresh={clients.refresh}
            />
          )}
          {tab === "checkpoint_admin" && (
            <CompanyUsersSection
              label="admin checkpoints"
              users={checkpoints.clients}
              total={checkpoints.total}
              loading={checkpoints.loading}
              error={checkpoints.error}
              refresh={checkpoints.refresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}
