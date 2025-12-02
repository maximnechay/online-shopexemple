// lib/api/client.ts
/**
 * Centralized API client with CSRF protection
 */

let csrfToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Fetch CSRF token from server
 */
async function fetchCSRFToken(): Promise<string> {
  const now = Date.now();

  // Reuse token if still valid (30 min expiry)
  if (csrfToken && tokenExpiry > now) {
    return csrfToken;
  }

  try {
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    csrfToken = data.token;
    tokenExpiry = now + 30 * 60 * 1000; // 30 minutes

    return csrfToken!;
  } catch (error) {
    console.error('CSRF token fetch error:', error);
    throw error;
  }
}

// Export for FormData uploads (ImageUpload)
export { fetchCSRFToken };

/**
 * API POST request with CSRF protection
 */
export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const token = await fetchCSRFToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API PUT request with CSRF protection
 */
export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const token = await fetchCSRFToken();

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API DELETE request with CSRF protection
 */
export async function apiDelete<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token = await fetchCSRFToken();

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'x-csrf-token': token,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * API GET request (no CSRF needed)
 */
export async function apiGet<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Helper to manually get CSRF token (for custom requests)
 */
export { fetchCSRFToken as getCSRFToken };
