"use client";

import { useState } from "react";
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
  const selectedDate = service.selectedDate;
  const [year, month, day] = selectedDate.split("-");
  const formattedDate = `${day}/${month}/${year}`;
  const totalValue = service.logs.reduce((sum, log) => {
    const raw = log.service.cost_value ?? log.service.value ?? "0";
    const value = Number(raw);
    const quantity = log.quantity ?? 1;
    if (Number.isNaN(value)) return sum;
    return sum + value * quantity;
  }, 0);

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
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-gray-500">
                  {service.total} services started on {formattedDate}
                </p>
                <p className="text-sm text-gray-400">
                  Total value: ${totalValue.toFixed(2)}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="flex w-full gap-2 sm:w-[280px]">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => service.setSelectedDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {service.logs.length === 0 ? (
              <p className="italic text-gray-400">No services for this day.</p>
            ) : (
              <StartServiceList
                logs={service.logs}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
