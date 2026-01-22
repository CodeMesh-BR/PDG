import { useEffect, useState } from 'react';

export interface Service {
  id: number;
  type: string;
  description: string;
  value: string;
  cost_value?: string;
  created_at: string;
  companies?: { id: number; name: string; display_name: string }[];
}

export function useServicesCatalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch services: ${res.statusText}`);
      const data = await res.json();

      setServices(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return { services, total, loading, error, refresh: fetchServices };
}
