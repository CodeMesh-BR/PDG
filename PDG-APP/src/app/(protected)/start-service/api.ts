"use client";

import {
  Company,
  Service,
  Paginated,
  OcrResponse,
  ServiceLog,
  StartServicePayload,
  StartServiceResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface RequestResult<T> {
  status: number;
  data: T | null;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<RequestResult<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  let data: T | null = null;
  try {
    data = (await res.json()) as T;
  } catch {
    data = null;
  }

  return {
    status: res.status,
    data,
  };
}


export async function sendOcrImage(
  file: File
): Promise<{ status: number; data: OcrResponse | null }> {
  const form = new FormData();
  form.append("image", file);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}/plate-ocr`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  let data: OcrResponse | null = null;
  try {
    data = (await res.json()) as OcrResponse;
  } catch {
    data = null;
  }

  return {
    status: res.status,
    data,
  };
}

export async function startServiceLog(
  payload: StartServicePayload
): Promise<RequestResult<StartServiceResponse>> {
  const date = payload.date.slice(0, 10);

  return request<StartServiceResponse>(`${API_URL}/service-logs`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      date,
    }),
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}


export async function fetchCompanies(): Promise<Paginated<Company>> {
  const res = await request<Paginated<Company>>(`${API_URL}/companies`, {
    headers: authHeaders(),
  });

  return (
    res.data ?? {
      data: [],
      total: 0,
      current_page: 1,
      last_page: 1,
    }
  );
}

export async function fetchCompanyServices(
  companyId: number
): Promise<Service[]> {
  const res = await request<{ data: Company }>(
    `${API_URL}/companies/${companyId}`,
    {
      headers: authHeaders(),
    }
  );

  return res.data?.data?.services ?? [];
}

export async function fetchServiceLogs(date: string): Promise<{
  total: number;
  data: ServiceLog[];
}> {
  const day = date.slice(0, 10);

  const res = await request<Paginated<ServiceLog>>(
    `${API_URL}/service-logs?date=${day}`,
    {
      headers: authHeaders(),
    }
  );

  return {
    total: res.data?.total ?? 0,
    data: res.data?.data ?? [],
  };
}

export async function deleteServiceLog(id: number) {
  return fetch(`${API_URL}/service-logs/${id}`, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
      Accept: "application/json",
    },
  });
}

export async function fetchServiceLog(id: number): Promise<ServiceLog | null> {
  const res = await request<{ data: ServiceLog }>(`${API_URL}/service-logs/${id}`, {
    headers: authHeaders(),
  });

  return res.data?.data ?? null;
}

export async function updateServiceLog(
  id: number,
  payload: Partial<Omit<ServiceLog, "id">>
) {
  return request(`${API_URL}/service-logs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}
