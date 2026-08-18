import type { ReportRow } from "./api";

export type ReportMode = "simple" | "detailed";

export type Align = "left" | "center" | "right";

export type Column = {
  key: string;
  header: string;
  align: Align;
  /** largura relativa usada para distribuir as colunas do PDF */
  weight: number;
  value: (row: ReportRow) => string;
  /** valor numérico cru, para o CSV não carregar "$" e vírgulas */
  raw?: (row: ReportRow) => string;
};

export const num = (v: unknown) => Number(v ?? 0);

export const money = (v: unknown) =>
  num(v).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export const shortDate = (v?: string | null) => (v ? String(v).slice(0, 10) : "—");

export const employeeName = (row: ReportRow) =>
  row.display_name ?? row.full_name ?? "—";

export const rowMargin = (row: ReportRow) =>
  num(row.total_amount) - num(row.total_cost_amount);

const dash = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? "—" : s;
};

const condition = (v?: string | null) => {
  const s = (v ?? "").toLowerCase();
  if (s === "new") return "New";
  if (s === "used") return "Used";
  return dash(v);
};

/** Colunas extras do modo detalhado que o usuário pode ligar/desligar. */
export const DETAILED_COLUMN_OPTIONS: {
  key: string;
  label: string;
  costOnly?: boolean;
}[] = [
  { key: "stock_number", label: "Stock #" },
  { key: "vehicle_condition", label: "Condition" },
  { key: "department", label: "Department" },
  { key: "service_description", label: "Description" },
  { key: "unit_value", label: "Unit value" },
  { key: "unit_cost", label: "Unit cost", costOnly: true },
  { key: "margin", label: "Margin", costOnly: true },
  { key: "notes", label: "Notes" },
];

export const defaultVisibleDetailedKeys = (showCosts: boolean) =>
  new Set(
    DETAILED_COLUMN_OPTIONS.filter((o) => !o.costOnly || showCosts).map(
      (o) => o.key,
    ),
  );

/**
 * Colunas do relatório. `includeCompany` fica falso no PDF detalhado, onde a
 * empresa vira o título da seção em vez de repetir em cada linha.
 * `visibleDetailKeys` filtra as colunas extras do modo detalhado; quando
 * omitido, todas entram (comportamento original).
 */
export function getColumns(
  mode: ReportMode,
  showCosts: boolean,
  includeCompany = true,
  visibleDetailKeys?: Set<string>,
): Column[] {
  const showDetail = (key: string) =>
    !visibleDetailKeys || visibleDetailKeys.has(key);

  const cols: Column[] = [
    {
      key: "date",
      header: "Date",
      align: "left",
      weight: 1.1,
      value: (r) => shortDate(r.performed_at),
    },
  ];

  if (includeCompany) {
    cols.push({
      key: "company",
      header: "Company",
      align: "left",
      weight: 1.6,
      value: (r) => dash(r.company_name),
    });
  }

  cols.push(
    {
      key: "employee",
      header: "Employee",
      align: "left",
      weight: 1.5,
      value: employeeName,
    },
    {
      key: "plate",
      header: "Plate",
      align: "left",
      weight: 1,
      value: (r) => dash(r.car_plate),
    },
  );

  if (mode === "detailed") {
    if (showDetail("stock_number")) {
      cols.push({
        key: "stock_number",
        header: "Stock #",
        align: "left",
        weight: 1,
        value: (r) => dash(r.stock_number),
      });
    }
    if (showDetail("vehicle_condition")) {
      cols.push({
        key: "vehicle_condition",
        header: "Cond.",
        align: "center",
        weight: 0.7,
        value: (r) => condition(r.vehicle_condition),
      });
    }
    if (showDetail("department")) {
      cols.push({
        key: "department",
        header: "Department",
        align: "left",
        weight: 1.3,
        value: (r) => dash(r.department_name),
      });
    }
  }

  cols.push({
    key: "service",
    header: "Service",
    align: "left",
    weight: 1.6,
    value: (r) => dash(r.service_type),
  });

  if (mode === "detailed") {
    if (showDetail("service_description")) {
      cols.push({
        key: "service_description",
        header: "Description",
        align: "left",
        weight: 2,
        value: (r) => dash(r.service_description),
      });
    }
    if (showDetail("unit_value")) {
      cols.push({
        key: "unit_value",
        header: "Unit",
        align: "right",
        weight: 0.9,
        value: (r) => money(r.service_unit_value),
        raw: (r) => num(r.service_unit_value).toFixed(2),
      });
    }
  }

  cols.push(
    {
      key: "quantity",
      header: "Qty",
      align: "center",
      weight: 0.6,
      value: (r) => String(num(r.total_quantity)),
      raw: (r) => String(num(r.total_quantity)),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      weight: 1,
      value: (r) => money(r.total_amount),
      raw: (r) => num(r.total_amount).toFixed(2),
    },
  );

  if (showCosts) {
    if (mode === "detailed" && showDetail("unit_cost")) {
      cols.push({
        key: "unit_cost",
        header: "Unit Cost",
        align: "right",
        weight: 0.9,
        value: (r) => money(r.service_unit_cost_value),
        raw: (r) => num(r.service_unit_cost_value).toFixed(2),
      });
    }

    cols.push({
      key: "cost",
      header: "Cost",
      align: "right",
      weight: 1,
      value: (r) => money(r.total_cost_amount),
      raw: (r) => num(r.total_cost_amount).toFixed(2),
    });

    if (mode === "detailed" && showDetail("margin")) {
      cols.push({
        key: "margin",
        header: "Margin",
        align: "right",
        weight: 1,
        value: (r) => money(rowMargin(r)),
        raw: (r) => rowMargin(r).toFixed(2),
      });
    }
  }

  if (mode === "detailed" && showDetail("notes")) {
    cols.push({
      key: "notes",
      header: "Notes",
      align: "left",
      weight: 2,
      value: (r) => dash(r.notes),
    });
  }

  return cols;
}

/** Totais de um subconjunto de linhas (usado nos subtotais por empresa). */
export function totalsOf(rows: ReportRow[]) {
  return rows.reduce(
    (acc, r) => ({
      quantity: acc.quantity + num(r.total_quantity),
      amount: acc.amount + num(r.total_amount),
      cost: acc.cost + num(r.total_cost_amount),
    }),
    { quantity: 0, amount: 0, cost: 0 },
  );
}

/** Agrupa as linhas por empresa, preservando a ordem alfabética. */
export function groupByCompany(rows: ReportRow[]) {
  const groups = new Map<string, ReportRow[]>();

  for (const row of rows) {
    const key = row.company_name ?? "—";
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([company, companyRows]) => ({ company, rows: companyRows }));
}
