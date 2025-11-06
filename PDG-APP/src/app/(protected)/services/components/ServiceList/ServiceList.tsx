'use client';

import { Service } from '../../useService';
import { Button } from '@/components/ui-elements/button';
import { useState } from 'react';

interface Props {
  services: Service[];
  onRefresh: () => void;
}

export default function ServiceList({ services, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`http://localhost:8080/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok && res.status !== 204)
        throw new Error('Failed to delete service');

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {services.map((s) => (
        <div
          key={s.id}
          className="border rounded-lg p-4 shadow-sm bg-gray-50 flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">{s.type}</h3>
            <p className="text-sm text-gray-600">{s.description}</p>
            <p className="text-sm text-gray-500 mt-1">
              Value: <strong>${s.value}</strong>
            </p>
          </div>

          <Button
            label={deletingId === s.id ? 'Deleting...' : 'Delete'}
            onClick={() => handleDelete(s.id)}
            disabled={deletingId === s.id}
            variant="primary"
          />
        </div>
      ))}
    </div>
  );
}
