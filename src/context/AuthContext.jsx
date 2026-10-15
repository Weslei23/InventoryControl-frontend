import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { AuthAPI } from "../api/auth";
import { UsersAPI } from "../api/users";
import { extractErrorMessage, FORBIDDEN_EVENT } from "../api/client";
import { ROLES } from "./permissions";

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem("ic_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("ic_token"));
  const [user, setUser] = useState(readStoredUser);
  // `ready` is false while the session profile (role + effective permissions) is being confirmed.
  const [ready, setReady] = useState(() => !localStorage.getItem("ic_token"));
  const refreshing = useRef(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_user");
    setToken(null);
    setUser(null);
  }, []);

  const persistUser = useCallback((next) => {
    localStorage.setItem("ic_user", JSON.stringify(next));
    setUser(next);
  }, []);

  // GET /users/me — role and effective permissions. Permissions are re-read from the database by the
  // backend on every request, so this is the source of truth. Returns false when the session is dead.
  const refreshProfile = useCallback(async () => {
    if (refreshing.current) return true;
    refreshing.current = true;
    try {
      const me = await UsersAPI.me();
      persistUser({
        id: me.id,
        username: me.username,
        email: me.email,
        role: me.role,
        permissions: me.effectivePermissions || [],
      });
      return true;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        // The backend answers 403 for an invalid/expired token (and for a deleted user).
        clearSession();
        return false;
      }
      // Network error etc.: keep the cached profile.
      return true;
    } finally {
      refreshing.current = false;
    }
  }, [persistUser, clearSession]);

  // Confirm the stored session on startup.
  useEffect(() => {
    let alive = true;
    if (!localStorage.getItem("ic_token")) return undefined;
    refreshProfile().finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any 403 on a business call -> re-check the session/permissions (see api/client.js).
  useEffect(() => {
    const onForbidden = () => {
      refreshProfile();
    };
    window.addEventListener(FORBIDDEN_EVENT, onForbidden);
    return () => window.removeEventListener(FORBIDDEN_EVENT, onForbidden);
  }, [refreshProfile]);

  const login = useCallback(
    async (email, password) => {
      const data = await AuthAPI.login({ email, password });
      const jwt = data.token;
      const claims = decodeJwtPayload(jwt) || {};
      localStorage.setItem("ic_token", jwt);
      // Provisional profile from the token while /users/me is loading.
      const provisional = {
        id: claims.userId ?? null,
        email: claims.sub || email,
        username: claims.sub?.split("@")[0] || email.split("@")[0],
        role: ROLES.USER,
        permissions: [],
      };
      persistUser(provisional);
      setToken(jwt);
      try {
        const me = await UsersAPI.me();
        const full = {
          id: me.id,
          username: me.username,
          email: me.email,
          role: me.role,
          permissions: me.effectivePermissions || [],
        };
        persistUser(full);
        setReady(true);
        return full;
      } catch {
        setReady(true);
        return provisional;
      }
    },
    [persistUser]
  );

  const register = useCallback(async (username, email, password) => {
    return AuthAPI.register({ username, email, password });
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => {
    const permissions = new Set(user?.permissions || []);
    return {
      token,
      user,
      ready,
      isAuthenticated: !!token,
      role: user?.role || ROLES.USER,
      isSuperUser: user?.role === ROLES.SUPER_USER,
      isAdmin: user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_USER,
      permissions,
      can: (permission) => permissions.has(permission),
      canAny: (...list) => list.some((p) => permissions.has(p)),
      hasNoPermissions: permissions.size === 0,
      login,
      register,
      logout,
      refreshProfile,
    };
  }, [token, user, ready, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { extractErrorMessage };
