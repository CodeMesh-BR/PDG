'use client';

import { Employee } from '../../useEmployees';
import { Button } from '@/components/ui-elements/button';
import { useState } from 'react';

interface Props {
  users: Employee[];
  onRefresh: () => void;
}

export default function EmployeeList({ users, onRefresh }: Props) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      setDeletingId(id);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`http://localhost:8080/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      // DELETE retorna 204 (sem body)
      if (res.status !== 204 && !res.ok)
        throw new Error('Failed to delete employee');

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((u) => (
        <div
          key={u.id}
          className="border rounded-lg p-4 shadow-sm bg-gray-50 flex justify-between items-center"
        >
          <div>
            <h3 className="font-semibold">{u.display_name || u.full_name}</h3>
            <p className="text-sm text-gray-500">{u.email}</p>
            <p className="text-sm text-gray-500">{u.role}</p>
          </div>

          <Button
            label={deletingId === u.id ? 'Deleting...' : 'Delete'}
            onClick={() => handleDelete(u.id)}
            disabled={deletingId === u.id}
            variant="dark"
          />
        </div>
      ))}
    </div>
  );
}
