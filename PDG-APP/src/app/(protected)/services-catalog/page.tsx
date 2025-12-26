"use client";

import ServiceList from "./components/ServiceList/ServiceList";
import { useServicesCatalog } from "./useServicesCatalog";
import ServiceCatalogForm from "./components/SerivceForm/ServiceForm";

export default function ServicesCatalogPage() {
  const { services, total, loading, error, refresh } = useServicesCatalog();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">Services</h1>

      {/* Formulário para criar serviços */}
      <ServiceCatalogForm onSuccess={refresh} />

      <div className="mt-10">
        {error && <p className="mb-4 text-red-500">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : services.length === 0 ? (
          <p className="italic text-gray-400">No services registered yet.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-500">{total} total services</p>
            </div>
            <ServiceList services={services} onRefresh={refresh} />
          </>
        )}
      </div>
    </div>
  );
}
