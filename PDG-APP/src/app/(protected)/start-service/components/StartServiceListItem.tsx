"use client";

import type { ServiceLog } from "../types";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  log: ServiceLog;
  onDelete: (id: number) => void;
  onEdit: (log: ServiceLog) => void;
}

export default function StartServiceListItem({ log, onDelete, onEdit }: Props) {
  const onlyDate = log.performed_at.slice(0, 10);
  const [year, month, day] = onlyDate.split("-");
  const formatted = `${day}/${month}/${year}`;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <p>
        <b>Company:</b> {log.company.display_name ?? log.company.name}
      </p>
      <p>
        <b>Service:</b> {log.service.type}
      </p>
      <p>
        <b>Plate:</b> {log.car_plate}
      </p>
      <p>
        <b>Date:</b> {formatted}
      </p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onEdit(log)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm transition duration-200 hover:bg-blue-600 hover:text-white hover:shadow-md"
          title="Edit service"
        >
          <Pencil size={18} strokeWidth={2} />
        </button>

        <button
          onClick={() => onDelete(log.id)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm transition duration-200 hover:bg-red-600 hover:text-white hover:shadow-md"
          title="Delete service"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
