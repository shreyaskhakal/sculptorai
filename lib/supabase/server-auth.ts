import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "./server";
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  isDemo?: boolean;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes("placeholder-url") &&
    !url.includes("your-project.supabase.co") &&
    anonKey &&
    !anonKey.includes("placeholder-anon-key") &&
    !anonKey.includes("your-supabase-anon-key")
  );
}

/**
 * Extracts and verifies the authenticated user from either:
 * 1. Bearer Token in Authorization header (for Blender add-on and API clients)
 * 2. Supabase Session Cookie (for web Studio and Dashboard)
 * 
 * Never trusts a client-provided userId parameter.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<{
  user: AuthUser | null;
  error?: string;
  statusCode?: number;
}> {
  const isConfigured = isSupabaseConfigured();
  const authHeader = req.headers.get("authorization");
  const isDemoHeader = req.headers.get("x-demo-mode") === "true";

  // Check Bearer Token
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();

    // Check explicitly recognized demo token
    if (token === "demo-token" || token === "demo_session_token" || token === "usr_demo_artist") {
      return {
        user: {
          id: "usr_demo_artist",
          email: "artist@sculptor.ai",
          isDemo: true,
        },
      };
    }

    if (isConfigured) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
        });

        const { data, error } = await client.auth.getUser(token);
        if (error || !data.user) {
          return { user: null, error: "Invalid or expired authorization token", statusCode: 401 };
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || "",
            isDemo: false,
          },
        };
      } catch (err: unknown) {
        return { user: null, error: "Token verification failed", statusCode: 401 };
      }
    }
  }

  // Check Session Cookies
  if (isConfigured) {
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user) {
        return {
          user: {
            id: data.user.id,
            email: data.user.email || "",
            isDemo: false,
          },
        };
      }
    } catch {
      // Cookie parsing error
    }
  }

  // If Supabase is not configured yet or explicit Demo Mode is requested
  if (!isConfigured || isDemoHeader) {
    return {
      user: {
        id: "usr_demo_artist",
        email: "artist@sculptor.ai",
        isDemo: true,
      },
    };
  }

  return {
    user: null,
    error: "Unauthorized. Authentication session or Bearer token is required.",
    statusCode: 401,
  };
}
