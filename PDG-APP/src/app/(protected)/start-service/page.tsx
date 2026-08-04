"use client";

import { useEffect, useState } from "react";
import { useStartService } from "./useStartService";
import StartServiceForm from "./components/StartServiceForm";
import StartServiceList from "./components/StartServiceList";
import { deleteServiceLog } from "./api";
import { ServiceLog } from "./types";
import { useNavigate } from "react-router-dom";
import {
  canManageAllServiceLogs,
  canSeeCosts,
  getStoredRole,
} from "@/lib/permissions";

export default function StartServicePage() {
  const service = useStartService();
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const role = getStoredRole();
  const showCosts = canSeeCosts(role);
  const showEmployee = canManageAllServiceLogs(role);
  const selectedDate = service.selectedDate;

  // The date field is kept local and only committed once it holds a complete,
  // plausible date: a native date input emits every intermediate value while the
  // year is typed (0002-08-03, 0020-08-03, ...), and each of those would fire a
  // request and overwrite what the user is still typing.
  const [dateInput, setDateInput] = useState(selectedDate);

  useEffect(() => {
    setDateInput(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (dateInput === selectedDate) return;

    const isComplete = dateInput === "" || /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
    const isPlausible = dateInput === "" || Number(dateInput.slice(0, 4)) >= 1900;
    if (!isComplete || !isPlausible) return;

    const timer = setTimeout(() => service.setSelectedDate(dateInput), 500);
    return () => clearTimeout(timer);
  }, [dateInput, selectedDate]);

  const [year, month, day] = selectedDate.split("-");
  const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
    ? `${day}/${month}/${year}`
    : null;
  const totalValue = service.logs.reduce((sum, log) => {
    const raw = log.service.cost_value ?? "0";
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
    navigate(`/start-service/${log.id}/edit`);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">New Service</h1>

      <StartServiceForm onSuccess={service.refreshLogs} service={service} />

      <div className="mt-10">
        {service.errorLogs && (
          <p className="mb-4 text-red-500">{service.errorLogs}</p>
        )}

        {/* The filter stays mounted while the list reloads — unmounting it would
            steal focus from the date field mid-typing. */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-gray-500">
              {service.total} services started{" "}
              {formattedDate ? `on ${formattedDate}` : "(all dates)"}
            </p>
            {showCosts && (
              <p className="text-sm text-gray-400">
                Total value: ${totalValue.toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="flex w-full items-center gap-2 sm:w-[280px]">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {dateInput && (
                <button
                  type="button"
                  onClick={() => setDateInput("")}
                  className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {service.loadingLogs || refreshing ? (
          <p>Loading...</p>
        ) : service.logs.length === 0 ? (
          <p className="italic text-gray-400">No services for this day.</p>
        ) : (
          <StartServiceList
            logs={service.logs}
            onDelete={handleDelete}
            onEdit={handleEdit}
            showCosts={showCosts}
            showEmployee={showEmployee}
          />
        )}
      </div>
    </div>
  );
}
