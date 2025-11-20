import { useEffect, useState } from 'react';
import { useServices } from '../services/useService';

export interface Company {
  id: number;
  name: string;
  display_name?: string;
  email: string;
  address?: string;
  phone?: string;
  created_at: string;
  services?: {
    id: number;
    type: string;
    description: string;
    value: string;
  }[];
}

export function useCompanies() {
  const { services, loading: loadingServices } = useServices();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch('http://localhost:8080/api/companies', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch companies: ${res.statusText}`);
      const data = await res.json();

      setCompanies(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServices = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const values = Array.from(e.target.selectedOptions, option => Number(option.value));
  setSelectedServices(values);
};


  useEffect(() => {
    fetchCompanies();
  }, []);

  return { companies, total, loading, error, refresh: fetchCompanies };
}
