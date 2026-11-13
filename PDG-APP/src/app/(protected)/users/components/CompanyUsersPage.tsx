import ClientForm from "../../clients/components/ClientForm/ClientForm";
import { useClients } from "../../clients/useClients";
import { ROLE_LABELS, type CompanyScopedUserRole } from "@/lib/permissions";
import CompanyUsersSection from "./CompanyUsersSection";

interface Props {
  role: CompanyScopedUserRole;
  /** Plural label shown in counters, e.g. "clients". */
  plural: string;
}

/** Registration form + list for a company-scoped user type. */
export default function CompanyUsersPage({ role, plural }: Props) {
  const { clients, total, loading, error, refresh } = useClients(role);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">{ROLE_LABELS[role]}</h1>

      <ClientForm role={role} onSuccess={refresh} />

      <div className="mt-10">
        <CompanyUsersSection
          label={plural}
          users={clients}
          total={total}
          loading={loading}
          error={error}
          refresh={refresh}
        />
      </div>
    </div>
  );
}
