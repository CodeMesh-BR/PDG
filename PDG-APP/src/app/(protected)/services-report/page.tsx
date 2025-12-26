"use client";

import { useEffect, useState } from "react";
import { fetchUsers, fetchReportServices, ReportFilters } from "./api";
import { Button } from "@/components/ui-elements/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ServicesReportPage() {
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    fetchUsers().then(setUsers);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    })
      .then((r) => r.json())
      .then((r) => setCompanies(r.data ?? []));
  }, []);

  const generateReport = async () => {
    setLoading(true);
    const data = await fetchReportServices(filters);
    setReport(data);
    setLoading(false);
  };

  const exportCSV = () => {
    if (!report?.data) return;
    const rows = report.data.map((r: any) => [
      r.performed_at.slice(0, 10),
      r.company_name,
      r.display_name ?? r.full_name ?? "—",
      r.car_plate ?? "—", // NOVO
      r.service_type,
      r.total_quantity,
      Number(r.total_amount).toFixed(2),
    ]);

    const csv = [
      ["Date", "Company", "Employee", "Plate", "Service", "Quantity", "Total"],
      ...rows,
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const stamp = new Date().toLocaleDateString("en-US").replace(/\//g, "-");
    a.download = `services_report_${stamp}.csv`;
    a.click();
  };

  /* ---------------- PDF ---------------- */
  const exportPDF = async () => {
    if (!report?.data) return;

    const pdf = new jsPDF("p", "pt");

    try {
      const logo = await fetch("/logo-pdg.png")
        .then((r) => r.blob())
        .then((blob) => URL.createObjectURL(blob));

      pdf.addImage(logo, "PNG", 40, 30, 120, 50);
    } catch {
      pdf.text("<< LOGO MISSING >>", 40, 50);
    }
    pdf.setFontSize(20);
    pdf.text("Services Report", 200, 50);
    pdf.setFontSize(10);

    const stamp = new Date().toLocaleString("en-US");
    pdf.text(`Generated: ${stamp}`, 200, 70);

    pdf.setFontSize(11);
    pdf.text(`Filters:`, 40, 105);

    pdf.setFontSize(10);
    pdf.text(
      `Employee: ${filters.user_id ? (users.find((u) => u.id == filters.user_id)?.display_name ?? "N/A") : "All"}`,
      40,
      120,
    );
    pdf.text(
      `Company: ${filters.company_id ? (companies.find((c) => c.id == filters.company_id)?.display_name ?? "N/A") : "All"}`,
      40,
      135,
    );
    filters.date_from &&
      pdf.text(
        `Date Range: ${filters.date_from || "-"} → ${filters.date_to || "-"}`,
        40,
        150,
      );

    /* Divider */
    pdf.setLineWidth(1);
    pdf.line(40, 165, 550, 165);

    autoTable(pdf, {
      startY: 185,
      head: [
        ["Date", "Company", "Employee", "Plate", "Service", "Qty", "Total"],
      ],

      theme: "grid",
      body: report.data.map((r: any) => [
        r.performed_at.slice(0, 10),
        r.company_name,
        r.display_name ?? r.full_name ?? "—",
        r.car_plate ?? "—", // NOVO
        r.service_type,
        r.total_quantity,
        Number(r.total_amount).toFixed(2),
      ]),
    });

    const endY = (pdf as any).lastAutoTable.finalY;

    pdf.setFontSize(13);
    pdf.text("Summary", 40, endY + 30);

    pdf.setFontSize(11);
    pdf.text(
      `Total Quantity: ${report.grand_totals.total_quantity}`,
      40,
      endY + 50,
    );
    pdf.text(
      `Total Amount: $${Number(report.grand_totals.total_amount).toFixed(2)}`,
      40,
      endY + 70,
    );

    const dateSlug = new Date().toISOString().split("T")[0];
    pdf.save(`services_report_${dateSlug}.pdf`);
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Services Report</h1>

      {/* FILTER CARD */}
      <div className="mb-10 rounded-xl border bg-gray-50 p-6 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-semibold">Filters</h2>

        {/* employee */}
        <label className="text-sm font-medium">Employee</label>
        <select
          className="mb-4 w-full rounded border bg-white p-2 dark:bg-gray-800"
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

        {/* company */}
        <label className="text-sm font-medium">Company</label>
        <select
          className="mb-4 w-full rounded border bg-white p-2 dark:bg-gray-800"
          value={filters.company_id ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              company_id: e.target.value ? Number(e.target.value) : undefined,
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

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">From</label>
            <input
              type="date"
              className="w-full rounded border bg-white p-2 dark:bg-gray-800"
              value={filters.date_from ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, date_from: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <input
              type="date"
              className="w-full rounded border bg-white p-2 dark:bg-gray-800"
              value={filters.date_to ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, date_to: e.target.value }))
              }
            />
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          label="Generate Report"
          onClick={generateReport}
        />
      </div>

      {loading && <p className="text-center text-gray-500">Loading...</p>}

      {report && (
        <>
          {/* summary */}
          <div className="mb-6 rounded-xl border bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold">Summary</h2>
            <p>
              Total quantity: <b>{report.grand_totals.total_quantity}</b>
            </p>
            <p>
              Total revenue:{" "}
              <b>${Number(report.grand_totals.total_amount).toFixed(2)}</b>
            </p>

            <div className="mt-4 flex gap-4">
              <Button label="Export CSV" onClick={exportCSV} />
              <Button label="Export PDF" variant="dark" onClick={exportPDF} />
            </div>
          </div>

          {/* table */}
          <div className="overflow-auto rounded-xl border shadow-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-200 text-left text-gray-800 dark:bg-gray-700 dark:text-white">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Plate</th>
                  <th className="p-3">Service</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((r: any, i: number) => (
                  <tr key={i} className="odd:bg-gray-50 dark:odd:bg-gray-800">
                    <td className="p-3">{r.performed_at.slice(0, 10)}</td>
                    <td className="p-3">
                      {r.display_name ?? r.full_name ?? "—"}
                    </td>
                    <td className="p-3">{r.company_name}</td>
                    <td className="p-3">{r.car_plate ?? "—"}</td>
                    <td className="p-3">{r.service_type}</td>
                    <td className="p-3 text-center">{r.total_quantity}</td>
                    <td className="p-3 text-right">
                      ${Number(r.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FOOTER TOTALS */}
              <tfoot>
                <tr className="bg-gray-100 text-left font-semibold dark:bg-gray-700">
                  <td className="p-3">TOTAL</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="p-3 text-center">
                    {report.grand_totals.total_quantity}
                  </td>
                  <td className="p-3 text-right">
                    ${Number(report.grand_totals.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
