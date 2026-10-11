import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "@/lib/session";
import prisma from "@/lib/db";
import { Tenant } from "@prisma/client";

export interface TenantApiGuardResult {
  authorized: boolean;
  response?: NextResponse;
  session?: SessionPayload;
  tenant?: Tenant;
}

/**
 * Validates authenticated session and cross-tenant RBAC permissions for /api/tenants/[tenant]/* routes.
 * 
 * Rules:
 * 1. Must have an active, unexpired session cookie (401 if missing/invalid).
 * 2. If user role is SUPER_ADMIN, access is granted to any tenant.
 * 3. Otherwise, session.tenantSlug must match the route's tenant slug (403 if IDOR/mismatch).
 * 4. Resolves and returns the verified Tenant model from database (404 if not found).
 */
export async function validateTenantApiAccess(
  tenantSlug: string
): Promise<TenantApiGuardResult> {
  if (!tenantSlug) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Tenant identifier is required" },
        { status: 400 }
      ),
    };
  }

  const session = await getSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "অননুমোদিত এক্সেস। অনুগ্রহ করে লগইন করুন।" },
        { status: 401 }
      ),
    };
  }

  const normalizedRouteSlug = tenantSlug.toLowerCase().trim();
  const normalizedUserSlug = (session.tenantSlug || "").toLowerCase().trim();

  // Cross-Tenant Authorization Guard (IDOR Protection)
  if (session.role !== "SUPER_ADMIN" && normalizedUserSlug !== normalizedRouteSlug) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "এই স্টোরের তথ্যে প্রবেশাধিকার আপনার নেই।" },
        { status: 403 }
      ),
    };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: normalizedRouteSlug },
  });

  if (!tenant) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "স্টোর পাওয়া যায়নি।" },
        { status: 404 }
      ),
    };
  }

  return {
    authorized: true,
    session,
    tenant,
  };
}
