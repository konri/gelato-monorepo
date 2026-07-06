import { config } from "@/config";
import { logger } from "@/utils/logger";
import { resolveBearerAccessToken } from "@/shared/api-client/src/graphql/authTokenCache";
import { scheduleForcedLogoutForInvalidServerSession } from "@/shared/api-client/src/graphql/apollo-client";
import { AUTH_ERROR_CODE, type ApiResponse } from "./types";

const REST_AUTH_FREE_ENDPOINTS = [
  "/authorization/login",
  "/authorization/signup",
  "/authorization/verify-code",
  "/authorization/resend-verification",
  "/authorization/forgot-password-code",
  "/authorization/reset-password-with-code",
];

const isAuthFreeEndpoint = (endpoint: string): boolean =>
  REST_AUTH_FREE_ENDPOINTS.some((prefix) => endpoint.startsWith(prefix));

const API_BASE_URL = config.API_URL;

type LogLevel = "debug" | "warn" | "error";

const logRequest = (
  level: LogLevel,
  prefix: string,
  method: string,
  endpoint: string,
  duration?: number,
  data?: Record<string, unknown>
) => {
  const durationText = duration !== undefined ? ` (${duration}ms)` : "";
  const message = `[REST ${prefix}] ${method} ${endpoint}${durationText}`;
  const logData = {
    method,
    endpoint,
    ...(duration !== undefined && { duration: `${duration}ms` }),
    ...data,
  };

  logger[level](message, JSON.stringify(logData, null, 2));
};

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || "GET";
  const startTime = Date.now();

  const token = await resolveBearerAccessToken();

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const defaultHeaders = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const requestConfig: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include",
  };

  const logHeaders: Record<string, string> =
    requestConfig.headers instanceof Headers
      ? (() => {
          const obj: Record<string, string> = {};
          requestConfig.headers.forEach((value, key) => {
            obj[key] = value;
          });
          return obj;
        })()
      : Array.isArray(requestConfig.headers)
        ? Object.fromEntries(requestConfig.headers)
        : (requestConfig.headers as Record<string, string>) || {};

  let logBody: unknown;
  if (isFormData) {
    logBody = "[FormData]";
  } else if (options.body && typeof options.body === "string") {
    try {
      logBody = JSON.parse(options.body);
    } catch {
      logBody = "[unparsed body]";
    }
  } else {
    logBody = options.body;
  }

  logRequest("debug", "Request", method, endpoint, undefined, {
    url,
    headers: logHeaders,
    body: logBody,
  });

  try {
    const response = await fetch(url, requestConfig);
    const duration = Date.now() - startTime;

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      logRequest("error", "Parse Error", method, endpoint, duration, {
        status: response.status,
        error: "Invalid JSON response",
      });
      return {
        error: `Server error: ${response.status} - Invalid JSON response`,
        status: response.status,
      };
    }

    if (!response.ok) {
      const errorMessage =
        data.error || data.message || `HTTP error! status: ${response.status}`;
      const rawCode = data.code;
      const errorCode =
        rawCode === AUTH_ERROR_CODE.EMAIL_EXISTS_UNVERIFIED ||
        rawCode === AUTH_ERROR_CODE.EMAIL_EXISTS_VERIFIED
          ? rawCode
          : undefined;
      logRequest("warn", "Error", method, endpoint, duration, {
        status: response.status,
        error: errorMessage,
        response: data,
      });
      if (
        response.status === 401 &&
        token &&
        !isAuthFreeEndpoint(endpoint)
      ) {
        scheduleForcedLogoutForInvalidServerSession(
          `HTTP 401 on REST ${method} ${endpoint}`,
        );
      }
      return {
        error: errorMessage,
        status: response.status,
        ...(errorCode !== undefined ? { errorCode } : {}),
      };
    }

    logRequest("debug", "Response", method, endpoint, duration, {
      status: response.status,
      data,
    });

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Network error";
    logRequest("error", "Network Error", method, endpoint, duration, {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      error: errorMessage,
      status: 0,
    };
  }
}

export async function apiGet<T>(
  endpoint: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "GET",
    headers,
  });
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "POST",
    body: formData,
    headers,
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
    headers,
  });
}

export async function apiDelete<T>(
  endpoint: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "DELETE",
    headers,
  });
}
