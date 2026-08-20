import { apiUrl } from "@/lib/api";

export type ClientReportFilters = {
  company_id?: number;
  date_from?: string;
  date_to?: string;
  per_page?: number;
};

export type ClientReportRow = {
  price: string | number;
  service_name: string;
  stock_number: string | null;
  plate: string | null;
  store: string;
  department: string | null;
};

export type ClientReport = {
  data: ClientReportRow[];
  /** true when not every row of the filtered set fit in the response */
  truncated?: boolean;
};

export type MyCompany = { id: number; display_name: string };

const MAX_PER_PAGE = 200;
/** Safety cap so a wide-open filter can't hang the browser. */
const MAX_PAGES = 25;

function authHeaders() {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

function toQueryString(params: ClientReportFilters) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  });

  return qs.toString();
}

/** Fetches the full report, walking every page of the paginator. */
export async function fetchClientReport(
  params: ClientReportFilters = {},
): Promise<ClientReport> {
  const rows: ClientReportRow[] = [];

  let page = 1;
  let lastPage = 1;

  do {
    const qs = toQueryString({ ...params, per_page: MAX_PER_PAGE });

    const res = await fetch(`${apiUrl("/reports/client")}?${qs}&page=${page}`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to load report (${res.status})`);
    }

    const json = await res.json();

    rows.push(...(json.data ?? []));
    lastPage = Number(json.last_page ?? 1);
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { data: rows, truncated: lastPage > MAX_PAGES };
}

/** The linked companies for the logged-in client, from /auth/me. */
export async function fetchMyCompanies(): Promise<MyCompany[]> {
  const res = await fetch(apiUrl("/auth/me"), { headers: authHeaders() });
  if (!res.ok) return [];

  const json = await res.json();
  return json?.data?.companies ?? [];
}
