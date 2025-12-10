// src/app/(protected)/start-service/components/StartServiceForm.tsx
"use client";

import { Button } from "@/components/ui-elements/button";
import type { UseStartServiceResult } from "../useStartService";
import { useState } from "react";

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

  const [imageName, setImageName] = useState("");

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

      <div className="flex flex-col gap-1">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#2f2f2f] dark:text-gray-200 dark:hover:bg-[#3b3b3b]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7h3l2-3h8l2 3h3v12H3z" />
            <circle cx="12" cy="13" r="4" />
          </svg>

          <span>Select photo</span>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file) setImageName(file.name);
              void handleImageChange(file);
            }}
          />
        </label>

        {imageName && (
          <span className="text-xs text-gray-500 dark:text-gray-300">
            Selected: <span className="font-medium">{imageName}</span>
          </span>
        )}

        {loadingOcr && (
          <div className="mt-1 flex items-center gap-2 text-sm text-indigo-500 dark:text-indigo-400">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
              />
            </svg>
            <span>Processing photo...</span>
          </div>
        )}
      </div>

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
