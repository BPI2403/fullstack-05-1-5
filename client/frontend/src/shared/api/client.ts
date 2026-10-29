/**
 * HTTP-клиент к FastAPI backend.
 *
 * Умеет: прикреплять Bearer access token, единообразно разбирать ошибки
 * (включая ошибки валидации 422 в объект с ошибками по полям) и автоматически
 * обновлять access token по refresh token при ответе 401 с повтором запроса.
 *
 * Слой shared не знает об auth-сторе: при окончательной неудаче обновления
 * клиент вызывает обработчик, зарегистрированный через setUnauthorizedHandler
 * (его устанавливает entities/user).
 */

import { tokenStorage, type TokenPair } from "./token-storage";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  /** Ошибки валидации по полям (из 422 ответа FastAPI). */
  fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Регистрирует реакцию на окончательную потерю авторизации (см. entities/user). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Прикрепить Bearer access token. */
  auth?: boolean;
}

interface ErrorResponse {
  detail?: string | Array<{ loc: (string | number)[]; msg: string }>;
}

function extractError(status: number, payload: ErrorResponse): ApiError {
  const detail = payload.detail;
  if (typeof detail === "string") {
    return new ApiError(status, detail);
  }
  if (Array.isArray(detail)) {
    // FastAPI 422: список ошибок по полям тела запроса.
    const fields: Record<string, string> = {};
    for (const item of detail) {
      const fieldName = item.loc[item.loc.length - 1];
      if (typeof fieldName === "string" && !fields[fieldName]) {
        fields[fieldName] = item.msg;
      }
    }
    return new ApiError(status, "Проверьте правильность заполнения полей", fields);
  }
  return new ApiError(status, "Неизвестная ошибка запроса");
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as ErrorResponse;
    return extractError(response.status, payload);
  } catch {
    return new ApiError(response.status, `Ошибка запроса (${response.status})`);
  }
}

/**
 * Обновляет пару токенов по refresh token. Возвращает true при успехе.
 * Refresh-роутация: бэкенд выдаёт новую пару токенов.
 */
async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      tokenStorage.clear();
      unauthorizedHandler?.();
      return false;
    }
    const tokens = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };
    const pair: TokenPair = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
    tokenStorage.save(pair);
    return true;
  } catch {
    tokenStorage.clear();
    unauthorizedHandler?.();
    return false;
  }
}

export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  const { method = "GET", body, auth = true } = request;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const accessToken = tokenStorage.getAccess();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Access token истёк: пробуем обновить пару токенов и повторить запрос один раз.
  if (response.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      headers.Authorization = `Bearer ${tokenStorage.getAccess()}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }
  }

  if (!response.ok) {
    const error = await parseError(response);
    if (response.status === 401) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
