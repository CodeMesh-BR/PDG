import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

import { fetchServiceLog } from "../start-service/api";
import {
  fetchDepartments,
  updateServiceLog,
  type ReportRow,
  type ServiceLogUpdatePayload,
} from "./api";
import { companyName } from "./CompanyMultiSelect";

/** Roles the API accepts as the employee of a service entry. */
const PERFORMER_ROLES = ["admin", "supervisor", "detailer"];
const NEW_USED_DEPARTMENT = "New / Used";

type Props = {
  row: ReportRow;
  companies: any[];
  users: any[];
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  userId: string;
  companyId: string;
  serviceId: string;
  departmentId: string;
  date: string;
  plate: string;
  vehicleCondition: "" | "new" | "used";
  stockNumber: string;
  quantity: string;
  notes: string;
};

function initialState(row: ReportRow): FormState {
  return {
    userId: String(row.user_id),
    companyId: String(row.company_id),
    serviceId: String(row.service_id),
    departmentId: "",
    date: String(row.performed_at).slice(0, 10),
    plate: row.car_plate ?? "",
    vehicleCondition: (row.vehicle_condition as FormState["vehicleCondition"]) ?? "",
    stockNumber: row.stock_number ?? "",
    quantity: String(row.total_quantity ?? 1),
    notes: row.notes ?? "",
  };
}

