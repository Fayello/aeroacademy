export const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : 'http://127.0.0.1:4000';

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
    await fetch(`${API_URL}/auth/logout`, {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
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

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const isFormData = typeof window !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
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
        const retryTimeout = setTimeout(() => retryController.abort(), 15000);
        try {
          response = await fetch(`${API_URL}${endpoint}`, {
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
    let errorMessage = 'API request failed';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
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
  verifyEmail: (email: string, code: string) =>
    fetchApi('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resendOtp: (email: string) =>
    fetchApi('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email: string) =>
    fetchApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPasswordOtp: (email: string, code: string, newPassword: string) =>
    fetchApi('/auth/reset-password-otp', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (data: { name?: string; bio?: string; city?: string; organizationId?: string }) =>
    fetchApi('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};
