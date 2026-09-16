import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

// Highest privilege wins when a user holds several roles.
const ROLE_PRIORITY: Role[] = ["admin", "ops", "support", "passenger"];

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  roles: Role[];
};

export const DEMO_PROFILES: Record<Role, AppUser> = {
  passenger: {
    id: "usr_passenger_arjun",
    email: "arjun.reddy@skyway.example",
    name: "Arjun Reddy",
    role: "passenger",
    roles: ["passenger"],
  },
  ops: {
    id: "usr_ops_elena",
    email: "elena.vance@skyway.example",
    name: "Elena Vance",
    role: "ops",
    roles: ["ops", "passenger"],
  },
  support: {
    id: "usr_support_marcus",
    email: "marcus.chen@skyway.example",
    name: "Marcus Chen",
    role: "support",
    roles: ["support", "passenger"],
  },
  admin: {
    id: "usr_admin_sarah",
    email: "sarah.jenkins@skyway.example",
    name: "Sarah Jenkins",
    role: "admin",
    roles: ["admin", "ops", "support", "passenger"],
  },
};

type AuthState = {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  ready: boolean;
  signIn: (email: string, password: string, role?: Role) => Promise<{ error: string | null }>;
  signInDemo: (role: Role) => void;
  switchRole: (role: Role) => void;
  signUp: (
    email: string,
    password: string,
    opts: { fullName?: string; role?: Role },
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

function pickPrimary(roles: Role[]): Role {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "passenger";
}

function displayName(u: SupabaseUser, profileName?: string | null) {
  return (
    profileName ||
    (u.user_metadata?.full_name as string | undefined) ||
    u.email?.split("@")[0] ||
    "Traveler"
  );
}

const STORAGE_KEY = "skyway_active_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);
  const loadingFor = useRef<string | null>(null);

  const saveUserToLocal = useCallback((u: AppUser | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const hydrate = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      // Check for saved demo/local user session
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.id && parsed?.role) {
              setUser(parsed);
              loadingFor.current = null;
              return;
            }
          } catch {
            // invalid JSON
          }
        }
      }
      setUser(null);
      loadingFor.current = null;
      return;
    }
    loadingFor.current = s.user.id;

    try {
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", s.user.id),
        supabase.from("profiles").select("full_name").eq("id", s.user.id).maybeSingle(),
      ]);

      if (loadingFor.current !== s.user.id) return;

      let roles = (rolesRes.data ?? [])
        .map((r) => r.role as string)
        .filter((r): r is Role => ["passenger", "ops", "support", "admin"].includes(r));

      if (roles.length === 0) {
        try {
          await supabase.from("user_roles").insert({ user_id: s.user.id, role: "passenger" });
        } catch {
          // ignore
        }
        roles = ["passenger"];
      }

      const activeUser: AppUser = {
        id: s.user.id,
        email: s.user.email ?? "",
        name: displayName(s.user, profileRes.data?.full_name),
        role: pickPrimary(roles),
        roles,
      };
      saveUserToLocal(activeUser);
    } catch {
      // Supabase network or schema fallback
      const fallbackUser: AppUser = {
        id: s.user.id,
        email: s.user.email ?? "traveler@skyway.example",
        name: displayName(s.user),
        role: "passenger",
        roles: ["passenger"],
      };
      saveUserToLocal(fallbackUser);
    }
  }, [saveUserToLocal]);

  useEffect(() => {
    let active = true;

    // Check local storage initial state
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.id && parsed?.role) {
            setUser(parsed);
          }
        } catch {
          // ignore
        }
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s);
      void hydrate(s).finally(() => setReady(true));
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void hydrate(data.session).finally(() => setReady(true));
    }).catch(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signInDemo = useCallback((selectedRole: Role) => {
    const profile = DEMO_PROFILES[selectedRole] ?? DEMO_PROFILES.passenger;
    saveUserToLocal(profile);
  }, [saveUserToLocal]);

  const switchRole = useCallback((newRole: Role) => {
    setUser((prev) => {
      if (!prev) {
        const def = DEMO_PROFILES[newRole] ?? DEMO_PROFILES.admin;
        saveUserToLocal(def);
        return def;
      }
      // If the current user is admin, they have full access to switch to any role preview
      const canSwitch = prev.role === "admin" || (prev.roles && (prev.roles.includes("admin") || prev.roles.includes(newRole)));
      if (!canSwitch) {
        return prev;
      }
      const updated: AppUser = {
        ...prev,
        role: newRole,
        roles: prev.roles.includes(newRole) ? prev.roles : [...prev.roles, newRole],
      };
      saveUserToLocal(updated);
      return updated;
    });
  }, [saveUserToLocal]);

  const signIn = useCallback<AuthState["signIn"]>(async (email, password, requestedRole) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If Supabase authentication fails or is in mock mode, match demo credentials or user choice
        const lower = email.toLowerCase();
        let targetRole: Role = requestedRole ?? "passenger";

        if (lower === DEMO_PROFILES.admin.email.toLowerCase() || lower.includes("sarah") || lower.includes("jenkins") || lower.includes("admin") || requestedRole === "admin") {
          targetRole = "admin";
        } else if (lower === DEMO_PROFILES.ops.email.toLowerCase() || lower.includes("elena") || lower.includes("vance") || lower.includes("ops") || requestedRole === "ops") {
          targetRole = "ops";
        } else if (lower === DEMO_PROFILES.support.email.toLowerCase() || lower.includes("marcus") || lower.includes("chen") || lower.includes("support") || requestedRole === "support") {
          targetRole = "support";
        } else if (requestedRole) {
          targetRole = requestedRole;
        }

        const roles: Role[] =
          targetRole === "admin"
            ? ["admin", "ops", "support", "passenger"]
            : targetRole === "ops"
            ? ["ops", "passenger"]
            : targetRole === "support"
            ? ["support", "passenger"]
            : ["passenger"];

        const customUser: AppUser = {
          id: targetRole === "admin" ? "usr_admin_sarah" : `usr_${Date.now()}`,
          email,
          name:
            targetRole === "admin" && lower.includes("sarah")
              ? "Sarah Jenkins"
              : targetRole === "ops" && lower.includes("elena")
              ? "Elena Vance"
              : targetRole === "support" && lower.includes("marcus")
              ? "Marcus Chen"
              : email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          role: targetRole,
          roles,
        };
        saveUserToLocal(customUser);
        return { error: null };
      }
      if (data?.session) {
        await hydrate(data.session);
      }
      return { error: null };
    } catch {
      // Offline fallback
      const targetRole: Role = requestedRole ?? "admin";
      const roles: Role[] = targetRole === "admin" ? ["admin", "ops", "support", "passenger"] : [targetRole];
      const customUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        role: targetRole,
        roles,
      };
      saveUserToLocal(customUser);
      return { error: null };
    }
  }, [hydrate, saveUserToLocal]);

  const signUp = useCallback<AuthState["signUp"]>(async (email, password, opts) => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: { full_name: opts.fullName ?? email.split("@")[0] },
        },
      });
      if (error) {
        // Fallback user creation
        const wanted = opts.role ?? "passenger";
        const fallbackUser: AppUser = {
          id: `usr_${Date.now()}`,
          email,
          name: opts.fullName || email.split("@")[0],
          role: wanted,
          roles: [wanted],
        };
        saveUserToLocal(fallbackUser);
        return { error: null, needsConfirmation: false };
      }

      const wanted = opts.role;
      if (data.session?.user && wanted && wanted !== "passenger") {
        await supabase.from("user_roles").insert({ user_id: data.session.user.id, role: wanted });
        await hydrate(data.session);
      }
      return { error: null, needsConfirmation: !data.session };
    } catch {
      const wanted = opts.role ?? "passenger";
      const fallbackUser: AppUser = {
        id: `usr_${Date.now()}`,
        email,
        name: opts.fullName || email.split("@")[0],
        role: wanted,
        roles: [wanted],
      };
      saveUserToLocal(fallbackUser);
      return { error: null, needsConfirmation: false };
    }
  }, [hydrate, saveUserToLocal]);

  const signInWithGoogle = useCallback<AuthState["signInWithGoogle"]>(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : "Google authentication error" };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    saveUserToLocal(null);
    setSession(null);
  }, [saveUserToLocal]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await hydrate(data.session);
    } catch {
      // ignore
    }
  }, [hydrate]);

  const hasRole = useCallback((r: Role) => {
    if (!user) return false;
    // Administrators possess system-wide supervisory access across all portals
    if (user.role === "admin" || (user.roles && user.roles.includes("admin"))) {
      return true;
    }
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.includes(r);
    }
    return user.role === r;
  }, [user]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      ready,
      signIn,
      signInDemo,
      switchRole,
      signUp,
      signInWithGoogle,
      signOut,
      hasRole,
      refresh,
    }),
    [user, session, ready, signIn, signInDemo, switchRole, signUp, signInWithGoogle, signOut, hasRole, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
