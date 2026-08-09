import { API_BASE_URL } from "@/lib/api";

export type ReportFilters = {
  user_id?: number;
  company_id?: number;
  plate?: string;
  date_from?: string;
  date_to?: string;
  date?: string;
  per_page?: number;
};

export type ReportRow = {
  company_id: number;
  company_name: string;
  user_id: number;
  display_name?: string | null;
  full_name?: string | null;
  service_id: number;
  service_type: string;
  service_description?: string | null;
  service_unit_value: string | number;
  service_unit_cost_value?: string | number | null;
  department_name?: string | null;
  car_plate?: string | null;
  vehicle_condition?: string | null;
  stock_number?: string | null;
  notes?: string | null;
  performed_at: string;
  total_quantity: string | number;
  total_amount: string | number;
  total_cost_amount?: string | number | null;
};

export type GrandTotals = {
  total_quantity: number;
  total_amount: number;
  total_cost_amount?: number;
};

export type ServicesReport = {
  data: ReportRow[];
  grand_totals: GrandTotals;
  can_see_costs: boolean;
  /** true quando nem todas as linhas do filtro couberam na resposta */
  truncated?: boolean;
};

export type SummaryBucket = {
  company_name?: string;
  display_name?: string | null;
  full_name?: string | null;
  service_type?: string;
  service_description?: string | null;
  department_name?: string | null;
  performed_at?: string;
  vehicle_condition?: string | null;
  total_quantity: string | number;
  total_amount: string | number;
  total_cost_amount?: string | number | null;
};

export type ServicesSummary = {
  totals_by_company: SummaryBucket[];
  totals_by_user: SummaryBucket[];
  totals_by_service: SummaryBucket[];
  totals_by_department: SummaryBucket[];
  totals_by_day: SummaryBucket[];
  totals_by_condition: SummaryBucket[];
  grand_totals: GrandTotals & {
    total_entries: number;
    distinct_vehicles: number;
    days_worked: number;
    average_ticket: number;
    average_per_day: number;
    total_margin?: number;
    margin_percent?: number;
  };
  can_see_costs: boolean;
};

const MAX_PER_PAGE = 200;
/** Teto de segurança para não travar o navegador com um filtro muito aberto. */
const MAX_PAGES = 25;

function authHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function toQueryString(params: ReportFilters) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  });

  return qs.toString();
}

/**
 * Busca o relatório completo, percorrendo todas as páginas do paginator.
 * A versão antiga exportava só a primeira página (50 linhas) sem avisar.
 */
export async function fetchReportServices(
  params: ReportFilters = {},
): Promise<ServicesReport> {
  const rows: ReportRow[] = [];

  let page = 1;
  let lastPage = 1;
  let first: any = null;

  do {
    const qs = toQueryString({ ...params, per_page: MAX_PER_PAGE });

    const res = await fetch(
      `${API_BASE_URL}/reports/services?${qs}&page=${page}`,
      { headers: authHeaders() },
    );

    if (!res.ok) {
      throw new Error(`Failed to load report (${res.status})`);
    }

    const json = await res.json();

    if (page === 1) first = json;

    rows.push(...(json.data ?? []));
    lastPage = Number(json.last_page ?? 1);
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return {
    data: rows,
    grand_totals: first?.grand_totals ?? { total_quantity: 0, total_amount: 0 },
    can_see_costs: Boolean(first?.can_see_costs),
    truncated: lastPage > MAX_PAGES,
  };
}

export async function fetchReportSummary(
  params: ReportFilters = {},
): Promise<ServicesSummary> {
  const res = await fetch(
    `${API_BASE_URL}/reports/services/summary?${toQueryString(params)}`,
    { headers: authHeaders() },
  );

  if (!res.ok) {
    throw new Error(`Failed to load summary (${res.status})`);
  }

  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders() });
  const data = await res.json();
  return data.data ?? [];
}

export async function fetchCompanies() {
  const res = await fetch(`${API_BASE_URL}/companies`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  return data.data ?? [];
}
