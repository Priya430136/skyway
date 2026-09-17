import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "passenger" | "ops" | "support" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  passenger: "/app",
  ops: "/ops",
  support: "/support",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  passenger: "Passenger",
  ops: "Operations",
  support: "Support",
  admin: "Administrator",
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  roles: Role[];
};

type AuthSession = { access_token: string };
type ApiUser = { id: string; email: string; fullName: string; role: string };

type AuthState = {
  user: AppUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (email: string, password: string, role?: Role) => Promise<{ error: string | null }>;
  signInDemo: (role: Role) => void;
  switchRole: (role: Role) => void;
  signUp: (email: string, password: string, opts: { fullName?: string; role?: Role }) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);
const TOKEN_KEY = "skyway_access_token";
const USER_KEY = "skyway_authenticated_user";

function toRole(role: string): Role {
  if (role === "ADMIN") return "admin";
  if (role === "OPERATIONS") return "ops";
  if (role === "AGENT") return "support";
  return "passenger";
}

function toAppUser(apiUser: ApiUser): AppUser {
  const role = toRole(apiUser.role);
  const roles: Role[] = role === "admin"
    ? ["admin", "ops", "support", "passenger"]
    : role === "ops"
    ? ["ops", "passenger"]
    : role === "support"
    ? ["support", "passenger"]
    : ["passenger"];
  return { id: apiUser.id, email: apiUser.email, name: apiUser.fullName, role, roles };
}

async function authRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Authentication request failed.");
  return payload.data as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  const clearAuth = useCallback(() => {
    setSession(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const saveAuth = useCallback((token: string, nextUser: AppUser) => {
    setSession({ access_token: token });
    setUser(nextUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const refresh = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      clearAuth();
      return;
    }
    try {
      const response = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Session expired.");
      const payload = await response.json() as { user: ApiUser };
      saveAuth(token, toAppUser(payload.user));
    } catch {
      clearAuth();
    }
  }, [clearAuth, saveAuth]);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const signIn = useCallback<AuthState["signIn"]>(async (email, password) => {
    try {
      const result = await authRequest<{ user: ApiUser; token: string }>("/api/auth/login", { email, password });
      saveAuth(result.token, toAppUser(result.user));
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Authentication failed." };
    }
  }, [saveAuth]);

  const signUp = useCallback<AuthState["signUp"]>(async (email, password, opts) => {
    try {
      const result = await authRequest<{ user: ApiUser; token: string }>("/api/auth/register", {
        email,
        password,
        fullName: opts.fullName || email.split("@")[0],
      });
      saveAuth(result.token, toAppUser(result.user));
      return { error: null, needsConfirmation: false };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Registration failed.", needsConfirmation: false };
    }
  }, [saveAuth]);

  const signOut = useCallback(async () => clearAuth(), [clearAuth]);
  const signInDemo = useCallback((_role: Role) => undefined, []);
  const switchRole = useCallback((_role: Role) => undefined, []);
  const signInWithGoogle = useCallback(async () => ({ error: "Google sign-in is not configured for this deployment." }), []);
  const hasRole = useCallback((role: Role) => Boolean(user?.roles.includes(role)), [user]);

  const value = useMemo<AuthState>(() => ({
    user,
    session,
    isAuthenticated: Boolean(session && user),
    ready,
    signIn,
    signInDemo,
    switchRole,
    signUp,
    signInWithGoogle,
    signOut,
    hasRole,
    refresh,
  }), [user, session, ready, signIn, signInDemo, switchRole, signUp, signInWithGoogle, signOut, hasRole, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
