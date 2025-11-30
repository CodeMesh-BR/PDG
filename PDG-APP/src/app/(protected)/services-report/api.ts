"use client";

export type ReportFilters = {
  user_id?: number;
  company_id?: number;
  date_from?: string;
  date_to?: string;
  date?: string;
  per_page?: number;
};

export async function fetchReportServices(params: ReportFilters = {}) {
  const qs = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.append(key, String(value));
  });

  const token = localStorage.getItem("token");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/services?` + qs.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    }
  });

  return res.json();
}

export async function fetchUsers() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    }
  });

  const data = await res.json();
  return data.data ?? []; // lista paginada
}
