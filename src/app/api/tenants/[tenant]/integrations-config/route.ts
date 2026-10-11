import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function GET(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const masterConfig = await prisma.superAdminConfig.findFirst();
    const metaConfigured = Boolean(
      masterConfig?.metaAppId?.trim() || process.env.META_APP_ID?.trim()
    );

    const whatsappConfigured = Boolean(masterConfig?.metaConfigId?.trim());

    return NextResponse.json({
      success: true,
      config: {
        allowedDomains: tenant.allowedDomains || "",
        steadfastConfigured: Boolean(tenant.steadfastApiKey && tenant.steadfastSecretKey),
        steadfastApiKey: tenant.steadfastApiKey ? "••••••••" + tenant.steadfastApiKey.slice(-4) : "",
        pathaoConfigured: Boolean(tenant.pathaoClientId && tenant.pathaoClientSecret),
        pathaoClientId: tenant.pathaoClientId ? "••••••••" + tenant.pathaoClientId.slice(-4) : "",
        metaConfigured,
        whatsappConfigured,
        metaAppId: masterConfig?.metaAppId?.trim() || process.env.META_APP_ID?.trim() || "",
        metaConfigId: masterConfig?.metaConfigId?.trim() || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const {
      allowedDomains,
      steadfastApiKey,
      steadfastSecretKey,
      pathaoClientId,
      pathaoClientSecret,
    } = body;

    const dataToUpdate: any = {};
    if (allowedDomains !== undefined) dataToUpdate.allowedDomains = allowedDomains;
    if (steadfastApiKey !== undefined) dataToUpdate.steadfastApiKey = steadfastApiKey;
    if (steadfastSecretKey !== undefined) dataToUpdate.steadfastSecretKey = steadfastSecretKey;
    if (pathaoClientId !== undefined) dataToUpdate.pathaoClientId = pathaoClientId;
    if (pathaoClientSecret !== undefined) dataToUpdate.pathaoClientSecret = pathaoClientSecret;

    const updated = await prisma.tenant.update({
      where: { slug: params.tenant },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: "ইন্টিগ্রেশন কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!",
      allowedDomains: updated.allowedDomains,
      steadfastConfigured: Boolean(updated.steadfastApiKey && updated.steadfastSecretKey),
      pathaoConfigured: Boolean(updated.pathaoClientId && updated.pathaoClientSecret),
    });
  } catch (error: any) {
    console.error("Integrations config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configuration" },
      { status: 500 }
    );
  }
}
