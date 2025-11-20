// app/services/start/components/StartServiceList/StartServiceListItem.tsx

"use client";

import { format } from "date-fns";
import { enAU } from "date-fns/locale";

import { ServiceLog } from "../types";

export default function StartServiceListItem({ log }: { log: ServiceLog }) {
  const formatted = format(new Date(log.performed_at), "dd/MM/yyyy HH:mm aaa", {
    locale: enAU,
  });
  return (
    <div className="rounded border bg-white p-4 dark:bg-gray-800">
      <p>
        <b>Company:</b> {log.company.display_name}
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
    </div>
  );
}
