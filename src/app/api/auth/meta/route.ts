import { NextRequest, NextResponse } from "next/server";
import { getMetaOAuthUrl } from "@/lib/meta/oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant");

  if (!tenantSlug) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Detect public origin (handles ngrok https header, custom domain, or localhost)
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "localhost:3000";
  const isHttps =
    forwardedProto === "https" ||
    host.includes("ngrok") ||
    (host.includes(".") && !host.includes("localhost"));
  const protocol = isHttps ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  try {
    const oauthUrl = await getMetaOAuthUrl(tenantSlug, "default", baseUrl);
    if (!oauthUrl) {
      return NextResponse.redirect(
        new URL(`/${tenantSlug}/integrations?maintenance=FACEBOOK`, request.url)
      );
    }

    return NextResponse.redirect(oauthUrl);
  } catch (err) {
    console.error("Meta Auth Redirect Error:", err);
    return NextResponse.redirect(
      new URL(`/${tenantSlug}/integrations?maintenance=FACEBOOK`, request.url)
    );
  }
}
