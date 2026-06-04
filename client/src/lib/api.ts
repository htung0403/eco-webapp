type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

type RefreshResponse = {
  access_token: string;
};

type RefreshResult = {
  token: string | null;
  sessionCleared: boolean;
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

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy API. Kiểm tra backend NestJS đang chạy (npm run start:dev trong thư mục server).',
  502: 'Không kết nối được backend. Chạy server trên cổng 3000 và restart Vite.',
  503: 'Backend tạm thời không khả dụng.',
};

const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    const fixedHost = fromEnv.replace(/\/\/localhost\b/i, '//127.0.0.1');
    const base = fixedHost.replace(/\/$/, '');
    return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
  }
  if (import.meta.env.DEV) return '/api/v1';
  return 'http://127.0.0.1:3000/api/v1';
};

export const API_BASE_URL = resolveApiBaseUrl();

const ACCESS_TOKEN_KEY = 'eco_access_token';
const REFRESH_TOKEN_KEY = 'eco_refresh_token';
const USER_PROFILE_KEY = 'eco_user_profile';

let refreshPromise: Promise<RefreshResult> | null = null;

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/login') return;

  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('redirect', returnTo);
  window.location.replace(`${loginUrl.pathname}${loginUrl.search}`);
};

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
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
};

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    const trimmed = text.trimStart();
    if (trimmed.startsWith('<!') || trimmed.startsWith('<html')) {
      return {
        message:
          'API trả về trang HTML (gọi nhầm frontend). Dùng proxy Vite (/api/v1) hoặc VITE_API_URL=http://127.0.0.1:3000/api/v1',
      };
    }
    return { message: text.slice(0, 280) };
  }
}

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

  const requestPath = path.startsWith('/') ? path : `/${path}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${requestPath}`, buildRequest(token ?? getStoredAccessToken()));
  } catch {
    throw new ApiError(
      0,
      'Không kết nối được server. Kiểm tra backend (npm run start:dev trong server) và refresh trang.',
      null,
    );
  }

  if (response.status === 401 && requestPath !== '/auth/login' && requestPath !== '/auth/refresh') {
    const refreshResult = await refreshAccessToken();
    if (refreshResult.token) {
      try {
        response = await fetch(`${API_BASE_URL}${requestPath}`, buildRequest(refreshResult.token));
      } catch {
        throw new ApiError(0, 'Không kết nối được server sau khi làm mới phiên.', null);
      }
    } else if (!refreshResult.sessionCleared) {
      throw new ApiError(0, 'Không kết nối được server để làm mới phiên. Vui lòng thử lại khi mạng ổn định.', null);
    }
  }

  if (response.status === 401 && requestPath !== '/auth/login' && requestPath !== '/auth/refresh') {
    clearAuthSession();
    redirectToLogin();
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const fallback = STATUS_MESSAGES[response.status] ?? 'Yêu cầu thất bại. Vui lòng thử lại.';
    throw new ApiError(response.status, getErrorMessage(payload, fallback), payload);
  }

  return payload as T;
}

async function refreshAccessToken(): Promise<RefreshResult> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return { token: null, sessionCleared: false };

  refreshPromise ??= fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      const payload = await readResponsePayload(response);
      if (!response.ok) {
        clearAuthSession();
        return { token: null, sessionCleared: true };
      }

      const tokens = payload as RefreshResponse | null;
      if (!tokens?.access_token) {
        clearAuthSession();
        return { token: null, sessionCleared: true };
      }

      const storage = getBrowserStorage();
      storage?.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      return { token: tokens.access_token, sessionCleared: false };
    })
    .catch(() => {
      return { token: null, sessionCleared: false };
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
