"use client";

import { Button } from "@/components/ui-elements/button";
import { FormAlert } from "@/components/FormAlerts/FormAlert";
import { API_BASE_URL } from "@/lib/api";
import { getBillingModes } from "@/app/(protected)/departments/useDepartments";
import type { UseStartServiceResult } from "../useStartService";
import { useEffect, useRef, useState } from "react";

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

    departments,
    loadingDepartments,
    selectedDepartment,
    setSelectedDepartment,
    requiresNewUsed,
    refreshDepartments,

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
    vehicleCondition,
    setVehicleCondition,
    stockNumber,
    setStockNumber,
    ocrError,
    ocrDebugId,
    debugLogs,
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
  const [showDebug, setShowDebug] = useState(false);
  const galleryInputId = "plate-photo-input";
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptBillUnit, setNewDeptBillUnit] = useState(false);
  const [newDeptBillHour, setNewDeptBillHour] = useState(false);
  const [newDeptBillQuantity, setNewDeptBillQuantity] = useState(false);
  const [newDeptError, setNewDeptError] = useState("");
  const [newDeptSaving, setNewDeptSaving] = useState(false);

  const handleCreateDepartment = async () => {
    setNewDeptError("");

    if (newDeptName.trim().length < 2) {
      setNewDeptError("Name must be at least 2 characters.");
      return;
    }

    if (!newDeptBillUnit && !newDeptBillHour && !newDeptBillQuantity) {
      setNewDeptError("Select at least one billing mode.");
      return;
    }

    try {
      setNewDeptSaving(true);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`${API_BASE_URL}/departments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: newDeptName.trim(),
          bill_by_unit: newDeptBillUnit,
          bill_by_hour: newDeptBillHour,
          bill_by_quantity: newDeptBillQuantity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to create department");
      }

      await refreshDepartments();
      setSelectedDepartment(data.data.id);
      setShowNewDepartmentForm(false);
      setNewDeptName("");
      setNewDeptBillUnit(false);
      setNewDeptBillHour(false);
      setNewDeptBillQuantity(false);
    } catch (err: any) {
      setNewDeptError(err.message);
    } finally {
      setNewDeptSaving(false);
    }
  };

  const requiresPlateInput = !requiresNewUsed || vehicleCondition === "used";
  const requiresStockNumber = requiresNewUsed;
  const showVehiclePhotoInput = !requiresNewUsed || Boolean(vehicleCondition);
  const canStart =
    Boolean(selectedService) &&
    (!requiresStockNumber || Boolean(stockNumber.trim())) &&
    (!requiresNewUsed || Boolean(vehicleCondition)) &&
    (!requiresPlateInput || Boolean(plate));

  const handleFilePicked = (file: File | null) => {
    setImageName(file?.name ?? "");
    void handleImageChange(file);
  };

  const openInput = (source: "camera" | "gallery") => {
    const input =
      source === "camera" ? cameraInputRef.current : galleryInputRef.current;
    input?.click();
  };

  useEffect(() => {
    if (requiresPlateInput) return;

    setImageName("");
    void handleImageChange(null);
  }, [requiresPlateInput]);

  useEffect(() => {
    if (!selectedCompany) return;

    const company = companies.find(
      (c) => Number(c.id) === Number(selectedCompany),
    );
    const defaultId = company?.default_service_id ?? null;
    if (!defaultId) return;

    const selectedIsValid = selectedService
      ? services.some((s) => Number(s.id) === Number(selectedService))
      : false;

    const defaultIsValid = services.some(
      (s) => Number(s.id) === Number(defaultId),
    );
    if (!defaultIsValid) return;

    if (!selectedService || !selectedIsValid) {
      setSelectedService(defaultId);
    }
  }, [
    selectedCompany,
    companies,
    services,
    selectedService,
    setSelectedService,
  ]);

  return (
    <div className="rounded-lg border bg-gray-50 p-6 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold">New Service</h2>

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

      <label className="mb-1 block text-sm">Department (optional override)</label>
      <select
        className="mb-4 w-full rounded border p-2 dark:text-white dark:placeholder:text-white"
        disabled={!selectedService || loadingDepartments}
        value={selectedDepartment ?? ""}
        onChange={(e) => {
          if (e.target.value === "__new__") {
            setShowNewDepartmentForm(true);
            return;
          }
          setSelectedDepartment(e.target.value ? Number(e.target.value) : null);
        }}
      >
        <option value="">Use service's default department</option>
        {loadingDepartments && <option disabled>Loading departments...</option>}
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({getBillingModes(d)})
          </option>
        ))}
        <option value="__new__">+ New department...</option>
      </select>

      {showNewDepartmentForm && (
        <div className="mb-4 rounded border border-dashed p-3">
          <p className="mb-2 text-sm font-medium">New department</p>
          {newDeptError && <FormAlert type="error" message={newDeptError} />}
          <input
            type="text"
            placeholder="Department name *"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="mb-2 w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
          />
          <div className="mb-2 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={newDeptBillUnit}
                onChange={(e) => setNewDeptBillUnit(e.target.checked)}
              />
              Bill by unit
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={newDeptBillHour}
                onChange={(e) => setNewDeptBillHour(e.target.checked)}
              />
              Bill by hour
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={newDeptBillQuantity}
                onChange={(e) => setNewDeptBillQuantity(e.target.checked)}
              />
              Bill by quantity
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              label={newDeptSaving ? "Saving..." : "Create department"}
              type="button"
              onClick={handleCreateDepartment}
              disabled={newDeptSaving}
              size="small"
            />
            <Button
              label="Cancel"
              type="button"
              variant="dark"
              size="small"
              onClick={() => setShowNewDepartmentForm(false)}
            />
          </div>
        </div>
      )}

      {requiresNewUsed && (
        <>
          <label className="mb-1 block text-sm">Vehicle condition</label>
          <select
            className="mb-4 w-full rounded border p-2 dark:text-white dark:placeholder:text-white"
            value={vehicleCondition}
            onChange={(e) =>
              setVehicleCondition(
                e.target.value === "new" || e.target.value === "used"
                  ? e.target.value
                  : "",
              )
            }
          >
            <option value="">Select...</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </>
      )}

      {requiresStockNumber && (
        <>
          <label className="mb-1 block text-sm">Stock number</label>
          <input
            type="text"
            value={stockNumber}
            onChange={(e) => setStockNumber(e.target.value)}
            placeholder="Enter stock number"
            className="mb-4 w-full rounded border p-2 uppercase dark:bg-gray-800 dark:text-white"
          />
          {imageName && ocrError && !stockNumber && (
            <p className="-mt-3 mb-4 text-xs text-yellow-600 dark:text-yellow-400">
              Could not detect the stock number automatically. Please enter it manually.
            </p>
          )}
        </>
      )}

      {showVehiclePhotoInput && (
        <>
          <label className="mb-1 block text-sm">
            {requiresNewUsed ? "Vehicle stock photo" : "Vehicle plate photo"}
          </label>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openInput("camera")}
                className="inline-flex w-fit items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#2f2f2f] dark:text-gray-200 dark:hover:bg-[#3b3b3b]"
              >
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
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => openInput("gallery")}
                className="inline-flex w-fit items-center gap-2 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-100 dark:border-gray-600 dark:bg-[#2f2f2f] dark:text-gray-200 dark:hover:bg-[#3b3b3b]"
              >
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
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="M21 15l-4.5-4.5L8 19" />
                </svg>
                <span>Gallery</span>
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleFilePicked(file);
                e.currentTarget.value = "";
              }}
            />

            <input
              ref={galleryInputRef}
              id={galleryInputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                handleFilePicked(file);
                e.currentTarget.value = "";
              }}
            />

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

          <div className="mt-4">
            {requiresPlateInput && (imageName || requiresNewUsed) && (
              <>
                <label className="mb-1 block text-sm">Vehicle plate</label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Enter or correct the plate"
                  className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white"
                  disabled={loadingOcr}
                />

                {ocrError && (
                  <div className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <p>
                      Warning: Could not detect the plate automatically. Please
                      enter it manually.
                    </p>
                    <p className="mt-0.5">
                      Tip: if using the camera didn&apos;t work, try selecting a
                      photo from your gallery.
                    </p>
                    {ocrDebugId && (
                      <p className="mt-0.5">Request ID: {ocrDebugId}</p>
                    )}
                  </div>
                )}

                {!ocrError && ocrData?.plate && (
                  <p className="mt-1 text-xs text-gray-500">
                    OCR detected: <b>{ocrData.plate}</b>
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!requiresPlateInput && requiresNewUsed && vehicleCondition === "new" && (
        <p className="text-sm text-gray-500 dark:text-gray-300">
          New cars only require the stock number. Use the photo to fill it automatically or enter it manually.
        </p>
      )}

      <Button
        type="button"
        className="mt-4 w-full"
        label={saving ? "Starting..." : "Start"}
        disabled={!canStart || saving}
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

      {/* Debug panel — remove after investigation */}
      {debugLogs.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-xs text-gray-400 underline"
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? "Hide debug" : "Show debug"}
          </button>
          {showDebug && (
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-black p-2 text-[10px] leading-tight text-green-400">
              {debugLogs.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
