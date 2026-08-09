import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui-elements/button";
import { canSeeCosts, getStoredRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import {
  fetchCompanies,
  fetchReportServices,
  fetchReportSummary,
  fetchUsers,
  type ReportFilters,
  type ServicesReport,
  type ServicesSummary,
} from "./api";
import { getColumns, money, num, type ReportMode } from "./columns";
import { buildReportPdf, loadLogoDataUrl, type PdfMeta } from "./reportPdf";
import { SummaryBlocks } from "./SummaryBlocks";

const MODES: { value: ReportMode; label: string; hint: string }[] = [
  { value: "simple", label: "Simple", hint: "Date, company, employee, service and totals." },
  {
    value: "detailed",
    label: "Detailed",
    hint: "Adds stock number, condition, department, unit values, margin, notes and breakdowns.",
  },
];

function labelForPeriod(filters: ReportFilters) {
  if (!filters.date_from && !filters.date_to) return "All time";
  return `${filters.date_from || "—"} → ${filters.date_to || "—"}`;
}

export default function ServicesReportPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  const [filters, setFilters] = useState<ReportFilters>({});
  /** filtros que produziram o relatório atualmente na tela */
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>({});

  const [mode, setMode] = useState<ReportMode>("simple");
  const [report, setReport] = useState<ServicesReport | null>(null);
  const [summary, setSummary] = useState<ServicesSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  /** evita re-tentar em loop quando a busca dos agrupamentos falha */
  const [summaryRequested, setSummaryRequested] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCosts, setShowCosts] = useState(true);

  useEffect(() => {
    setMounted(true);
    setShowCosts(canSeeCosts(getStoredRole()));

    fetchUsers().then(setUsers).catch(() => setUsers([]));
    fetchCompanies().then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const loadSummary = useCallback(async (target: ReportFilters) => {
    setSummaryRequested(true);
    setLoadingSummary(true);
    try {
      setSummary(await fetchReportSummary(target));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load the breakdowns.");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    setSummaryRequested(false);

    try {
      const data = await fetchReportServices(filters);
      setReport(data);
      setAppliedFilters(filters);

      if (mode === "detailed") await loadSummary(filters);
    } catch (e: any) {
      setReport(null);
      setError(e?.message ?? "Failed to generate the report.");
    } finally {
      setLoading(false);
    }
  };

  // ao alternar para o modo detalhado com um relatório já na tela,
  // busca os agrupamentos correspondentes aos filtros aplicados
  useEffect(() => {
    if (mode === "detailed" && report && !summaryRequested) {
      loadSummary(appliedFilters);
    }
  }, [mode, report, summaryRequested, appliedFilters, loadSummary]);

  const columns = useMemo(
    () => getColumns(mode, showCosts, true),
    [mode, showCosts],
  );

  const rows = report?.data ?? [];
  const totals = report?.grand_totals;

  const pdfMeta: PdfMeta = useMemo(
    () => ({
      mode,
      periodLabel: labelForPeriod(appliedFilters),
      companyLabel: appliedFilters.company_id
        ? (companies.find((c) => c.id == appliedFilters.company_id)?.display_name ??
          companies.find((c) => c.id == appliedFilters.company_id)?.name ??
          "—")
        : "All companies",
      employeeLabel: appliedFilters.user_id
        ? (users.find((u) => u.id == appliedFilters.user_id)?.display_name ??
          users.find((u) => u.id == appliedFilters.user_id)?.full_name ??
          "—")
        : "All employees",
      plateLabel: appliedFilters.plate || "Any plate",
    }),
    [mode, appliedFilters, companies, users],
  );

  const fileStamp = new Date().toISOString().slice(0, 10);

  const exportCSV = () => {
    if (!rows.length) return;

    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const csv = [
      columns.map((c) => escape(c.header)),
      ...rows.map((row) => columns.map((c) => escape((c.raw ?? c.value)(row)))),
    ]
      .map((line) => line.join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `services_report_${mode}_${fileStamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    if (!rows.length || !totals) return;

    setExporting(true);
    try {
      let breakdowns = summary;
      if (mode === "detailed" && !breakdowns) {
        breakdowns = await fetchReportSummary(appliedFilters);
        setSummary(breakdowns);
      }

      const logo = await loadLogoDataUrl();

      const pdf = buildReportPdf({
        rows,
        summary: breakdowns,
        grandTotals: totals,
        showCosts,
        meta: pdfMeta,
        logo,
      });

      pdf.save(`services_report_${mode}_${fileStamp}.pdf`);
    } catch (e: any) {
      setError(e?.message ?? "Failed to build the PDF.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => setFilters({});

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
          Services Report
        </h1>
        <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
          Filter the service logs and export them as CSV or PDF.
        </p>
      </header>

      {/* ------------------------------------------------------- filters */}
      <section className={cn(cardClass, "mb-6 p-5 md:p-6")}>
        <h2 className="mb-4 text-base font-semibold text-dark dark:text-white">
          Filters
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={labelClass}>Employee</label>
            <select
              className={inputClass}
              value={filters.user_id ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  user_id: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">All employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name ?? u.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Company</label>
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
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name ?? c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Plate</label>
            <input
              className={inputClass}
              value={filters.plate ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, plate: e.target.value || undefined }))
              }
              placeholder="Search by plate"
            />
          </div>

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

      {report && !loading && (
        <>
          {/* --------------------------------------------------- toolbar */}
          <section className={cn(cardClass, "mb-6 p-5 md:p-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className={labelClass}>Report type</span>
                <div className="inline-flex rounded-lg border border-stroke bg-gray-1 p-1 dark:border-stroke-dark dark:bg-dark-2">
                  {MODES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      aria-pressed={mode === option.value}
                      className={cn(
                        "rounded-md px-5 py-2 text-sm font-medium transition",
                        mode === option.value
                          ? "bg-primary text-white shadow-sm"
                          : "text-dark-5 hover:text-dark dark:text-dark-6 dark:hover:text-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 max-w-md text-xs text-dark-5 dark:text-dark-6">
                  {MODES.find((m) => m.value === mode)?.hint}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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

            {/* KPIs */}
            <dl className="mt-6 grid gap-4 border-t border-stroke pt-5 dark:border-stroke-dark sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Entries" value={String(rows.length)} />
              <Stat
                label="Total quantity"
                value={String(totals?.total_quantity ?? 0)}
              />
              <Stat
                label="Total revenue"
                value={money(totals?.total_amount)}
                accent
              />
              {showCosts && (
                <Stat label="Total cost" value={money(totals?.total_cost_amount)} />
              )}
            </dl>

            <p className="mt-4 text-xs text-dark-5 dark:text-dark-6">
              Period: {labelForPeriod(appliedFilters)} · {pdfMeta.companyLabel} ·{" "}
              {pdfMeta.employeeLabel}
            </p>

            {report.truncated && (
              <p className="mt-2 text-xs font-medium text-red">
                Too many rows for a single export — narrow the date range to
                include everything.
              </p>
            )}
          </section>

          {/* ------------------------------------------------ breakdowns */}
          {mode === "detailed" && (
            <SummaryBlocks
              summary={summary}
              loading={loadingSummary}
              showCosts={showCosts}
            />
          )}

          {/* ----------------------------------------------------- table */}
          <section className={cn(cardClass, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-dark text-left text-white">
                  <tr>
                    {columns.map((col) => (
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
                        colSpan={columns.length}
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
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-dark dark:text-white",
                            col.align === "right" && "text-right tabular-nums",
                            col.align === "center" && "text-center",
                            col.key === "notes" && "max-w-xs",
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
                      {columns.map((col, index) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-dark dark:text-white",
                            col.align === "right" && "text-right tabular-nums",
                            col.align === "center" && "text-center",
                          )}
                        >
                          {index === 0 && "TOTAL"}
                          {col.key === "quantity" &&
                            String(totals?.total_quantity ?? 0)}
                          {col.key === "total" && money(totals?.total_amount)}
                          {col.key === "cost" &&
                            money(totals?.total_cost_amount)}
                          {col.key === "margin" &&
                            money(
                              num(totals?.total_amount) -
                                num(totals?.total_cost_amount),
                            )}
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

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-dark-5 dark:text-dark-6">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          accent ? "text-primary" : "text-dark dark:text-white",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
