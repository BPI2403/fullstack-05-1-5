"use client";

/**
 * Auth-стор: состояние сессии пользователя и действия входа/выхода.
 *
 * Статус loading — идёт восстановление сессии по refresh token;
 * authenticated — пользователь известен; guest — сессии нет.
 * Гварды маршрутов переключаются по этому статусу.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiFetch,
  setUnauthorizedHandler,
} from "@/shared/api/client";
import { tokenStorage } from "@/shared/api/token-storage";
import type { User } from "./types";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  status: AuthStatus;
  user: User | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthContextValue extends AuthState {
  actions: AuthActions;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponsePayload {
  access_token: string;
  refresh_token: string;
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  // Восстановление сессии при загрузке приложения.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStorage.getRefresh()) {
        setState({ status: "guest", user: null });
        return;
      }
      try {
        const user = await apiFetch<User>("/api/v1/auth/me", { auth: true });
        if (!cancelled) {
          setState({ status: "authenticated", user });
        }
      } catch {
        // apiFetch уже пытался обновить токены и очистил хранилище при неудаче.
        if (!cancelled) {
          setState({ status: "guest", user: null });
        }
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Реакция на окончательную потерю авторизации (истёк refresh token и т.п.).
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ status: "guest", user: null });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<AuthResponsePayload>("/api/v1/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      tokenStorage.save({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      setState({ status: "authenticated", user: data.user });
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const data = await apiFetch<AuthResponsePayload>("/api/v1/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          display_name: displayName || null,
        },
        auth: false,
      });
      tokenStorage.save({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      setState({ status: "authenticated", user: data.user });
    },
    [],
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    // Отзыв сессии важнее показа ошибки: чистим состояние в любом случае.
    if (refreshToken) {
      try {
        await apiFetch<void>("/api/v1/auth/logout", {
          method: "POST",
          body: { refresh_token: refreshToken },
          auth: false,
        });
      } catch {
        // ignore
      }
    }
    tokenStorage.clear();
    setState({ status: "guest", user: null });
  }, []);

  const actions = useMemo<AuthActions>(
    () => ({ login, register, logout }),
    [login, register, logout],
  );

  const value = useMemo(() => ({ ...state, actions }), [state, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен вызываться внутри AuthProvider");
  }
  return context;
}
