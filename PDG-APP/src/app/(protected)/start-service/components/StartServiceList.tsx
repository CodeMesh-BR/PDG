"use client";

import StartServiceListItem from "./StartServiceListItem";
import type { ServiceLog } from "../types";

interface Props {
  logs: ServiceLog[];
  onDelete: (id: number) => void;
  onEdit: (log: ServiceLog) => void;
}

export default function StartServiceList({ logs, onDelete, onEdit }: Props) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <StartServiceListItem
          key={log.id}
          log={log}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
