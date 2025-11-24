'use client';

import { useEffect, useState } from 'react';
import { Service } from '../../useServicesCatalog';

export function useEditServiceCatalog(id: number) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchService = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to load service');

      const data = await res.json();
      setService(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveService = async (updates: any) => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update service');
      }

      await fetchService();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  return { service, loading, saving, error, saveService };
}
