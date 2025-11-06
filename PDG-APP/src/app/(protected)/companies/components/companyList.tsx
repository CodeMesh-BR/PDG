'use client';

import { Company } from '../useCompanies';
import { Button } from '@/components/ui-elements/button';
import { useState } from 'react';

interface Props {
  companies: Company[];
  onRefresh: () => void;
}

export default function CompanyList({ companies, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`http://localhost:8080/api/companies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok && res.status !== 204) throw new Error('Failed to delete company');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {companies.map((c) => (
        <div
          key={c.id}
          className="border rounded-lg p-4 shadow-sm bg-gray-50 flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">{c.display_name || c.name}</h3>
            <p className="text-sm text-gray-500">{c.email}</p>
            <p className="text-sm text-gray-500">{c.phone}</p>
            <p className="text-sm text-gray-400">{c.address}</p>
          </div>

          <div className="flex gap-2">
            {/* <Button
              label="Edit"
              onClick={() => alert('Edit not implemented yet')}
            /> */}
            <Button
              label={deletingId === c.id ? 'Deleting...' : 'Delete'}
              onClick={() => handleDelete(c.id)}
              disabled={deletingId === c.id}
              variant="dark"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
