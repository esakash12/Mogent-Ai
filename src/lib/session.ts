import crypto from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'mogent_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET must be configured in production!"
      );
    }
    return "mogent-ai-dev-session-key-fallback-only";
  }
  return secret;
}

export interface SessionPayload {
  userId: string;
  tenantId: string;
  tenantSlug: string;
  role: string;
  email: string;
  name: string;
  expiresAt: number;
}

/**
 * Sign payload and return HMAC-SHA256 authenticated token string
 */
export function signSessionToken(data: Omit<SessionPayload, 'expiresAt'>): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload: SessionPayload = { ...data, expiresAt };
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json, 'utf-8').toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verify HMAC signature and check expiration timestamp
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [base64Payload, signature] = token.split('.');
  if (!base64Payload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(base64Payload)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(json);

    // Check expiration (7-day cutoff)
    if (Date.now() > payload.expiresAt) {
      return null; // Expired session
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get current authenticated session from cookies (Server Components & Route Handlers)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifySessionToken(token);
}
