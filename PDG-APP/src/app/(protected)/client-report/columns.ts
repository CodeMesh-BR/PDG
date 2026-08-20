import type { ClientReportRow } from "./api";

export type Align = "left" | "center" | "right";

export type Column = {
  key: string;
  header: string;
  align: Align;
  /** relative width used to distribute PDF columns */
  weight: number;
  value: (row: ClientReportRow) => string;
  /** raw numeric value, so CSV doesn't carry currency formatting */
  raw?: (row: ClientReportRow) => string;
};

export const num = (v: unknown) => Number(v ?? 0);

export const money = (v: unknown) =>
  num(v).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const dash = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? "—" : s;
};

export const COLUMNS: Column[] = [
  {
    key: "service_name",
    header: "Service",
    align: "left",
    weight: 2,
    value: (r) => dash(r.service_name),
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    weight: 1,
    value: (r) => money(r.price),
    raw: (r) => String(num(r.price)),
  },
  {
    key: "stock_number",
    header: "Stock #",
    align: "left",
    weight: 1,
    value: (r) => dash(r.stock_number),
  },
  {
    key: "plate",
    header: "Plate",
    align: "left",
    weight: 1,
    value: (r) => dash(r.plate),
  },
  {
    key: "store",
    header: "Store",
    align: "left",
    weight: 1.5,
    value: (r) => dash(r.store),
  },
  {
    key: "department",
    header: "Department",
    align: "left",
    weight: 1.5,
    value: (r) => dash(r.department),
  },
];
