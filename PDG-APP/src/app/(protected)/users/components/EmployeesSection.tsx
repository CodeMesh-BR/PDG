import { useMemo, useState } from "react";
import { LayoutGrid, Table } from "lucide-react";
import EmployeeList from "../../employees/components/EmployeeList/EmployeeList";
import type { EmployeeListItem } from "../../employees/useEmployees";
import { SearchBox } from "./SearchBox";

interface Props {
  users: EmployeeListItem[];
  total: number;
  loading: boolean;
  error: string;
  refresh: () => void;
}

export default function EmployeesSection({
  users,
  total,
  loading,
  error,
  refresh,
}: Props) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("table");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.display_name || u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, search]);

  if (error) return <p className="mb-4 text-red-500">{error}</p>;
  if (loading) return <p>Loading...</p>;
  if (users.length === 0)
    return <p className="italic text-gray-400">No employees registered yet.</p>;

  const toggleClass = (active: boolean) =>
    `flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
      active
        ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
    }`;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-gray-500">{total} total employees</p>
          {search.trim() !== "" && (
            <p className="text-sm text-gray-400">
              Showing {filtered.length} result(s)
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email or role..."
          />

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
              className={toggleClass(view === "cards")}
            >
              <LayoutGrid size={16} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              className={toggleClass(view === "table")}
            >
              <Table size={16} />
              Table
            </button>
          </div>
        </div>
      </div>

      <EmployeeList users={filtered} onRefresh={refresh} view={view} />
    </>
  );
}
