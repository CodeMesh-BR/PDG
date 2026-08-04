"use client";

import type { ServiceLog } from "../types";
import { ChevronDown, ChevronUp, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  logs: ServiceLog[];
  onDelete: (id: number) => void;
  onEdit: (log: ServiceLog) => void;
  showCosts?: boolean;
  showEmployee?: boolean;
}

type SortKey =
  | "employee"
  | "company"
  | "service"
  | "department"
  | "plate"
  | "stock"
  | "date"
  | "cost";

type SortDirection = "asc" | "desc";

/** Value each column sorts by. Numbers sort numerically, everything else as text. */
const SORT_VALUES: Record<SortKey, (log: ServiceLog) => string | number> = {
  employee: (log) => log.user?.display_name ?? log.user?.full_name ?? "",
  company: (log) => log.company.display_name ?? log.company.name,
  service: (log) => log.service.type,
  department: (log) => log.department?.name ?? log.service.department?.name ?? "",
  plate: (log) => log.car_plate ?? "",
  stock: (log) => log.stock_number ?? "",
  date: (log) => log.performed_at.slice(0, 10),
  cost: (log) => Number(log.service.cost_value ?? 0),
};

export default function StartServiceList({
  logs,
  onDelete,
  onEdit,
  showCosts = true,
  showEmployee = false,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortedLogs = useMemo(() => {
    if (!sortKey) return logs;

    const getValue = SORT_VALUES[sortKey];
    const factor = sortDirection === "asc" ? 1 : -1;

    return [...logs].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * factor;
      }

      // Empty cells always sink to the bottom, whichever direction is active.
      if (left === "") return right === "" ? 0 : 1;
      if (right === "") return -1;

      return String(left).localeCompare(String(right), undefined, {
        numeric: true,
        sensitivity: "base",
      }) * factor;
    });
  }, [logs, sortKey, sortDirection]);

  const SortableHeader = ({
    label,
    sortBy,
    align = "left",
  }: {
    label: string;
    sortBy: SortKey;
    align?: "left" | "right";
  }) => {
    const isActive = sortKey === sortBy;
    const Icon = !isActive
      ? ChevronsUpDown
      : sortDirection === "asc"
        ? ChevronUp
        : ChevronDown;

    return (
      <th
        className={`px-2 py-2 font-medium sm:px-4 sm:py-3 ${align === "right" ? "text-right" : ""}`}
        aria-sort={
          isActive
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <button
          type="button"
          onClick={() => toggleSort(sortBy)}
          className={`group inline-flex items-center gap-1 font-medium transition hover:text-gray-900 dark:hover:text-white ${
            align === "right" ? "flex-row-reverse" : ""
          } ${isActive ? "text-gray-900 dark:text-white" : ""}`}
        >
          {label}
          <Icon
            size={14}
            strokeWidth={2}
            className={isActive ? "" : "opacity-40 group-hover:opacity-70"}
            aria-hidden="true"
          />
        </button>
      </th>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              {showEmployee && (
                <SortableHeader label="Employee" sortBy="employee" />
              )}
              <SortableHeader label="Company" sortBy="company" />
              <SortableHeader label="Service" sortBy="service" />
              <SortableHeader label="Department" sortBy="department" />
              <SortableHeader label="Plate" sortBy="plate" />
              <SortableHeader label="Stock" sortBy="stock" />
              <SortableHeader label="Date" sortBy="date" />
              {showCosts && <SortableHeader label="Cost Value" sortBy="cost" />}
              <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedLogs.map((log) => {
              const onlyDate = log.performed_at.slice(0, 10);
              const [year, month, day] = onlyDate.split("-");
              const formatted = `${day}/${month}/${year}`;
              const costValue = log.service.cost_value;

              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  {showEmployee && (
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                      {log.user?.display_name ?? log.user?.full_name ?? "-"}
                    </td>
                  )}

                  <td className="px-2 py-2 font-medium text-gray-900 dark:text-white sm:px-4 sm:py-3">
                    {log.company.display_name ?? log.company.name}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.service.type}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.department?.name ?? log.service.department?.name ?? "-"}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.car_plate || "-"}
                    {log.vehicle_condition && (
                      <div className="text-xs capitalize text-gray-500 dark:text-gray-400">
                        {log.vehicle_condition}
                      </div>
                    )}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.stock_number || "-"}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {formatted}
                  </td>

                  {showCosts && (
                    <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                      {costValue != null ? `$${costValue}` : "-"}
                    </td>
                  )}

                  <td className="px-2 py-2 sm:px-4 sm:py-3">
                    <div className="flex justify-end gap-2 sm:gap-3">
                      <button
                        onClick={() => onEdit(log)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-600 dark:hover:text-white sm:h-10 sm:w-10"
                        title="Edit service"
                      >
                        <Pencil size={16} strokeWidth={2} className="sm:hidden" />
                        <Pencil size={18} strokeWidth={2} className="hidden sm:block" />
                      </button>

                      <button
                        onClick={() => onDelete(log.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-600 dark:hover:text-white sm:h-10 sm:w-10"
                        title="Delete service"
                      >
                        <Trash2 size={16} strokeWidth={2} className="sm:hidden" />
                        <Trash2 size={18} strokeWidth={2} className="hidden sm:block" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
