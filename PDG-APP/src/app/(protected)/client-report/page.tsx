"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui-elements/button";
import { cn } from "@/lib/utils";

import {
  fetchClientReport,
  fetchMyCompanies,
  type ClientReportFilters,
  type ClientReportRow,
  type MyCompany,
} from "./api";
import { COLUMNS, money } from "./columns";
import { buildClientReportPdf, loadLogoDataUrl } from "./reportPdf";

function labelForPeriod(filters: ClientReportFilters) {
  if (!filters.date_from && !filters.date_to) return "All time";
  return `${filters.date_from || "—"} → ${filters.date_to || "—"}`;
}

export default function ClientReportPage() {
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<MyCompany[]>([]);

  const [filters, setFilters] = useState<ClientReportFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<ClientReportFilters>({});

  const [rows, setRows] = useState<ClientReportRow[] | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchMyCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const report = await fetchClientReport(filters);
      setRows(report.data);
      setTruncated(Boolean(report.truncated));
      setAppliedFilters(filters);
    } catch (e: any) {
      setRows(null);
      setError(e?.message ?? "Failed to generate the report.");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => setFilters({});

  const totalPrice = useMemo(
    () => (rows ?? []).reduce((sum, r) => sum + Number(r.price ?? 0), 0),
    [rows],
  );

  const storeLabel = useMemo(() => {
    if (!appliedFilters.company_id) return "All stores";
    return (
      companies.find((c) => c.id === appliedFilters.company_id)?.display_name ??
      "—"
    );
  }, [appliedFilters.company_id, companies]);

  const fileStamp = new Date().toISOString().slice(0, 10);

  const exportCSV = () => {
    if (!rows?.length) return;

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const csv = [
      COLUMNS.map((c) => escape(c.header)),
      ...rows.map((row) => COLUMNS.map((c) => escape((c.raw ?? c.value)(row)))),
    ]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client_report_${fileStamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!rows?.length) return;

    setExporting(true);
    try {
      const logo = await loadLogoDataUrl();
      const pdf = buildClientReportPdf({
        rows,
        periodLabel: labelForPeriod(appliedFilters),
        storeLabel,
        logo,
      });
      pdf.save(`client_report_${fileStamp}.pdf`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to build the PDF.");
    } finally {
      setExporting(false);
    }
  };

  if (!mounted) return null;

  const inputClass =
    "w-full rounded-lg border border-stroke bg-white px-3 py-2.5 text-sm text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white dark:focus:border-primary";
  const labelClass =
    "mb-1.5 block text-xs font-medium uppercase tracking-wide text-dark-5 dark:text-dark-6";
  const cardClass =
    "rounded-xl border border-stroke bg-white shadow-sm dark:border-stroke-dark dark:bg-gray-dark";

  return (
    <div className="mx-auto max-w-[1400px] p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-dark dark:text-white md:text-3xl">
          Client Report
        </h1>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Price, service, stock number, plate, store and department for your
          company.
        </p>
      </header>

      {/* ------------------------------------------------------- filters */}
      <section className={cn(cardClass, "mb-6 p-5 md:p-6")}>
        <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
          Filters
        </h2>

        <div
          className={cn(
            "grid gap-4 md:grid-cols-2",
            companies.length > 1 ? "xl:grid-cols-3" : "xl:grid-cols-2",
          )}
        >
          {companies.length > 1 && (
            <div>
              <label className={labelClass}>Store</label>
              <select
                className={inputClass}
                value={filters.company_id ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    company_id: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">All stores</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>From</label>
            <input
              type="date"
              className={inputClass}
              value={filters.date_from ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date_from: e.target.value || undefined,
                }))
              }
            />
          </div>

          <div>
            <label className={labelClass}>To</label>
            <input
              type="date"
              className={inputClass}
              value={filters.date_to ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date_to: e.target.value || undefined,
                }))
              }
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            label={loading ? "Generating…" : "Generate Report"}
            shape="rounded"
            size="small"
            disabled={loading}
            onClick={generateReport}
          />
          <Button
            label="Clear filters"
            variant="outlineDark"
            shape="rounded"
            size="small"
            onClick={resetFilters}
          />
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-lg border border-red-light-3 bg-red-light-6 px-4 py-3 text-sm text-red-dark">
          {error}
        </div>
      )}

      {loading && (
        <p className="py-10 text-center text-sm text-dark-5 dark:text-dark-6">
          Loading…
        </p>
      )}

      {rows && !loading && (
        <>
          {/* --------------------------------------------------- toolbar */}
          <section className={cn(cardClass, "mb-6 p-5 md:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={labelClass}>Entries</span>
                <p className="text-2xl font-bold text-dark dark:text-white">
                  {rows.length}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <Button
                  label="Export CSV"
                  variant="outlineDark"
                  shape="rounded"
                  size="small"
                  onClick={exportCSV}
                />
                <Button
                  label={exporting ? "Building…" : "Export PDF"}
                  shape="rounded"
                  size="small"
                  disabled={exporting}
                  onClick={exportPDF}
                />
              </div>
            </div>

            <p className="mt-4 text-xs text-dark-5 dark:text-dark-6">
              Period: {labelForPeriod(appliedFilters)} · {storeLabel} · Total:{" "}
              {money(totalPrice)}
            </p>

            {truncated && (
              <p className="mt-2 text-xs font-medium text-red">
                Too many rows for a single export — narrow the date range to
                include everything.
              </p>
            )}
          </section>

          {/* ----------------------------------------------------- table */}
          <section className={cn(cardClass, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-dark text-left text-white">
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                        )}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={COLUMNS.length}
                        className="px-4 py-10 text-center text-dark-5 dark:text-dark-6"
                      >
                        No service logs match these filters.
                      </td>
                    </tr>
                  )}

                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-t border-stroke odd:bg-gray-1 hover:bg-primary/5 dark:border-stroke-dark dark:odd:bg-dark-2"
                    >
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-dark dark:text-white",
                            col.align === "right" && "text-right tabular-nums",
                            col.align === "center" && "text-center",
                          )}
                        >
                          {col.value(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>

                {rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-stroke bg-primary/10 font-semibold dark:border-stroke-dark">
                      {COLUMNS.map((col, index) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-dark dark:text-white",
                            col.align === "right" && "text-right tabular-nums",
                          )}
                        >
                          {index === 0 && "TOTAL"}
                          {col.key === "price" && money(totalPrice)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
