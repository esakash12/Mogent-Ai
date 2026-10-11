import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { validateTenantApiAccess } from "@/lib/api-guard";

export async function POST(
  request: Request,
  { params }: { params: { tenant: string } }
) {
  try {
    const auth = await validateTenantApiAccess(params.tenant);
    if (!auth.authorized) return auth.response!;
    const tenant = auth.tenant!;

    const { aiActive } = await request.json();

    const updatedSetting = await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: { aiActive: Boolean(aiActive) },
      create: {
        tenantId: tenant.id,
        aiActive: Boolean(aiActive),
      },
    });

    return NextResponse.json({ success: true, aiActive: updatedSetting.aiActive });
  } catch (error) {
    console.error("AI toggle error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
