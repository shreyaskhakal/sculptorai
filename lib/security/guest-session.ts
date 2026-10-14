import crypto from "node:crypto";

/**
 * SculptorAI Secure Guest Session Manager
 * 
 * Implements cryptographic guest identity issuance and validation.
 * Ensures:
 * 1. Every guest has a unique, isolated UUID identity.
 * 2. Guest tokens are signed with HMAC-SHA256 to prevent client-forged tenant IDs.
 * 3. Visitors cannot access other visitors' private projects.
 * 4. Tokens are compatible with Bearer authorization (for the Blender add-on).
 */

export const GUEST_COOKIE_NAME = "sculptor_guest_token";

function getGuestSecret(): string {
  // Use dedicated secret, Supabase secret key, or a fallback persistent seed
  return (
    process.env.GUEST_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "sculptorai_guest_secret_seed_2026"
  );
}

/**
 * Computes an HMAC-SHA256 signature for a guest UUID.
 */
function computeSignature(guestId: string): string {
  const secret = getGuestSecret();
  return crypto.createHmac("sha256", secret).update(guestId).digest("hex");
}

export interface GuestSession {
  guestId: string;
  token: string;
  createdAt: string;
}

/**
 * Generates a new cryptographically signed guest session.
 * The guestId is a standard UUID v4, ensuring compatibility with PostgreSQL UUID columns.
 */
export function createGuestSession(customId?: string): GuestSession {
  const guestId = customId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customId)
    ? customId
    : crypto.randomUUID();

  const signature = computeSignature(guestId);
  const token = `gst_${guestId}.${signature}`;

  return {
    guestId,
    token,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verifies a guest token and extracts the validated guest UUID.
 * Returns null if the token format is invalid, signature is forged, or tampered with.
 */
export function verifyGuestToken(token: string | null | undefined): { guestId: string } | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const trimmed = token.trim();
  if (!trimmed.startsWith("gst_")) {
    return null;
  }

  const payload = trimmed.slice(4); // Remove "gst_"
  const dotIndex = payload.indexOf(".");
  if (dotIndex === -1) {
    return null;
  }

  const guestId = payload.slice(0, dotIndex);
  const signature = payload.slice(dotIndex + 1);

  // Validate that guestId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(guestId)) {
    return null;
  }

  const expectedSignature = computeSignature(guestId);

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expBuffer.length) {
      return null;
    }

    if (crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      return { guestId };
    }
  } catch {
    return null;
  }

  return null;
}
