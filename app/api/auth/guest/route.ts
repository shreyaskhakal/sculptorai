import { NextRequest, NextResponse } from "next/server";
import {
  createGuestSession,
  verifyGuestToken,
  GUEST_COOKIE_NAME,
} from "@/lib/security/guest-session";

export async function GET(req: NextRequest) {
  // Check if caller already has a valid guest session
  const cookieToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
  const headerToken = req.headers.get("x-guest-token");
  const existingToken = cookieToken || headerToken;

  if (existingToken) {
    const verified = verifyGuestToken(existingToken);
    if (verified) {
      return NextResponse.json({
        guestId: verified.guestId,
        token: existingToken,
        user: {
          id: verified.guestId,
          email: "guest@sculptor.ai",
          isGuest: true,
        },
      });
    }
  }

  // Mint a new cryptographically signed guest session
  const session = createGuestSession();
  const response = NextResponse.json({
    guestId: session.guestId,
    token: session.token,
    user: {
      id: session.guestId,
      email: "guest@sculptor.ai",
      isGuest: true,
    },
  });

  // Set persistent cookie (30 days)
  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: session.token,
    path: "/",
    sameSite: "lax",
    httpOnly: false, // Accessible to client JS for Blender token display
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
