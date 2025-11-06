'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-elements/button';
import { useServices } from './useService';
import ServiceForm from './components/SerivceForm/ServiceForm';
import ServiceList from './components/ServiceList/ServiceList';


export default function ServicesPage() {
  const { services, total, loading, error, refresh } = useServices();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Services</h1>

      {/* Formulário para criar serviços */}
      <ServiceForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading || refreshing ? (
          <p>Loading...</p>
        ) : services.length === 0 ? (
          <p className="text-gray-400 italic">No services registered yet.</p>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500">{total} total services</p>
              <Button label="Refresh" onClick={handleRefresh} />
            </div>
            <ServiceList services={services} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
