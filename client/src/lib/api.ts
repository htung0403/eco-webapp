type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

type RefreshResponse = {
  access_token: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_API_URL = 'http://localhost:3000/api/v1';

const normalizeApiUrl = (value: string | undefined) => {
  const baseUrl = (value?.trim() || DEFAULT_API_URL).replace(/\/$/, '');
  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
};

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);
const ACCESS_TOKEN_KEY = 'eco_access_token';
const REFRESH_TOKEN_KEY = 'eco_refresh_token';
const USER_PROFILE_KEY = 'eco_user_profile';

let refreshPromise: Promise<string | null> | null = null;

const getBrowserStorage = () => {
  if (typeof window === 'undefined') return null;
  const hasLocalSession = Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));
  return hasLocalSession ? localStorage : sessionStorage;
};

const getStoredAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

const getStoredRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  [localStorage, sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_PROFILE_KEY);
  });
};

const getErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }

  return fallback;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, token, ...requestOptions } = options;
  const buildRequest = (accessToken: string | null) => ({
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let response = await fetch(`${API_URL}${path}`, buildRequest(token ?? getStoredAccessToken()));

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await fetch(`${API_URL}${path}`, buildRequest(refreshedToken));
    }
  }

  const contentType = response.headers.get('content-type');
  const payload = contentType?.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, getErrorMessage(payload, 'Server không phản hồi đúng định dạng.'), payload);
  }

  return payload as T;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  refreshPromise ??= fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) {
        clearAuthSession();
        return null;
      }

      const payload = await response.json() as RefreshResponse;
      const storage = getBrowserStorage();
      storage?.setItem(ACCESS_TOKEN_KEY, payload.access_token);
      return payload.access_token;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
