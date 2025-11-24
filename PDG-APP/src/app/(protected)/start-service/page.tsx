// src/app/(protected)/start-service/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useStartService } from "./useStartService";
import StartServiceForm from "./components/StartServiceForm";
import StartServiceList from "./components/StartServiceList";
import { deleteServiceLog } from "./api";
import { ServiceLog } from "./types";
import { useRouter } from "next/navigation";

export default function StartServicePage() {
  const service = useStartService();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setRefreshing(true);
    await service.refreshLogs();
    setRefreshing(false);
  };

  const handleDelete = async (id: number) => {
    await deleteServiceLog(id);
    await service.refreshLogs();
  };

  const handleEdit = (log: ServiceLog) => {
    router.push(`/start-service/${log.id}/edit`);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">New Service</h1>

      <StartServiceForm onSuccess={service.refreshLogs} service={service} />

      <div className="mt-10">
        {service.errorLogs && (
          <p className="mb-4 text-red-500">{service.errorLogs}</p>
        )}

        {service.loadingLogs || refreshing ? (
          <p>Loading...</p>
        ) : service.logs.length === 0 ? (
          <p className="italic text-gray-400">No services today.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-500">
                {service.total} services started today
              </p>
              <Button label="Refresh" onClick={handleRefresh} />
            </div>

            <StartServiceList
              logs={service.logs}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </>
        )}
      </div>
    </div>
  );
}
