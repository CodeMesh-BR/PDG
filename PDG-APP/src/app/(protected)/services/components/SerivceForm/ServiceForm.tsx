'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui-elements/button';

interface Company {
  id: number;
  name: string;
  display_name?: string;
}

interface Props {
  onSuccess?: () => void;
}

export default function ServiceForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    type: '',
    description: '',
    value: '',
    company_id: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Busca empresas
  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');
      const res = await fetch('http://localhost:8080/api/companies', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch('http://localhost:8080/api/services', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create service');

      setForm({ type: '', description: '', value: '', company_id: '' });
      setSuccess('Service created successfully!');
      if (typeof onSuccess === 'function') onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-lg font-semibold">Add New Service</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="type"
          placeholder="Type *"
          value={form.type}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          name="value"
          type="number"
          step="0.01"
          placeholder="Value *"
          value={form.value}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description *"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
          rows={3}
          required
        />

        <select
          name="company_id"
          value={form.company_id}
          onChange={handleChange}
          className="border p-2 rounded col-span-2 bg-white"
          required
        >
          <option value="" disabled>
            Select company
          </option>
          {companies.length === 0 ? (
            <option disabled>No companies available</option>
          ) : (
            companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name || c.name}
              </option>
            ))
          )}
        </select>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}

      <Button
        label={loading ? 'Saving...' : 'Save Service'}
        type="submit"
        disabled={loading}
      />
    </form>
  );
}
