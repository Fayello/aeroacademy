export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.access_token;
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If 401 and we have a refresh token, try to refresh once
  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken && !endpoint.startsWith('/auth/refresh')) {
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken();
        }
        const newToken = await refreshPromise!;
        isRefreshing = false;
        refreshPromise = null;

        // Retry with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      } catch {
        isRefreshing = false;
        refreshPromise = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'API request failed';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const auth = {
  register: (data: { email: string; password: string; name?: string }) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (data: { name?: string; bio?: string; city?: string; organizationId?: string }) => fetchApi('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) => fetchApi('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};
