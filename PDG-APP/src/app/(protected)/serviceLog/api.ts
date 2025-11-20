const API_URL = "http://localhost:8080/api";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

/**
 * Helper que SEMPRE retorna:
 * { status: number, data: any }
 */
async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {}

  return {
    status: res.status,
    data,
  };
}

/* ------------------------------------------
   OCR
-------------------------------------------*/
export async function sendOcrImage(file: File) {
  const form = new FormData();
  form.append("image", file);

  return request(`${API_URL}/plate-ocr`, {
    method: "POST",
    body: form,
    headers: authHeaders(),
  });
}

/* ------------------------------------------
   START SERVICE LOG
-------------------------------------------*/
export async function startServiceLog(payload: any) {
  return request(`${API_URL}/service-logs`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
  });
}

/* ------------------------------------------
   COMPANIES
-------------------------------------------*/
export async function fetchCompanies() {
  return request(`${API_URL}/companies`, {
    headers: authHeaders(),
  });
}

export async function fetchCompanyServices(companyId: number) {
  const res = await request(`${API_URL}/companies/${companyId}`, {
    headers: authHeaders(),
  });

  return res.data?.data?.services ?? [];
}

/* ------------------------------------------
   TODAY LOGS
-------------------------------------------*/
export async function fetchTodayLogs() {
  const today = new Date().toISOString().slice(0, 10);

  const result = await request(`${API_URL}/service-logs?date=${today}`, {
    headers: authHeaders(),
  });

  return {
    total: result.data?.total ?? 0,
    data: result.data?.data ?? [],
  };
}
