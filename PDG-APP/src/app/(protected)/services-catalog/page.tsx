"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";

import ServiceList from "./components/ServiceList/ServiceList";
import { useServicesCatalog } from "./useServicesCatalog";
import ServiceCatalogForm from "./components/SerivceForm/ServiceForm";

export default function ServicesCatalogPage() {
  const { services, total, loading, error, refresh } = useServicesCatalog();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Services</h1>

      {/* Formulário para criar serviços */}
      <ServiceCatalogForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {loading || refreshing ? (
          <p>Loading...</p>
        ) : services.length === 0 ? (
          <p className="italic text-gray-400">No services registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
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
