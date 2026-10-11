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

    const { fields } = await request.json();

    await prisma.aiSetting.upsert({
      where: { tenantId: tenant.id },
      update: { orderFieldsJson: fields },
      create: {
        tenantId: tenant.id,
        orderFieldsJson: fields,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save order fields error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
