/**
 * Хранилище токенов доступа и обновления.
 *
 * Токены живут в localStorage: приложение — учебное демо, а такой подход
 * не требует синхронного чтения cookies на сервере. Для production-версии
 * рекомендуется переносить refresh token в httpOnly cookie.
 */

const ACCESS_KEY = "finance.accessToken";
const REFRESH_KEY = "finance.refreshToken";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export const tokenStorage = {
  getAccess(): string | null {
    return safeGet(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return safeGet(REFRESH_KEY);
  },
  save(tokens: TokenPair): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
