// src/app/(protected)/start-service/components/StartServiceForm.tsx
"use client";

import { Button } from "@/components/ui-elements/button";
import type { UseStartServiceResult } from "../useStartService";

interface StartServiceFormProps {
  onSuccess: () => void;
  service: UseStartServiceResult;
}

export default function StartServiceForm({
  onSuccess,
  service,
}: StartServiceFormProps) {
  const {
    companies,
    services,
    selectedCompany,
    selectedService,

    ocrData,
    duplicateWarning,

    loadingCompanies,
    loadingServices,
    loadingOcr,
    saving,

    setSelectedCompany,
    setSelectedService,
    setDuplicateWarning,

    handleImageChange,
    handleStart,
    confirmStart,
    plate,
    setPlate,
  } = service;

  const submit = async () => {
    const result = await handleStart();
    if (result?.success) {
      onSuccess();
    }
  };

  const confirmDuplicate = async () => {
    await confirmStart();
    setDuplicateWarning(false);
    onSuccess();
  };

  return (
    <div className="rounded-lg border bg-gray-50 p-6 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold">New Service</h2>

      {/* Empresa */}
      <label className="mb-1 block text-sm">Company</label>
      <select
        className="mb-4 w-full rounded border p-2 dark:text-white dark:placeholder:text-white"
        value={selectedCompany ?? ""}
        onChange={(e) =>
          setSelectedCompany(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Select...</option>
        {loadingCompanies && <option disabled>Loading companies...</option>}
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.display_name ?? c.name}
          </option>
        ))}
      </select>

      {/* Serviço */}
      <label className="mb-1 block text-sm">Service</label>
      <select
        className="mb-4 w-full rounded border p-2 dark:text-white dark:placeholder:text-white"
        disabled={!selectedCompany}
        value={selectedService ?? ""}
        onChange={(e) =>
          setSelectedService(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">Select...</option>
        {loadingServices && <option disabled>Loading services...</option>}
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.type}
          </option>
        ))}
      </select>

      {/* OCR */}
      <label className="mb-1 block text-sm">Vehicle plate photo</label>

      <input
        type="file"
        accept="image/*"
        className="mb-2 dark:text-white dark:placeholder:text-white"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          void handleImageChange(file);
        }}
      />

      {loadingOcr && (
        <p className="mb-2 text-sm text-blue-500">Reading file...</p>
      )}

      {ocrData && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium">
            Plate (edit if needed)
          </label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            className="w-full rounded border p-2 uppercase"
            maxLength={10}
          />
        </div>
      )}

      <Button
        className="mt-4 w-full"
        label={saving ? "Starting..." : "Start"}
        disabled={!ocrData || !selectedService || saving}
        onClick={submit}
      />

      {duplicateWarning && (
        <div className="mt-6 rounded border border-yellow-300 bg-yellow-100 p-4">
          <p className="mb-3">
            There's already a similar release for this car today. Start anyway?
          </p>

          <div className="flex gap-3">
            <Button label="Confirm" onClick={confirmDuplicate} />
            <Button
              label="Cancel"
              onClick={() => setDuplicateWarning(false)}
              variant="dark"
            />
          </div>
        </div>
      )}
    </div>
  );
}
