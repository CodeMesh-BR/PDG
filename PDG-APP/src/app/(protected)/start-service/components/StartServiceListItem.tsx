// StartServiceListItem.tsx

"use client";

import type { ServiceLog } from "../types";

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
    <div className="rounded border bg-white p-4 dark:bg-gray-800 dark:text-white">
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
          className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(log.id)}
          className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
