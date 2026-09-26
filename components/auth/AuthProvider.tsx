"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check if Supabase keys exist
    const hasKeys =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-url.supabase.co";

    if (!hasKeys) {
      // Local fallback / demo mode
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

    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    } catch {
      setIsDemoMode(true);
      setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (isDemoMode) {
      setUser({
        id: "usr_demo_artist",
        email,
        app_metadata: {},
        user_metadata: { full_name: email.split("@")[0] },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      return {};
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, pass: string, name?: string) => {
    if (isDemoMode) {
      setUser({
        id: "usr_demo_artist",
        email,
        app_metadata: {},
        user_metadata: { full_name: name || email.split("@")[0] },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      return {};
    }

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
    if (!isDemoMode) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
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
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        enableDemoMode,
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
