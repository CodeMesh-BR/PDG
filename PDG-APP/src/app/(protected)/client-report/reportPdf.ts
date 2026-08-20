import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { ClientReportRow } from "./api";
import { COLUMNS, money, type Column } from "./columns";

export { loadLogoDataUrl } from "../services-report/reportPdf";

const BRAND: [number, number, number] = [87, 80, 241];
const INK: [number, number, number] = [17, 25, 40];
const MUTED: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [230, 235, 241];
const ZEBRA: [number, number, number] = [249, 250, 251];

const MARGIN = 40;
const LOGO_W = 116;
const LOGO_H = 49;

function columnStylesFor(columns: Column[], availableWidth: number) {
  const totalWeight = columns.reduce((sum, c) => sum + c.weight, 0);

  return columns.reduce<Record<number, any>>((styles, col, index) => {
    styles[index] = {
      halign: col.align,
      cellWidth: (col.weight / totalWeight) * availableWidth,
    };
    return styles;
  }, {});
}

function drawHeader(
  pdf: jsPDF,
  periodLabel: string,
  storeLabel: string,
  logo: string | null,
): number {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const right = pageWidth - MARGIN;

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
  pdf.text("Client Report", right, 46, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...MUTED);
  pdf.text(`Generated ${new Date().toLocaleString("en-US")}`, right, 61, {
    align: "right",
  });

  const metaTop = Math.max(logoBottom, 82) + 14;

  const entries: [string, string][] = [
    ["Period", periodLabel],
    ["Store", storeLabel],
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
    pdf.text(value, x, metaTop + 13);
  });

  const dividerY = metaTop + 34;
  pdf.setDrawColor(...RULE);
  pdf.setLineWidth(1);
  pdf.line(MARGIN, dividerY, pageWidth - MARGIN, dividerY);

  return dividerY + 20;
}

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
    pdf.text("PDG · Client Report", MARGIN, y);
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - MARGIN, y, {
      align: "right",
    });
  }
}

export function buildClientReportPdf({
  rows,
  periodLabel,
  storeLabel,
  logo,
}: {
  rows: ClientReportRow[];
  periodLabel: string;
  storeLabel: string;
  logo: string | null;
}): jsPDF {
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const available = pageWidth - MARGIN * 2;

  const y = drawHeader(pdf, periodLabel, storeLabel, logo);

  const totalPrice = rows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);
  const footCells = COLUMNS.map((col) =>
    col.key === "price" ? money(totalPrice) : "",
  );
  footCells[0] = "TOTAL";

  autoTable(pdf, {
    startY: y,
    head: [COLUMNS.map((c) => c.header)],
    body: rows.map((row) => COLUMNS.map((c) => c.value(row))),
    foot: [footCells],
    margin: { left: MARGIN, right: MARGIN, bottom: 50 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: INK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: ZEBRA },
    footStyles: {
      fillColor: [237, 236, 254],
      textColor: INK,
      fontStyle: "bold",
      lineWidth: 0,
    },
    columnStyles: columnStylesFor(COLUMNS, available),
  });

  drawFooters(pdf);

  return pdf;
}