export function EditServiceLogModal({ row, companies, users, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<FormState>(() => initialState(row));
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // the report row has no department id, so the entry itself is loaded once
  useEffect(() => {
    let active = true;

    Promise.all([fetchServiceLog(row.service_log_id), fetchDepartments()])
      .then(([log, depts]) => {
        if (!active) return;
        setDepartments(depts);
        if (!log) {
          setError("Could not load this service entry.");
          return;
        }
        setForm((f) => ({
          ...f,
          departmentId: log.department_id ? String(log.department_id) : "",
        }));
      })
      .catch(() => active && setError("Could not load this service entry."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [row.service_log_id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const company = companies.find((c) => String(c.id) === form.companyId);
  const services: any[] = company?.services ?? [];
  const service = services.find((s) => String(s.id) === form.serviceId);

  const effectiveDepartment =
    departments.find((d) => String(d.id) === form.departmentId) ??
    service?.department ??
    null;
  const requiresNewUsed = effectiveDepartment?.name === NEW_USED_DEPARTMENT;

  const employees = useMemo(
    () =>
      users.filter((u) => {
        if (String(u.id) === String(row.user_id)) return true;
        const role = String(u.role ?? "").toLowerCase();
        if (!PERFORMER_ROLES.includes(role)) return false;
        if (role !== "detailer") return true;
        return (u.companies ?? []).some((c: any) => String(c.id) === form.companyId);
      }),
    [users, row.user_id, form.companyId],
  );

  const changeCompany = (companyId: string) => {
    const next = companies.find((c) => String(c.id) === companyId);
    const keepService = (next?.services ?? []).some(
      (s: any) => String(s.id) === form.serviceId,
    );
    setForm((f) => ({
      ...f,
      companyId,
      serviceId: keepService ? f.serviceId : "",
    }));
  };

  const close = () => {
    dialogRef.current?.close();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const quantity = Number(form.quantity);
    const plate = form.plate.trim().toUpperCase();
    const stockNumber = form.stockNumber.trim().toUpperCase();

    if (!form.companyId || !form.serviceId || !form.userId || !form.date) {
      setError("Company, service, employee and date are required.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a whole number of at least 1.");
      return;
    }
    if (requiresNewUsed) {
      if (!form.vehicleCondition) return setError("Vehicle condition is required.");
      if (!stockNumber) return setError("Stock number is required.");
      if (form.vehicleCondition === "used" && !plate) {
        return setError("Vehicle plate is required for used cars.");
      }
    } else if (!plate) {
      return setError("Vehicle plate is required.");
    }

    const payload: ServiceLogUpdatePayload = {
      company_id: Number(form.companyId),
      service_id: Number(form.serviceId),
      department_id: form.departmentId ? Number(form.departmentId) : null,
      car_plate: plate || null,
      vehicle_condition: requiresNewUsed ? form.vehicleCondition || null : null,
      stock_number: requiresNewUsed ? stockNumber || null : null,
      date: form.date,
      quantity,
      notes: form.notes.trim() || null,
    };

    // reassigning is validated separately by the API, so only send it on change
    if (form.userId !== String(row.user_id)) payload.user_id = Number(form.userId);

    setSaving(true);
    const result = await updateServiceLog(row.service_log_id, payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Failed to update the service entry.");
      return;
    }

    onSaved();
    close();
  };

  const inputClass =
    "w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-dark outline-none transition focus:border-primary disabled:opacity-60 dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:focus:border-primary";
  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wide text-dark-5 dark:text-dark-6";

  const fieldId = (name: string) => `edit-log-${name}`;
  const disabled = loading || saving;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="edit-log-title"
      className="w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-stroke bg-white p-0 text-dark shadow-xl backdrop:bg-black/50 dark:border-stroke-dark dark:bg-gray-dark dark:text-white"
    >
      <form onSubmit={submit} noValidate className="p-5 md:p-6">
        <h2 id="edit-log-title" className="text-lg font-semibold">
          Edit service entry #{row.service_log_id}
        </h2>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Changes apply to this entry only. Unit values come from the service catalog.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-light-3 bg-red-light-6 px-4 py-3 text-sm text-red-dark"
          >
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={fieldId("company")} className={labelClass}>
              Company
            </label>
            <select
              id={fieldId("company")}
              className={inputClass}
              value={form.companyId}
              disabled={disabled}
              onChange={(e) => changeCompany(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {companyName(c)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={fieldId("service")} className={labelClass}>
              Service
            </label>
            <select
              id={fieldId("service")}
              className={inputClass}
              value={form.serviceId}
              disabled={disabled || !form.companyId}
              onChange={(e) => set("serviceId", e.target.value)}
              required
            >
              <option value="">Select…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={fieldId("department")} className={labelClass}>
              Department
            </label>
            <select
              id={fieldId("department")}
              className={inputClass}
              value={form.departmentId}
              disabled={disabled}
              onChange={(e) => set("departmentId", e.target.value)}
            >
              <option value="">Use service's default department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={fieldId("employee")} className={labelClass}>
              Employee
            </label>
            <select
              id={fieldId("employee")}
              className={inputClass}
              value={form.userId}
              disabled={disabled}
              onChange={(e) => set("userId", e.target.value)}
              required
            >
              {employees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name ?? u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={fieldId("date")} className={labelClass}>
              Date
            </label>
            <input
              id={fieldId("date")}
              type="date"
              className={inputClass}
              value={form.date}
              disabled={disabled}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor={fieldId("quantity")} className={labelClass}>
              Quantity
            </label>
            <input
              id={fieldId("quantity")}
              type="number"
              min={1}
              step={1}
              className={inputClass}
              value={form.quantity}
              disabled={disabled}
              onChange={(e) => set("quantity", e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor={fieldId("plate")} className={labelClass}>
              Plate
            </label>
            <input
              id={fieldId("plate")}
              className={cn(inputClass, "uppercase")}
              value={form.plate}
              maxLength={20}
              disabled={disabled}
              onChange={(e) => set("plate", e.target.value)}
            />
          </div>

          {requiresNewUsed && (
            <>
              <div>
                <label htmlFor={fieldId("condition")} className={labelClass}>
                  Vehicle condition
                </label>
                <select
                  id={fieldId("condition")}
                  className={inputClass}
                  value={form.vehicleCondition}
                  disabled={disabled}
                  onChange={(e) =>
                    set("vehicleCondition", e.target.value as FormState["vehicleCondition"])
                  }
                  required
                >
                  <option value="">Select…</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </div>

              <div>
                <label htmlFor={fieldId("stock")} className={labelClass}>
                  Stock number
                </label>
                <input
                  id={fieldId("stock")}
                  className={cn(inputClass, "uppercase")}
                  value={form.stockNumber}
                  maxLength={50}
                  disabled={disabled}
                  onChange={(e) => set("stockNumber", e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label htmlFor={fieldId("notes")} className={labelClass}>
              Notes
            </label>
            <textarea
              id={fieldId("notes")}
              rows={3}
              className={inputClass}
              value={form.notes}
              maxLength={1000}
              disabled={disabled}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            label="Cancel"
            variant="outlineDark"
            shape="rounded"
            size="small"
            onClick={close}
            disabled={saving}
          />
          <Button
            type="submit"
            label={saving ? "Saving…" : loading ? "Loading…" : "Save changes"}
            shape="rounded"
            size="small"
            disabled={disabled}
          />
        </div>
      </form>
    </dialog>
  );
}
