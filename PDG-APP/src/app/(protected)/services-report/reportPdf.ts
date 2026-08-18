import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { ReportRow, ServicesSummary } from "./api";
import {
  getColumns,
  groupByCompany,
  money,
  num,
  shortDate,
  totalsOf,
  type Align,
  type Column,
  type ReportMode,
} from "./columns";

/* ---------------------------------------------------------------- theme */

const BRAND: [number, number, number] = [87, 80, 241]; // primary #5750F1
const INK: [number, number, number] = [17, 25, 40]; // dark #111928
const MUTED: [number, number, number] = [107, 114, 128]; // gray-6
const RULE: [number, number, number] = [230, 235, 241]; // stroke
const ZEBRA: [number, number, number] = [249, 250, 251]; // gray-1

const MARGIN = 40;
const LOGO_W = 116;
const LOGO_H = 49; // 1042x441 ≈ 2.36:1

/* ---------------------------------------------------------------- logo */

/**
 * O logo vive em `public/`, mas o app é servido sob `basename="/PDG-DOM"`.
 * Sem `BASE_URL` o fetch dá 404; e jsPDF não aceita `blob:` URL — só data URL.
 */
export async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}logo-pdg.png`);
    if (!res.ok) return null;

    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- types */

export type PdfMeta = {
  mode: ReportMode;
  employeeLabel: string;
  companyLabel: string;
  plateLabel: string;
  periodLabel: string;
};

type BuildArgs = {
  rows: ReportRow[];
  summary: ServicesSummary | null;
  grandTotals: { total_quantity: number; total_amount: number; total_cost_amount?: number };
  showCosts: boolean;
  meta: PdfMeta;
  logo: string | null;
  visibleDetailColumns?: Set<string>;
};

/* ---------------------------------------------------------------- helpers */

const alignFor = (align: Align) => align;

function columnStylesFor(columns: Column[], availableWidth: number) {
  const totalWeight = columns.reduce((sum, c) => sum + c.weight, 0);

  return columns.reduce<Record<number, any>>((styles, col, index) => {
    styles[index] = {
      halign: alignFor(col.align),
      cellWidth: (col.weight / totalWeight) * availableWidth,
    };
    return styles;
  }, {});
}

function tableTheme(columns: Column[], availableWidth: number) {
  return {
    theme: "plain" as const,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.5,
      overflow: "linebreak" as const,
    },
    headStyles: {
      fillColor: INK,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: "bold" as const,
      fontSize: 8,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    footStyles: {
      fillColor: [237, 236, 254] as [number, number, number],
      textColor: INK,
      fontStyle: "bold" as const,
      lineWidth: 0,
    },
    columnStyles: columnStylesFor(columns, availableWidth),
  };
}

/** Cabeçalho do documento — só na primeira página. */
function drawHeader(pdf: jsPDF, meta: PdfMeta, logo: string | null): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const right = pageWidth - MARGIN;

  // faixa da marca
  pdf.setFillColor(...BRAND);
  pdf.rect(0, 0, pageWidth, 5, "F");

  let logoBottom = 30;

  if (logo) {
    pdf.addImage(logo, "PNG", MARGIN, 26, LOGO_W, LOGO_H);
    logoBottom = 26 + LOGO_H;
  }

  pdf.setTextColor(...INK);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(19);
  pdf.text("Services Report", right, 46, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  pdf.text(
    meta.mode === "detailed" ? "Detailed report" : "Simple report",
    right,
    61,
    { align: "right" },
  );
  pdf.text(
    `Generated ${new Date().toLocaleString("en-US")}`,
    right,
    74,
    { align: "right" },
  );

  const metaTop = Math.max(logoBottom, 82) + 14;

  // bloco de filtros aplicados
  const entries: [string, string][] = [
    ["Period", meta.periodLabel],
    ["Company", meta.companyLabel],
    ["Employee", meta.employeeLabel],
    ["Plate", meta.plateLabel],
  ];

  const colWidth = (pageWidth - MARGIN * 2) / entries.length;

  entries.forEach(([label, value], index) => {
    const x = MARGIN + colWidth * index;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED);
    pdf.text(label.toUpperCase(), x, metaTop);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...INK);
    pdf.text(
      pdf.splitTextToSize(value, colWidth - 10).slice(0, 2),
      x,
      metaTop + 13,
    );
  });

  const dividerY = metaTop + 34;
  pdf.setDrawColor(...RULE);
  pdf.setLineWidth(1);
  pdf.line(MARGIN, dividerY, pageWidth - MARGIN, dividerY);

  return dividerY + 20;
}

function drawSectionTitle(pdf: jsPDF, title: string, y: number, subtitle?: string) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...INK);
  pdf.text(title, MARGIN, y);

  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED);
    pdf.text(subtitle, pdf.internal.pageSize.getWidth() - MARGIN, y, {
      align: "right",
    });
  }

  pdf.setDrawColor(...BRAND);
  pdf.setLineWidth(2);
  pdf.line(MARGIN, y + 5, MARGIN + 26, y + 5);

  return y + 18;
}

/** Rodapé com paginação, aplicado depois que todas as páginas existem. */
function drawFooters(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const y = pageHeight - 22;

  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);

    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, y - 10, pageWidth - MARGIN, y - 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...MUTED);
    pdf.text("PDG · Services Report", MARGIN, y);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, y, {
      align: "right",
    });
  }
}

/* ------------------------------------------------------- summary blocks */

type BucketTable = {
  title: string;
  label: (bucket: any) => string;
  labelHeader: string;
  rows: any[];
};

function drawBucketTables(
  pdf: jsPDF,
  tables: BucketTable[],
  showCosts: boolean,
  startY: number,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const available = pageWidth - MARGIN * 2;

  let y = startY;

  for (const table of tables) {
    if (!table.rows.length) continue;

    // não deixa um título órfão no pé da página
    if (y > pageHeight - 120) {
      pdf.addPage();
      y = MARGIN + 10;
    }

    y = drawSectionTitle(pdf, table.title, y);

    const head = [
      [
        table.labelHeader,
        "Qty",
        "Revenue",
        ...(showCosts ? ["Cost", "Margin"] : []),
      ],
    ];

    const body = table.rows.map((bucket) => {
      const amount = num(bucket.total_amount);
      const cost = num(bucket.total_cost_amount);

      return [
        table.label(bucket),
        String(num(bucket.total_quantity)),
        money(amount),
        ...(showCosts ? [money(cost), money(amount - cost)] : []),
      ];
    });

    autoTable(pdf, {
      startY: y,
      head,
      body,
      margin: { left: MARGIN, right: MARGIN },
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
        textColor: INK,
        lineColor: RULE,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: INK,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        lineWidth: 0,
      },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: {
        0: { cellWidth: available * (showCosts ? 0.4 : 0.55), halign: "left" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    y = (pdf as any).lastAutoTable.finalY + 24;
  }

  return y;
}

function drawKeyFigures(
  pdf: jsPDF,
  summary: ServicesSummary,
  showCosts: boolean,
  startY: number,
) {
  const totals = summary.grand_totals;

  const figures: [string, string][] = [
    ["Entries", String(totals.total_entries ?? 0)],
    ["Vehicles", String(totals.distinct_vehicles ?? 0)],
    ["Days worked", String(totals.days_worked ?? 0)],
    ["Avg. ticket", money(totals.average_ticket ?? 0)],
    ["Avg. per day", money(totals.average_per_day ?? 0)],
  ];

  if (showCosts) {
    figures.push(
      ["Margin", money(totals.total_margin ?? 0)],
      ["Margin %", `${num(totals.margin_percent).toFixed(1)}%`],
    );
  }

  let y = drawSectionTitle(pdf, "Key figures", startY);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const available = pageWidth - MARGIN * 2;
  const perRow = Math.min(figures.length, 5);
  const cardW = available / perRow;
  const cardH = 44;

  figures.forEach(([label, value], index) => {
    const col = index % perRow;
    const row = Math.floor(index / perRow);
    const x = MARGIN + col * cardW;
    const cardY = y + row * (cardH + 8);

    pdf.setFillColor(...ZEBRA);
    pdf.setDrawColor(...RULE);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x + 2, cardY, cardW - 4, cardH, 4, 4, "FD");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED);
    pdf.text(label.toUpperCase(), x + 10, cardY + 15);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...INK);
    pdf.text(value, x + 10, cardY + 33);
  });

  const rowCount = Math.ceil(figures.length / perRow);
  return y + rowCount * (cardH + 8) + 16;
}

/* ---------------------------------------------------------------- build */

export function buildReportPdf({
  rows,
  summary,
  grandTotals,
  showCosts,
  meta,
  logo,
  visibleDetailColumns,
}: BuildArgs): jsPDF {
  const detailed = meta.mode === "detailed";

  const pdf = new jsPDF(detailed ? "l" : "p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const available = pageWidth - MARGIN * 2;

  let y = drawHeader(pdf, meta, logo);

  if (detailed) {
    /* uma seção por empresa, cada uma começando em página nova */
    const columns = getColumns("detailed", showCosts, false, visibleDetailColumns);
    const styles = tableTheme(columns, available);
    const groups = groupByCompany(rows);

    groups.forEach((group, index) => {
      if (index > 0) {
        pdf.addPage();
        y = MARGIN + 10;
      }

      const subtotal = totalsOf(group.rows);

      y = drawSectionTitle(
        pdf,
        group.company,
        y,
        `${group.rows.length} ${group.rows.length === 1 ? "entry" : "entries"}`,
      );

      const footCells = columns.map((col) => {
        if (col.key === "quantity") return String(subtotal.quantity);
        if (col.key === "total") return money(subtotal.amount);
        if (col.key === "cost") return money(subtotal.cost);
        if (col.key === "margin") return money(subtotal.amount - subtotal.cost);
        return "";
      });
      footCells[0] = "Subtotal";

      autoTable(pdf, {
        startY: y,
        head: [columns.map((c) => c.header)],
        body: group.rows.map((row) => columns.map((c) => c.value(row))),
        foot: [footCells],
        margin: { left: MARGIN, right: MARGIN, bottom: 50 },
        ...styles,
      });

      y = (pdf as any).lastAutoTable.finalY + 26;
    });

    /* blocos de sumário, sempre em página própria */
    if (summary) {
      pdf.addPage();
      y = MARGIN + 10;

      y = drawKeyFigures(pdf, summary, showCosts, y);

      y = drawBucketTables(
        pdf,
        [
          {
            title: "Totals by company",
            labelHeader: "Company",
            label: (b) => b.company_name ?? "—",
            rows: summary.totals_by_company ?? [],
          },
          {
            title: "Totals by employee",
            labelHeader: "Employee",
            label: (b) => b.display_name ?? b.full_name ?? "—",
            rows: summary.totals_by_user ?? [],
          },
          {
            title: "Totals by service",
            labelHeader: "Service",
            label: (b) => b.service_type ?? "—",
            rows: summary.totals_by_service ?? [],
          },
          {
            title: "Totals by department",
            labelHeader: "Department",
            label: (b) => b.department_name ?? "—",
            rows: summary.totals_by_department ?? [],
          },
          {
            title: "Totals by vehicle condition",
            labelHeader: "Condition",
            label: (b) => b.vehicle_condition ?? "—",
            rows: summary.totals_by_condition ?? [],
          },
          {
            title: "Totals by day",
            labelHeader: "Date",
            label: (b) => shortDate(b.performed_at),
            rows: summary.totals_by_day ?? [],
          },
        ],
        showCosts,
        y,
      );
    }
  } else {
    /* tabela contínua única */
    const columns = getColumns("simple", showCosts, true);
    const styles = tableTheme(columns, available);

    const footCells = columns.map((col) => {
      if (col.key === "quantity") return String(grandTotals.total_quantity ?? 0);
      if (col.key === "total") return money(grandTotals.total_amount);
      if (col.key === "cost") return money(grandTotals.total_cost_amount);
      return "";
    });
    footCells[0] = "TOTAL";

    autoTable(pdf, {
      startY: y,
      head: [columns.map((c) => c.header)],
      body: rows.map((row) => columns.map((c) => c.value(row))),
      foot: [footCells],
      margin: { left: MARGIN, right: MARGIN, bottom: 50 },
      ...styles,
    });
  }

  drawFooters(pdf);

  return pdf;
}
