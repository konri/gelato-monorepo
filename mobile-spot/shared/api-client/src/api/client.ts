import { config } from '@/config';
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
    const response = await fetch(url, config);
    
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
      return {
        error: data.error || data.message || `HTTP error! status: ${response.status}`,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
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
