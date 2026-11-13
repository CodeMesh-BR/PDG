import { useMemo, useState } from "react";
import ClientList from "../../clients/components/ClientList/ClientList";
import type { ClientListItem } from "../../clients/useClients";
import { SearchBox } from "./SearchBox";

interface Props {
  /** Plural label shown in the counters, e.g. "clients". */
  label: string;
  users: ClientListItem[];
  total: number;
  loading: boolean;
  error: string;
  refresh: () => void;
}

/** List of company-scoped users (clients or admin checkpoints). */
export default function CompanyUsersSection({
  label,
  users,
  total,
  loading,
  error,
  refresh,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((c) => {
      const name = (c.display_name || c.full_name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  if (error) return <p className="mb-4 text-red-500">{error}</p>;
  if (loading) return <p>Loading...</p>;
  if (users.length === 0)
    return <p className="italic text-gray-400">No {label} registered yet.</p>;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-gray-500">
            {total} total {label}
          </p>
          {search.trim() !== "" && (
            <p className="text-sm text-gray-400">
              Showing {filtered.length} result(s)
            </p>
          )}
        </div>

        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
        />
      </div>

      <ClientList clients={filtered} onRefresh={refresh} />
    </>
  );
}
