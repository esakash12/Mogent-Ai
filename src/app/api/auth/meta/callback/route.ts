import { NextRequest, NextResponse } from "next/server";
import { handleMetaOAuthCallback } from "@/lib/meta/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawState = searchParams.get("state");

  let tenantSlug: string | null = null;
  let customBaseUrl: string | null = null;

  if (rawState) {
    try {
      // Decode base64url state payload
      const json = Buffer.from(rawState, "base64url").toString("utf-8");
      const parsed = JSON.parse(json);
      tenantSlug = parsed.tenantSlug;
      customBaseUrl = parsed.baseUrl;
    } catch {
      // Fallback for legacy "tenantSlug:state" format
      tenantSlug = rawState.split(":")[0];
    }
  }

  // Determine origin for redirect
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "localhost:3000";
  const isHttps =
    forwardedProto === "https" ||
    host.includes("ngrok") ||
    (host.includes(".") && !host.includes("localhost"));
  const protocol = isHttps ? "https" : "http";
  const baseUrl = customBaseUrl || `${protocol}://${host}`;

  if (!tenantSlug) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/${tenantSlug}/integrations?error=oauth_cancelled`
    );
  }

  try {
    await handleMetaOAuthCallback(code, tenantSlug, baseUrl);
    return NextResponse.redirect(
      `${baseUrl}/${tenantSlug}/integrations?success=facebook_connected`
    );
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/${tenantSlug}/integrations?error=oauth_failed`
    );
  }
}
