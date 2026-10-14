"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  guestToken: string | null;
  isLoading: boolean;
  isDemoMode: boolean;
  canUseDemoMode: boolean;
  isGuest: boolean;
  getAuthHeaders: () => Record<string, string>;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
  resetGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, demoModeEnabled = false }: { children: React.ReactNode; demoModeEnabled?: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-url.supabase.co" &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
  const canUseDemoMode = demoModeEnabled || (process.env.NODE_ENV !== "production" && !hasSupabaseConfig);

  const initGuestSession = useCallback(async () => {
    try {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("sculptor_guest_token") : null;
      const headers: Record<string, string> = {};
      if (storedToken) {
        headers["x-guest-token"] = storedToken;
      }

      const res = await fetch("/api/auth/guest", { headers });
      if (res.ok) {
        const data = await res.json();
        setGuestToken(data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("sculptor_guest_token", data.token);
        }

        const guestUser: User = {
          id: data.guestId,
          email: "guest@sculptor.ai",
          app_metadata: {},
          user_metadata: { full_name: "Guest Creator" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User;

        const guestSession: Session = {
          access_token: data.token,
          token_type: "bearer",
          expires_in: 3600 * 24 * 30,
          refresh_token: data.token,
          user: guestUser,
        } as Session;

        setUser(guestUser);
        setSession(guestSession);
        setIsGuest(true);
        setIsDemoMode(false);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback guest session in-memory
    }

    // Emergency local fallback guest
    const localId = typeof window !== "undefined"
      ? localStorage.getItem("sculptor_guest_id") || "usr_guest_fallback"
      : "usr_guest_fallback";
    const emergencyUser = {
      id: localId,
      email: "guest@sculptor.ai",
      app_metadata: {},
      user_metadata: { full_name: "Guest Creator" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;

    setUser(emergencyUser);
    setIsGuest(true);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (demoModeEnabled) {
      setIsDemoMode(true);
      setUser({
        id: "usr_demo_artist",
        email: "artist@sculptor.ai",
        app_metadata: {},
        user_metadata: { full_name: "Blender Artist" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      setIsLoading(false);
      return;
    }

    // Check if Supabase keys exist
    if (!hasSupabaseConfig) {
      if (process.env.NODE_ENV !== "production" && canUseDemoMode) {
        initGuestSession();
      } else {
        initGuestSession();
      }
      return;
    }

    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          setSession(session);
          setUser(session.user);
          setIsGuest(false);
          setIsLoading(false);
        } else {
          initGuestSession();
        }
      }).catch(() => {
        initGuestSession();
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session && session.user) {
            setSession(session);
            setUser(session.user);
            setIsGuest(false);
            setIsLoading(false);
          } else {
            initGuestSession();
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      initGuestSession();
    }
  }, [demoModeEnabled, hasSupabaseConfig, canUseDemoMode, initGuestSession]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = session?.access_token || guestToken || (typeof window !== "undefined" ? localStorage.getItem("sculptor_guest_token") : null);
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        "x-guest-token": token,
      };
    }
    return {};
  }, [session, guestToken]);

  const signIn = async (email: string, pass: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: name },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    await resetGuestSession();
  };

  const resetGuestSession = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sculptor_guest_token");
    }
    setIsLoading(true);
    await initGuestSession();
  };

  const enableDemoMode = () => {
    if (!canUseDemoMode) return;
    setIsDemoMode(true);
    setIsGuest(false);
    setUser({
      id: "usr_demo_artist",
      email: "demo@sculptor.ai",
      app_metadata: {},
      user_metadata: { full_name: "Demo 3D Creator" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        guestToken,
        isLoading,
        isDemoMode,
        canUseDemoMode,
        isGuest,
        getAuthHeaders,
        signIn,
        signUp,
        signOut,
        enableDemoMode,
        resetGuestSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
