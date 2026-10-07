import { config } from '@/config';
import { t as translate } from 'i18next';
import { clientHeaders } from '../clientInfo';
import { CLIENT_ERROR_CODES, fetchWithTimeout, isRequestTimeoutError } from '../utils/fetchWithTimeout';
import { safeGetItem } from '../utils/safeAsyncStorage';
import type { ApiResponse } from './types';

const API_BASE_URL = config.API_URL;

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = await safeGetItem('access_token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...clientHeaders(),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    // 15 s deadline (Android's OkHttp has no read timeout of its own).
    const response = await fetchWithTimeout(url, config);

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return {
        error: `Server error: ${response.status} - Invalid JSON response`,
        status: response.status,
      };
    }

    if (!response.ok) {
      // REST error bodies carry a machine-readable `code` (e.g. NO_MEMBERSHIP,
      // UPGRADE_REQUIRED) next to the localized `error` text.
      return {
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
        status: response.status,
        code: typeof data.code === 'string' ? data.code : undefined,
        details: data,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    // No answer at all: a client-side code and a localized text (screens such
    // as login show `error` as is).
    const code = isRequestTimeoutError(error) ? CLIENT_ERROR_CODES.TIMEOUT : CLIENT_ERROR_CODES.NETWORK;
    const text = translate(`Errors.codes.${code}`, { defaultValue: '' });
    return {
      error: text || (error instanceof Error ? error.message : 'Network error'),
      status: 0,
      code,
    };
  }
}

export async function apiGet<T>(
  endpoint: string,
  headers?: Record<string, string>,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: 'GET',
    headers,
  });
}

export async function apiPost<T>(
  endpoint: string,
  body: any,
  headers?: Record<string, string>,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: any,
  headers?: Record<string, string>,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers,
  });
}

export async function apiDelete<T>(
  endpoint: string,
  headers?: Record<string, string>,
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: 'DELETE',
    headers,
  });
}
