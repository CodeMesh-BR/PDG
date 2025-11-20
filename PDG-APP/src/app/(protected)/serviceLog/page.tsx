"use client";

import { useState } from "react";
import { Button } from "@/components/ui-elements/button";
import { useStartService } from "./useStartService";

import StartServiceForm from "./components/StartServiceForm";
import StartServiceList from "./components/StartServiceList";

export default function StartServicePage() {
  const { logs, total, loadingLogs, errorLogs, refreshLogs } =
    useStartService();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLogs();
    setRefreshing(false);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold">New Service</h1>

      <StartServiceForm onSuccess={refreshLogs} />

      <div className="mt-10">
        {errorLogs && <p className="mb-4 text-red-500">{errorLogs}</p>}

        {loadingLogs || refreshing ? (
          <p>Loading...</p>
        ) : logs.length === 0 ? (
          <p className="italic text-gray-400">Nenhum serviço lançado hoje.</p>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-500">{total} serviços hoje</p>

              <Button label="Refresh" onClick={handleRefresh} />
            </div>

            <StartServiceList logs={logs} />
          </>
        )}
      </div>
    </div>
  );
}
