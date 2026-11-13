import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { COMPANY_SCOPED_USER_ROLES } from "@/lib/permissions";

export interface EmployeeListItem {
  id: number;
  display_name: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  availability?: string[];
  companies?: { id: number; name: string; display_name?: string }[];
  contract_pdf_path?: string;
}

export function useEmployees() {
  const [users, setUsers] = useState<EmployeeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
      const data = await res.json();

      // Company-scoped users (clients, checkpoints) are listed in their own tabs.
      const scoped: readonly string[] = COMPANY_SCOPED_USER_ROLES;
      const staff = (data.data || []).filter(
        (u: EmployeeListItem) => !scoped.includes(u.role),
      );
      setUsers(staff);
      setTotal(staff.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, total, loading, error, refresh: fetchUsers };
}
