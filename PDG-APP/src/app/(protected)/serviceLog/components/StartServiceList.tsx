// app/services/start/components/StartServiceList/StartServiceList.tsx

"use client";

import StartServiceListItem from "./StartServiceListItem";
import { ServiceLog } from "../types";

export default function StartServiceList({ logs }: { logs: ServiceLog[] }) {
  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <StartServiceListItem key={log.id} log={log} />
      ))}
    </div>
  );
}
