export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_VERSION = '/api/v1';

const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function getApiUrl() {
  if (typeof window === 'undefined') return API_URL;
  if (!API_URL) return '';

  try {
    const configuredUrl = new URL(API_URL);
    const pageIsLocal = LOCAL_API_HOSTS.has(window.location.hostname);
    const apiIsLocal = LOCAL_API_HOSTS.has(configuredUrl.hostname);

    if (apiIsLocal && !pageIsLocal) {
      return '';
    }
  } catch {
    return API_URL;
  }

  return API_URL;
}

function sanitizeErrorMessage(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  if (raw.includes('Cannot ') && (raw.includes(' /api/') || raw.includes(' /v1/') || raw.includes(' /v2/'))) {
    return 'This action is not available right now. Please try again later.';
  }
  if (/^[A-Z]+ \//.test(raw) || raw.startsWith('http')) return 'Something went wrong. Please try again.';
  if (raw.length > 200) return 'Something went wrong. Please try again.';
  return raw;
}

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let refreshRetries = 0;
const MAX_REFRESH_RETRIES = 3;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

async function redirectToLogin() {
  const refreshToken = localStorage.getItem('refresh_token');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  document.cookie = 'token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
  try {
    await fetch(`${getApiUrl()}${API_VERSION}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken || '' }),
    });
  } catch {}
  window.location.href = '/login';
}

function updateCookie(token: string) {
  document.cookie = `token=${token}; path=/; max-age=604800; samesite=lax`;
}

function scheduleTokenRefresh(token: string) {
  if (refreshTimer) clearTimeout(refreshTimer);
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = (payload.exp * 1000) - Date.now();
    const refreshIn = Math.max(expiresIn - 60_000, 10_000);
    refreshTimer = setTimeout(() => {
      const current = localStorage.getItem('token');
      if (current) {
        refreshAccessToken().catch(() => {});
      }
    }, refreshIn);
  } catch {}
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  const hadLocalRefreshToken = Boolean(refreshToken);
  const apiBaseUrl = getApiUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(`${apiBaseUrl}${API_VERSION}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
  clearTimeout(timeout);

  if (!res.ok) throw new Error('Refresh failed');

  const data = await res.json();
  if (hadLocalRefreshToken && data.access_token && data.refresh_token) {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    updateCookie(data.access_token);
    scheduleTokenRefresh(data.access_token);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('token-refreshed'));
  }
  refreshRetries = 0;
  return data.access_token || '';
}


const inflightCache = new Map<string, { promise: Promise<unknown>; expiry: number }>();

export interface FetchApiOptions extends RequestInit {
  timeout?: number;
}

// Many existing call sites still rely on the historical implicit response shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchApi<T = any>(endpoint: string, options: FetchApiOptions = {}, apiVersion?: string): Promise<T> {
  const version = apiVersion || API_VERSION;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiBaseUrl = getApiUrl();
  const requestTimeout = options.timeout ?? 15000;

  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  const isGetLike = !options.method || options.method === 'GET';
  const dedupeKey = isGetLike ? `${version}${endpoint}` : '';

  if (dedupeKey) {
    const cached = inflightCache.get(dedupeKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.promise as Promise<T>;
    }
  }
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${version}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }
  clearTimeout(timeout);

  if (response.status === 401 && typeof window !== 'undefined') {
    if (!endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/logout')) {
      if (refreshRetries >= MAX_REFRESH_RETRIES) {
        redirectToLogin();
        throw new Error('Session expired');
      }
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshRetries++;
          refreshPromise = refreshAccessToken();
        }
        const newToken = await refreshPromise!;

        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
        } else {
          delete headers['Authorization'];
        }
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), requestTimeout);
        try {
          response = await fetch(`${apiBaseUrl}${version}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
            signal: retryController.signal,
          });
        } finally {
          clearTimeout(retryTimeout);
        }
        isRefreshing = false;
        refreshPromise = null;
      } catch {
        isRefreshing = false;
        refreshPromise = null;
        redirectToLogin();
        throw new Error('Session expired');
      }
    } else if (!endpoint.startsWith('/auth/')) {
      redirectToLogin();
      throw new Error('Session expired');
    } else {
      throw new Error('Authentication failed');
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Something went wrong. Please try again.';
    try {
      const errorData = JSON.parse(errorText);
      const raw = Array.isArray(errorData.message) ? (errorData.message[0] || '') : (errorData.message || '');
      errorMessage = sanitizeErrorMessage(raw) || errorMessage;
    } catch {
      if (errorText.includes('Cannot')) {
        errorMessage = 'This action is not available right now. Please try again later.';
      } else if (response.status === 404) {
        errorMessage = 'The resource you\'re looking for doesn\'t exist.';
      } else if (response.status === 403) {
        errorMessage = 'You don\'t have permission to do this.';
      } else if (response.status === 409) {
        errorMessage = 'This conflicts with existing data. Please check and try again.';
      } else if (response.status === 400) {
        errorMessage = 'Please check your input and try again.';
      } else if (response.status >= 500) {
        errorMessage = 'Something went wrong on our end. Please try again later.';
      } else {
        errorMessage = 'Something went wrong. Please try again.';
      }
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  const result = !text ? undefined as T : (() => { try { return JSON.parse(text) as T; } catch { return text as unknown as T; } })();
  if (dedupeKey) {
    inflightCache.set(dedupeKey, { promise: Promise.resolve(result), expiry: Date.now() + 500 });
  }
  return result;
}

export function initTokenRefresh() {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (token) {
    updateCookie(token);
    scheduleTokenRefresh(token);
  }
}

export const auth = {
  register: (data: { email: string; password: string; name?: string; timezone?: string }) =>
    fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmailByToken: (token: string) =>
    fetchApi('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerification: (email: string) =>
    fetchApi('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordOtp: (email: string, code: string, newPassword: string) =>
    fetchApi('/auth/reset-password-otp', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (data: {
    name?: string;
    bio?: string;
    city?: string;
    organizationId?: string;
    userExperience?: string;
    onboardingCompleted?: boolean;
    onboardingSelections?: Record<string, unknown>;
  }) =>
    fetchApi('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};
