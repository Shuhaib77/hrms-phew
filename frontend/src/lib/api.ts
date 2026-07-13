const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  pagination?: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
  error?: { code: string; message: string; details?: unknown };
  timestamp: string;
}

export interface ApiResult<T> {
  data: T;
  pagination?: ApiResponse['pagination'];
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const store = localStorage.getItem('phew-hrms-auth');
    if (store) {
      const parsed = JSON.parse(store);
      return parsed?.state?.token ?? null;
    }
  } catch { /* ignore */ }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Server returned unexpected response (HTTP ${res.status})${text ? `: ${text.slice(0, 200)}` : ''}`
    );
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Request failed');
  }

  return { data: json.data as T, pagination: json.pagination };
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
};
