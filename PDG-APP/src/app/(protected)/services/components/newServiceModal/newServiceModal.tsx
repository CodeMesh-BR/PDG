'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-elements/button';

export default function NewServiceModal({ isOpen, onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    type: '',
    description: '',
    value: '',
    image: null as File | null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('description', form.description);
      formData.append('value', form.value);
      if (form.image) formData.append('image', form.image);

      const res = await fetch('http://localhost:8080/api/services', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to create service');

      await onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Start New Service</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

       <input
  type="file"
  accept="image/*"
  capture="environment"
  onChange={(e) => handleChange('image', e.target.files?.[0] || null)}
  className="w-full border p-2 rounded"
/>
          <input
            type="text"
            placeholder="Type (e.g. car wash)"
            value={form.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="number"
            placeholder="Value"
            value={form.value}
            onChange={(e) => handleChange('value', e.target.value)}
            className="w-full border p-2 rounded"
            required
          />

          <div className="flex justify-end gap-3">
            <Button label="Cancel" onClick={onClose} />
            <Button
              label={loading ? 'Saving...' : 'Save'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
