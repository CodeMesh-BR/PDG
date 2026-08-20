import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";

export interface ClientListItem {
  id: number;
  display_name: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  created_at: string;
  companies?: { id: number; name: string; display_name?: string }[];
}

export function useClients() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchClients = async () => {
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

      if (!res.ok) throw new Error(`Failed to fetch clients: ${res.statusText}`);
      const data = await res.json();

      const onlyClients = (data.data || []).filter(
        (u: ClientListItem) => u.role === "client",
      );
      setClients(onlyClients);
      setTotal(onlyClients.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, total, loading, error, refresh: fetchClients };
}
