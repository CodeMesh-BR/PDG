"use client";

import type { ServiceLog } from "../types";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  logs: ServiceLog[];
  onDelete: (id: number) => void;
  onEdit: (log: ServiceLog) => void;
}

export default function StartServiceList({ logs, onDelete, onEdit }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Company
              </th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Service
              </th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Plate
              </th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Date
              </th>
              <th className="px-2 py-2 font-medium sm:px-4 sm:py-3">
                Cost Value
              </th>
              <th className="px-2 py-2 text-right font-medium sm:px-4 sm:py-3">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => {
              const onlyDate = log.performed_at.slice(0, 10);
              const [year, month, day] = onlyDate.split("-");
              const formatted = `${day}/${month}/${year}`;
              const costValue = log.service.cost_value ?? log.service.value;

              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <td className="px-2 py-2 font-medium text-gray-900 dark:text-white sm:px-4 sm:py-3">
                    {log.company.display_name ?? log.company.name}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.service.type}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {log.car_plate}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    {formatted}
                  </td>

                  <td className="px-2 py-2 text-gray-700 dark:text-gray-200 sm:px-4 sm:py-3">
                    ${costValue}
                  </td>

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
