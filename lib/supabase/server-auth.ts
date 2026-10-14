import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "./server";
import { createClient } from "@supabase/supabase-js";
import {
  createGuestSession,
  verifyGuestToken,
  GUEST_COOKIE_NAME,
} from "../security/guest-session";

export interface AuthUser {
  id: string;
  email: string;
  isDemo?: boolean;
  isGuest?: boolean;
}

export function isSupabaseConfigured(): boolean {
  // Explicit demo mode uses only the labeled in-memory sandbox, even if
  // production credentials happen to be present in the environment.
  if (process.env.DEMO_MODE === "true") return false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes("placeholder-url") &&
    !url.includes("your-project.supabase.co") &&
    key &&
    !key.includes("placeholder-anon-key") &&
    !key.includes("your-supabase-anon-key")
  );
}

export function isDemoModeExplicitlyEnabled(): boolean {
  if (process.env.DEMO_MODE === "true") {
    return true;
  }
  // Allow zero-dependency offline mode only in non-production environments when Supabase is unconfigured
  if (process.env.NODE_ENV !== "production" && !isSupabaseConfigured()) {
    return true;
  }
  return false;
}

function getCookieValue(req: any, name: string): string | null {
  try {
    if (req.cookies && typeof req.cookies.get === "function") {
      const c = req.cookies.get(name);
      return typeof c === "string" ? c : c?.value ?? null;
    }
    const cookieHeader = req.headers?.get?.("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
      return match ? decodeURIComponent(match[1]) : null;
    }
  } catch {
    // Ignore cookie read error
  }
  return null;
}

/**
 * Extracts and verifies the user from:
 * 1. Bearer Token in Authorization header (for Blender add-on and API clients)
 * 2. Cryptographically signed Guest Token (header or cookie)
 * 3. Supabase Session Cookie (for authenticated sessions)
 * 4. Automatic secure guest session minting for anonymous visitors
 * 
 * Never trusts an unverified client-provided userId.
 * Strictly prevents demo token authentication bypass in production.
 */
export async function getAuthenticatedUser(
  req: NextRequest | any,
  options?: { allowGuestAutoMint?: boolean }
): Promise<{
  user: AuthUser | null;
  error?: string;
  statusCode?: number;
  guestToken?: string;
}> {
  const isConfigured = isSupabaseConfigured();
  const demoAllowed = isDemoModeExplicitlyEnabled();
  const authHeader = req.headers?.get?.("authorization");
  const isDemoHeader = req.headers?.get?.("x-demo-mode") === "true";

  // Check Bearer Token
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();

    // Check recognized demo token ONLY if demo mode is explicitly permitted on server
    if (token === "demo-token" || token === "demo_session_token" || token === "usr_demo_artist") {
      if (demoAllowed) {
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
        error: "Demo tokens are disabled in production mode. Valid Supabase Bearer token required.",
        statusCode: 401,
      };
    }

    // Check signed guest token (used by Blender add-on when paired with guest session)
    if (token.startsWith("gst_")) {
      const verified = verifyGuestToken(token);
      if (verified) {
        return {
          user: {
            id: verified.guestId,
            email: "guest@sculptor.ai",
            isDemo: false,
            isGuest: true,
          },
        };
      }
      return {
        user: null,
        error: "Invalid or forged guest authorization token.",
        statusCode: 401,
      };
    }

    if (isConfigured) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
        const client = createClient(supabaseUrl, supabaseKey, {
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
    } else {
      return { user: null, error: "Invalid authorization token", statusCode: 401 };
    }
  }

  // Check explicit demo header
  if (isDemoHeader) {
    if (demoAllowed) {
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
      error: "Client demo headers are disabled in production mode. Valid authorization required.",
      statusCode: 401,
    };
  }

  // Check Guest Session Cookie or Header
  const guestHeader = req.headers?.get?.("x-guest-token");
  const guestCookie = getCookieValue(req, GUEST_COOKIE_NAME);
  const guestCandidate = guestHeader || guestCookie;
  if (guestCandidate) {
    const verified = verifyGuestToken(guestCandidate);
    if (verified) {
      return {
        user: {
          id: verified.guestId,
          email: "guest@sculptor.ai",
          isDemo: false,
          isGuest: true,
        },
      };
    }
  }

  // Check Supabase Session Cookies
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

  // In production mode, requests without a valid session token, guest token, or cookie must be rejected with 401
  if (process.env.NODE_ENV === "production" && !options?.allowGuestAutoMint) {
    return {
      user: null,
      error: "Authentication required. A valid guest session or user account is required.",
      statusCode: 401,
    };
  }

  // In development/test environments, mint a secure signed guest session for seamless public access
  const guest = createGuestSession();
  return {
    user: {
      id: guest.guestId,
      email: "guest@sculptor.ai",
      isDemo: false,
      isGuest: true,
    },
    guestToken: guest.token,
  };
}
